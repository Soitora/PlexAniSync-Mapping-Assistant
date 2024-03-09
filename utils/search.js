import dotenv from "dotenv";
import path from "path";
import chalk from "chalk";
import yaml from "js-yaml";
import inquirer from "inquirer";
import clipboardy from "clipboardy";
import { promises as fsPromises } from "fs";

import { getEntryByTypeAndId as TMDB_getEntryByTypeAndId } from "../api/tmdb.js";
import { getEntryByTypeAndId as TVDB_getEntryByTypeAndId } from "../api/tvdb.js";
import { getUserConfig } from "./configHandler.js";

export async function searchUsingMetadataAgent(mediaType, metadataAgent, copyResults, saveResults) {
    try {
        const answer = await inquirer.prompt({
            type: "input",
            name: "mediaId",
            message: `Search for ${chalk.cyan(mediaType === "tv" ? "series" : "movies")} using a ${chalk.cyan(metadataAgent.toUpperCase())} ID`,
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
        const yamlOutput = await mediaSearch(mediaType, metadataAgent, mediaId);

        dotenv.config();
        if (!process.env.PLEX_HOST || !process.env.PLEX_TOKEN) {
            console.log(`Your ${chalk.red("PLEX_HOST")} or ${chalk.red("PLEX_TOKEN")} seems to be missing, ${chalk.blue("guid")} will be missing from the results.`);
        }

        await outputMethods(mediaType, metadataAgent, yamlOutput, copyResults, saveResults);
    } catch (error) {
        handleSearchError(error, mediaType, metadataAgent);
    }

    searchUsingMetadataAgent(mediaType, metadataAgent, copyResults, saveResults);
}

export async function mediaSearch(mediaType, metadataAgent, mediaId) {
    try {
        const { title, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons } = await metadataHandler(mediaType, mediaId, metadataAgent);

        const data = [
            {
                title,
                seasons: Array.from({ length: mediaType === "movie" ? 1 : seasons }, (_, i) => ({
                    season: i + 1,
                    "anilist-id": 0,
                })),
            },
        ];

        const yamlOutput = formatYamlOutput(data, { plex_guid, imdb_id, tmdb_id, tvdb_id, mediaType });

        return yamlOutput;
    } catch (error) {
        handleSearchError(error, mediaType, metadataAgent);
    }
}

function formatYamlOutput(data, { plex_guid, imdb_id, tmdb_id, tvdb_id, mediaType }) {
    try {
        const yamlOutput = yaml.dump(data, {
            quotingType: `"`,
            forceQuotes: true,
            indent: 2,
        });

        const guid_PLEX = plex_guid ? `\n  # guid: ${plex_guid}` : "";
        const url_IMDB = imdb_id ? `\n  # imdb: https://www.imdb.com/title/${imdb_id}/` : "";
        const url_TMDB = tmdb_id ? `\n  # tmdb: https://www.themoviedb.org/${mediaType}/${tmdb_id}` : "";
        const url_TVDB = tvdb_id ? `\n  # tvdb: https://www.thetvdb.com/dereferrer/${mediaType === "tv" ? "series" : "movie"}/${tvdb_id}` : "";

        const titleRegex = /^(\s*- title:.*)$/m;

        return yamlOutput.replace(titleRegex, `$1${guid_PLEX}${url_IMDB}${url_TMDB}${url_TVDB}`);
    } catch (error) {
        throw error;
    }
}

async function metadataHandler(mediaType, mediaId, metadataAgent) {
    let title, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons;

    try {
        if (metadataAgent == "tmdb") {
            ({ name: title, plex_guid, imdb_id, tmdb_id, tvdb_id, seasons } = await TMDB_getEntryByTypeAndId(mediaType, mediaId));
        }

        if (metadataAgent == "tvdb") {
            ({ name: title, plex_guid, imdb_id, tmdb_id, tvdb_id, seasons } = await TVDB_getEntryByTypeAndId(mediaType, mediaId));
        }

        return { title, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons };
    } catch (error) {
        throw error;
    }
}

export async function outputMethods(mediaType, metadataAgent, yamlOutput, copyResults, saveResults) {
    if (yamlOutput) {
        if (copyResults) {
            clipboardy.writeSync(yamlOutput.replace(/^/gm, "  ").replace(/^\s\s$/gm, "\n"));
            console.log(`${chalk.green("✓")} ${chalk.dim("Results copied to clipboard !")}`);
        }

        if (saveResults) {
            // Use getUserConfig to get the user configuration
            const userConfig = getUserConfig();

            const outputPath = `${userConfig.outputFilePath.replace(/\/$/, "")}/${mediaType === "tv" ? "series" : "movies"}-${metadataAgent}.en.yaml`;
            const outputDir = path.dirname(outputPath);

            await fsPromises.mkdir(outputDir, { recursive: true });
            await fsPromises.appendFile(outputPath, yamlOutput + "\n");

            console.log(`${chalk.green("✓")} ${chalk.dim(`Results saved to ${outputPath} !`)}`);
        }

        console.log("");
        console.log(chalk.yellowBright(yamlOutput));
    } else {
        console.warn(chalk.redBright("Output seems corrupted."));
    }
}

function handleSearchError(error, mediaType, metadataAgent) {
    if (error.errorCode === 404 || error.code == "ERR_NON_2XX_3XX_RESPONSE") {
        console.error(chalk.redBright(`❌ The requested ${mediaType === "tv" ? "series" : "movie"} could not be found, or does not exist.\n`));
    } else {
        console.error(chalk.redBright(`❌ An error occurred while handling ${mediaType} search for ${metadataAgent}: ${error.message}`));
        console.error(error.stack + "\n");
    }
}
