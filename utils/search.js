import chalk from "chalk";
import yaml from "js-yaml";
import inquirer from "inquirer";
import clipboardy from "clipboardy";

import { getEntryByTypeAndId as TMDB_getEntryByTypeAndId } from "../api/tmdb.js";
import { getEntryByTypeAndId as TVDB_getEntryByTypeAndId } from "../api/tvdb.js";

export async function searchUsingMetadataAgent(mediaType, metadataAgent) {
    const answer = await inquirer.prompt({
        type: "input",
        name: "mediaId",
        message: `Search for ${chalk.cyan(mediaType === "tv" ? "series" : "movies")} using ${chalk.cyan(metadataAgent.toUpperCase())} ID`,
        prefix: mediaType === "tv" ? "📺" : "🍿",
        suffix: ":",
        validate: (input) => {
            const value = parseInt(input, 10);

            if (isNaN(value) || value <= 0) {
                return "Please enter a valid ID.";
            }

            return true;
        },
    });

    const mediaId = parseInt(answer.mediaId.trim());

    try {
        const { title, synonyms, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons } = await metadataHandler(mediaType, mediaId, metadataAgent);

        const data = [
            {
                title,
                ...(synonyms.length > 0 && { synonyms }),
                seasons: Array.from({ length: mediaType === "movie" ? 1 : seasons }, (_, i) => ({
                    season: i + 1,
                    "anilist-id": 0,
                })),
            },
        ];

        const yamlOutput = formatYamlOutput(data, { plex_guid, imdb_id, tmdb_id, tvdb_id, mediaType });

        console.log(`${chalk.green("✓")} ${chalk.dim("Results copied to clipboard!")}\n`);
        console.log(chalk.yellowBright(yamlOutput));

        if (!process.env.PLEX_HOST || !process.env.PLEX_TOKEN) {
            console.log(`Your ${chalk.red("PLEX_HOST")} or ${chalk.red("PLEX_TOKEN")} seems to be missing, ${chalk.blue("guid")} will be missing from the results.`);
        }

        clipboardy.writeSync(yamlOutput.replace(/^/gm, "  ").replace(/^\s\s$/gm, "\n"));
    } catch (error) {
        handleSearchError(error, mediaType, metadataAgent);
    }

    searchUsingMetadataAgent(mediaType, metadataAgent);
}

function formatYamlOutput(data, { plex_guid, imdb_id, tmdb_id, tvdb_id, mediaType }) {
    try {
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
    } catch (error) {
        throw error;
    }
}

async function metadataHandler(mediaType, mediaId, metadataAgent) {
    let title, synonyms, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons;

    try {
        if (metadataAgent == "tmdb") {
            ({ name: title, plex_guid, imdb_id, tmdb_id, tvdb_id, alternativeTitles: synonyms, seasons } = await TMDB_getEntryByTypeAndId(mediaType, mediaId));
        }

        if (metadataAgent == "tvdb") {
            ({ name: title, plex_guid, imdb_id, tmdb_id, tvdb_id, aliases: synonyms, seasons } = await TVDB_getEntryByTypeAndId(mediaType, mediaId));
        }

        return { title, synonyms, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons };
    } catch (error) {
        throw error;
    }
}

function handleSearchError(error, mediaType) {
    if (error.errorCode === 404 || error.code == "ERR_NON_2XX_3XX_RESPONSE") {
        console.error(chalk.red(`❌ The requested ${mediaType === "tv" ? "series" : "movie"} could not be found, or does not exist.\n`));
    } else {
        console.error(chalk.red(`❌ An error occurred while handling ${mediaType} search: ${error.message}`));
        console.error(error.stack + "\n");
    }
}
