import dotenv from "dotenv";
import path from "path";
import chalk from "chalk";
import yaml from "js-yaml";
import inquirer from "inquirer";
import clipboardy from "clipboardy";
import { promises as fsPromises } from "fs";

import { getEntryByTypeAndId as TMDB_getEntryByTypeAndId } from "../api/tmdb.js";
import { getEntryByTypeAndId as TVDB_getEntryByTypeAndId } from "../api/tvdb.js";
import { getPlexMatch as PLEX_getPlexMatch } from "../api/plex.js";
import { getUserConfig } from "./configHandler.js";

export async function searchUsingMetadataAgent(mediaType, metadataAgent, copyResults, saveResults, dualOutput) {
    try {
        const answer = await inquirer.prompt({
            type: "input",
            name: "mediaId",
            message: `Search for ${chalk.cyan(mediaType === "tv" ? "series" : "movies")} using a ${chalk.cyan(metadataAgent.toUpperCase())} ID`,
            prefix: mediaType === "tv" ? "📺" : "🍿",
            suffix: ":",
            validate: (input) => {
                if (metadataAgent === "plex") {
                    let plexUrlRegex;

                    switch (mediaType) {
                        case "tv":
                            plexUrlRegex = /^plex:\/\/show\/[a-f0-9]+$/;
                            break;
                        case "movie":
                            plexUrlRegex = /^plex:\/\/movie\/[a-f0-9]+$/;
                            break;
                    }

                    if (!plexUrlRegex.test(input)) {
                        return `Please enter a valid Plex ID in the format "plex://${mediaType === "tv" ? "show" : "movie"}/<ID>".`;
                    }

                    return true;
                } else {
                    const value = parseInt(input, 10);

                    if (isNaN(value) || value <= 0) {
                        return "Please enter a valid ID.";
                    }

                    return true;
                }
            },
        });

        const mediaId = answer.mediaId.trim();
        const { primaryOutput, secondaryOutput } = await mediaSearch(mediaType, metadataAgent, mediaId, saveResults, dualOutput);

        dotenv.config();
        if (!process.env.PLEX_HOST || !process.env.PLEX_TOKEN) {
            console.log(`Your ${chalk.red("PLEX_HOST")} or ${chalk.red("PLEX_TOKEN")} seems to be missing, ${chalk.blue("guid")} will be missing from the results.`);
        }

        await outputMethods(mediaType, metadataAgent, primaryOutput, secondaryOutput, copyResults, saveResults, dualOutput);
    } catch (error) {
        handleSearchError(error, mediaType, metadataAgent);
    }

    searchUsingMetadataAgent(mediaType, metadataAgent, copyResults, saveResults, dualOutput);
}

export async function mediaSearch(mediaType, metadataAgent, mediaId, dualOutput) {
    try {
        let primaryOutput, secondaryOutput;

        const { title, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons } = await metadataHandler(mediaType, mediaId, metadataAgent);

        const secondaryAgent = metadataAgent === "tmdb" ? "tvdb" : "tmdb";
        const secondaryMediaId = metadataAgent === "tmdb" ? tvdb_id : tmdb_id;

        let combinedTmdbId = tmdb_id;
        let combinedImdbId = imdb_id;
        let combinedTvdbId = tvdb_id;

        const data = [
            {
                title,
                seasons: Array.from({ length: mediaType === "movie" ? 1 : seasons }, (_, i) => ({
                    season: i + 1,
                    "anilist-id": 0,
                })),
            },
        ];

        // Check if required ID is missing
        if ((secondaryAgent === "tmdb" && !combinedTmdbId) || (secondaryAgent === "tvdb" && !combinedTvdbId)) {
            console.warn(chalk.redBright(`\n❌ ${metadataAgent.toUpperCase()} didn't report an ID for ${secondaryAgent.toUpperCase()}, skipping secondary output.\n`));
            dualOutput = false;
        }

        if (dualOutput) {
            const {
                title: secondaryTitle,
                tmdb_id: secondaryTmdb,
                imdb_id: secondaryImdb,
                tvdb_id: secondaryTvdb,
                seasons: secondarySeasons,
            } = await metadataHandler(mediaType, secondaryMediaId, secondaryAgent);

            const secondaryData = [
                {
                    title: secondaryTitle,
                    seasons: Array.from({ length: mediaType === "movie" ? 1 : secondarySeasons }, (_, i) => ({
                        season: i + 1,
                        "anilist-id": 0,
                    })),
                },
            ];

            // Combine metadata from both sources
            combinedTmdbId = combinedTmdbId || secondaryTmdb;
            combinedImdbId = combinedImdbId || secondaryImdb;
            combinedTvdbId = combinedTvdbId || secondaryTvdb;

            secondaryOutput = formatYamlOutput(secondaryData, { plex_guid, imdb_id: combinedImdbId, tmdb_id: combinedTmdbId, tvdb_id: combinedTvdbId, mediaType });
        }

        primaryOutput = formatYamlOutput(data, { plex_guid, imdb_id: combinedImdbId, tmdb_id: combinedTmdbId, tvdb_id: combinedTvdbId, mediaType });

        return { primaryOutput, secondaryOutput };
    } catch (error) {
        handleSearchError(error, mediaType, metadataAgent);
    }
}

function formatYamlOutput(data, { plex_guid, imdb_id, tmdb_id, tvdb_id, mediaType }) {
    try {
        const primaryOutput = yaml.dump(data, {
            quotingType: `"`,
            forceQuotes: true,
            indent: 2,
        });

        const guid_PLEX = plex_guid ? `\n  # guid: ${plex_guid}` : "";
        const url_IMDB = imdb_id ? `\n  # imdb: https://www.imdb.com/title/${imdb_id}/` : "";
        const url_TMDB = tmdb_id ? `\n  # tmdb: https://www.themoviedb.org/${mediaType}/${tmdb_id}` : "";
        const url_TVDB = tvdb_id ? `\n  # tvdb: https://www.thetvdb.com/dereferrer/${mediaType === "tv" ? "series" : "movie"}/${tvdb_id}` : "";

        const titleRegex = /^(\s*- title:.*)$/m;

        return primaryOutput.replace(titleRegex, `$1${guid_PLEX}${url_IMDB}${url_TMDB}${url_TVDB}`);
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

        if (metadataAgent == "plex") {
            ({ name: title, plex_guid, imdb_id, tmdb_id, tvdb_id, seasons } = await PLEX_getPlexMatch(mediaType, mediaId, "plex"));
        }

        return { title, plex_guid, tvdb_id, tmdb_id, imdb_id, seasons };
    } catch (error) {
        throw error;
    }
}

export async function outputMethods(mediaType, metadataAgent, primaryOutput, secondaryOutput, copyResults, saveResults, dualOutput) {
    if (primaryOutput) {
        if (copyResults) {
            clipboardy.writeSync(primaryOutput.replace(/^/gm, "  ").replace(/^\s\s$/gm, "\n"));
            console.log(`${chalk.green("✓")} ${chalk.dim("Results copied to clipboard !")}`);
        }

        if (saveResults) {
            // Use getUserConfig to get the user configuration
            const userConfig = getUserConfig();

            const outputPath = `${userConfig.outputFilePath.replace(/\/$/, "")}/${mediaType === "tv" ? "series" : "movies"}-${metadataAgent}.en.yaml`;
            const outputDir = path.dirname(outputPath);

            await fsPromises.mkdir(outputDir, { recursive: true });
            await fsPromises.appendFile(outputPath, primaryOutput + "\n");

            console.log(`${chalk.green("✓")} ${chalk.dim(`Results saved to ${outputPath} !`)}`);

            if (secondaryOutput && dualOutput) {
                const secondaryOutputPath = `${userConfig.outputFilePath.replace(/\/$/, "")}/${mediaType === "tv" ? "series" : "movies"}-${
                    metadataAgent === "tmdb" ? "tvdb" : "tmdb"
                }.en.yaml`;

                await fsPromises.mkdir(outputDir, { recursive: true });
                await fsPromises.appendFile(secondaryOutputPath, secondaryOutput + "\n");

                console.log(`${chalk.green("✓")} ${chalk.dim(`Results saved to ${secondaryOutputPath} !`)}`);
            }
        }

        console.log("");
        console.log(chalk.yellowBright(primaryOutput));
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
