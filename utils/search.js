import colors from "colors";
import yaml from "js-yaml";
import clipboardy from "clipboardy";

import { rl, answerSeries, answerMovie } from "./constants.js";
import { getFormattedTitles as TMDB_getFormattedTitles, getExternalIDs as TMDB_getExternalIDs, getDetails as TMDB_getDetails } from "./tmdbApi.js";

export async function searchForMedia(mediaType, metadataAgent) {
    const prompt = `\nEnter a ${metadataAgent + " ID:".bold} `;

    rl.question(prompt.cyan, async (mediaId) => {
        if (answerMovie.includes(mediaId.toLowerCase())) {
            console.log(`\nSearching for Movies 🎥`.yellow);
            searchForMedia("movie", metadataAgent);
        } else if (answerSeries.includes(mediaId.toLowerCase())) {
            console.log(`\nSearching for Series 📺`.yellow);
            searchForMedia("tv", metadataAgent);
        } else {
            await handleSearch(mediaType, mediaId, metadataAgent);
        }
    });
}

async function handleSearch(mediaType, mediaId, metadataAgent) {
    try {
        const { mediaName, formattedTitles, plex_guid, tvdb_id, tmdb_id, imdb_id, number_of_seasons } = await metadataHandler(mediaType, mediaId, metadataAgent);

        const data = [
            {
                title: mediaName,
                ...(formattedTitles.length > 0 && { synonyms: formattedTitles }),
                seasons: Array.from({ length: mediaType === "movie" ? 1 : number_of_seasons }, (_, i) => ({
                    season: i + 1,
                    "anilist-id": 0,
                })),
            },
        ];

        const yamlOutput = formatYamlOutput(data, { plex_guid, imdb_id, tmdb_id, tvdb_id, mediaType });

        console.log(`Results copied to clipboard!\n`.grey);
        console.log(yamlOutput.green);

        if (!process.env.PLEX_HOST || !process.env.PLEX_TOKEN) {
            console.log(`Your ${"PLEX_HOST".red} or ${"PLEX_TOKEN".red} seems to be missing, ${"guid".blue} will be missing from the results.`);
        }

        clipboardy.writeSync(yamlOutput.replace(/^/gm, "  ").replace(/^\s\s$/gm, "\n"));
    } catch (error) {
        handleSearchError(error, mediaType, metadataAgent);
    }

    searchForMedia(mediaType, metadataAgent);
}

function formatYamlOutput(data, { plex_guid, imdb_id, tmdb_id, tvdb_id, mediaType }) {
    const yamlOutput = yaml.dump(data, {
        quotingType: `"`,
        forceQuotes: true,
        indent: 2,
    });

    const url_IMDB = imdb_id ? `\n  # imdb: https://www.imdb.com/title/${imdb_id}/` : "";
    const url_TMDB = tmdb_id ? `\n  # tmdb: https://www.themoviedb.org/${mediaType}/${tmdb_id}` : "";
    const url_TVDB = tvdb_id ? `\n  # tvdb: https://www.thetvdb.com/dereferrer/${mediaType === "tv" ? "series" : "movie"}/${tvdb_id}` : "";
    const guid_PLEX = plex_guid ? `  # guid: ${plex_guid}\n` : "";

    const titleRegex = /^(\s*- title:.*)$/m;
    const seasonsRegex = /^(\s*seasons:.*)$/m;

    return yamlOutput.replace(titleRegex, `$1${url_IMDB}${url_TMDB}${url_TVDB}`).replace(seasonsRegex, `${guid_PLEX}$1`);
}

async function metadataHandler(mediaType, mediaId, metadataAgent) {
    let mediaName, formattedTitles, plex_guid, tvdb_id, tmdb_id, imdb_id, number_of_seasons, production_countries;

    if (metadataAgent == "TMDB") {
        ({ mediaName, production_countries, tmdb_id, number_of_seasons } = await TMDB_getDetails(mediaType, mediaId));

        const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);
        formattedTitles = await TMDB_getFormattedTitles(mediaType, mediaId, isoCodes, mediaName);

        ({ plex_guid, tvdb_id, imdb_id } = await TMDB_getExternalIDs(mediaType, mediaId));
    }

    if (metadataAgent == "TVDB") {
        /* Nothing yet */
    }

    return { mediaName, formattedTitles, plex_guid, tvdb_id, tmdb_id, imdb_id, number_of_seasons };
}

function handleSearchError(error, mediaType, metadataAgent) {
    if (error.errorCode === 404) {
        console.error(`The requested ${mediaType} does not exist. Error: ${error.message}`.red);
    } else {
        console.error(`An error occurred while handling ${mediaType} search: ${error.message}`.red);
        console.error(error.stack);
    }

    searchForMedia(mediaType, metadataAgent);
}
