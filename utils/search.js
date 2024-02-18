import colors from "colors";
import yaml from "js-yaml";
import clipboardy from "clipboardy";

import { rl, answerSeries, answerMovie } from "./constants.js";
import { getFormattedTitles, getExternalIDs, getDetails } from "./tmdbApi.js";

export async function searchForMedia(mediaType) {
    const prompt = `\nEnter a ${"TMDB ID:".bold} `;

    rl.question(prompt.cyan, async (mediaId) => {
        if (answerMovie.includes(mediaId.toLowerCase())) {
            console.log(`\nSearching for Movies 🎥`.yellow);
            mediaType = "movie";
            searchForMedia(mediaType);
        } else if (answerSeries.includes(mediaId.toLowerCase())) {
            console.log(`\nSearching for Series 📺`.yellow);
            mediaType = "tv";
            searchForMedia(mediaType);
        } else {
            handleSearch(mediaType, mediaId);
        }
    });
}

export async function handleSearch(mediaType, mediaId) {
    try {
        const { mediaName, production_countries, tmdb_id, number_of_seasons } = await getDetails(mediaType, mediaId);

        const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);
        const formattedTitles = await getFormattedTitles(mediaType, mediaId, isoCodes, mediaName);
        const { plex_guid, tvdb_id, imdb_id } = await getExternalIDs(mediaType, mediaId);

        const data = [
            {
                title: mediaName,
                ...(formattedTitles.length > 0 && { synonyms: formattedTitles }),
                seasons: [],
            },
        ];

        const seasonCount = mediaType === "movie" ? 1 : number_of_seasons;

        for (let seasonNumber = 1; seasonNumber <= seasonCount; seasonNumber++) {
            data[0].seasons.push({
                season: seasonNumber,
                "anilist-id": 0,
            });
        }

        let yamlOutput = yaml.dump(data, {
            quotingType: `"`,
            forceQuotes: true,
            indent: 2,
        });

        const guid_PLEX = plex_guid !== undefined && plex_guid !== null ? `\n  # guid: ${plex_guid}` : "";
        const url_TMDB = `\n  # TMDB: https://www.themoviedb.org/tv/${tmdb_id}`;
        const url_TVDB = tvdb_id ? `\n  # TVDB: https://www.thetvdb.com/dereferrer/series/${tvdb_id}` : "";
        const url_IMDB = imdb_id ? `\n  # IMDB: https://www.imdb.com/title/${imdb_id}/` : "";

        const titleRegex = /^(\s*- title:.*)$/m;
        yamlOutput = yamlOutput.replace(titleRegex, `$1${guid_PLEX}${url_TMDB}${url_TVDB}${url_IMDB}`);

        console.log(`Results copied to clipboard!\n`.grey);
        console.log(yamlOutput.green);

        clipboardy.writeSync(yamlOutput.replace(/^/gm, "  ").replace(/^\s\s$/gm, "\n"));
    } catch (error) {
        if (error.errorCode === 404) {
            console.error("The requested media does not exist.".red);
        } else {
            console.error("An error occurred:", error.message);
        }

        searchForMedia(mediaType);
    }

    searchForMedia(mediaType);
}
