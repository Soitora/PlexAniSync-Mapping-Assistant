import chalk from "chalk";
import pjson from "pjson";
import inquirer from "inquirer";

import { importApi as TMDB_importApi } from "../api/tmdb.js";
import { importApi as TVDB_importApi } from "../api/tvdb.js";
import { getPlexMatch } from "../api/plex.js";
import { setUserConfigDefaults, getUserConfig } from "../utils/configHandler.js";

// Call setUserConfigDefaults if needed
setUserConfigDefaults();

// Use getUserConfig to get the user configuration
const userConfig = getUserConfig();

function showOpening() {
    console.log("\x1Bc");
    console.log(`${chalk.cyan("  PlexAniSync Mapping Assistant")} ${chalk.grey("- Debugging -")} ${pjson.version} \n`);
    console.log(chalk.grey(`  Created by ${chalk.bold("@Soitora")}`));
    console.log(chalk.grey(`  Made for contribution to: ${chalk.bold("https://github.com/RickDB/PlexAniSync-Custom-Mappings")}`));
    console.log(chalk.grey(`  Join the community here:  ${chalk.bold("https://discord.gg/a9cu5t5fKc")}\n`));
}

async function searchPrompt() {
    const hasTokenTmdb = process.env.TMDB_APIKEY;
    const hasTokenTvdb = process.env.TVDB_APIKEY;
    const hasTokenPlex = process.env.PLEX_HOST && process.env.PLEX_TOKEN;

    const questions = [
        {
            type: "list",
            name: "metadataAgent",
            message: "Select the metadata agent you want to use:",
            choices: [
                { name: "🎥 The Movie Database (TMDB)", value: "tmdb", disabled: hasTokenTmdb ? false : chalk.redBright("Your TMDB_APIKEY is missing") },
                { name: "🎥 TheTVDB.com (TVDB)", value: "tvdb", disabled: hasTokenTvdb ? false : chalk.redBright("Your TVDB_APIKEY is missing") },
                { name: "🎥 Plex.tv (PLEX)", value: "plex", disabled: hasTokenPlex ? false : chalk.redBright("Your PLEX_HOST or PLEX_TOKEN is missing") },
            ],
            default: userConfig.preferMetadata,
        },
        {
            type: "list",
            name: "mediaType",
            message: "Select the type of media you want to use:",
            choices: [
                { name: "📺 Series", value: "tv" },
                { name: "🍿 Movies", value: "movie" },
            ],
            default: userConfig.preferMedia,
        },
    ];

    const answers = await inquirer.prompt(questions);
    const metadataAgent = answers.metadataAgent;
    const mediaType = answers.mediaType;

    console.log("");

    debugUsingMetadataAgent(mediaType, metadataAgent);
}

async function fetchDetails(tmdb, tvdb, plex, mediaType, metadataAgent, mediaId) {
    try {
        if (metadataAgent === "tmdb") {
            const pathParameters = { [mediaType === "tv" ? "tv_id" : "movie_id"]: mediaId };
            const response = await tmdb[mediaType].getDetails({ pathParameters });
            console.log(response.data);
        } else if (metadataAgent === "tvdb") {
            const idKey = mediaType === "tv" ? "series" : "movies";
            const response = await tvdb[idKey].extended({ id: mediaId });
            console.log(response.data);
        } else if (metadataAgent === "plex") {
            const { response } = await getPlexMatch(mediaType, mediaId, "tmdb"); // Unnecessary to add support for TVDB here
            console.log(response);
        }
        console.log("");
        debugUsingMetadataAgent(mediaType, metadataAgent);
    } catch (error) {
        console.error(error);
        console.log("");
        debugUsingMetadataAgent(mediaType, metadataAgent);
    }
}

async function debugUsingMetadataAgent(mediaType, metadataAgent) {
    let displayAgent = metadataAgent;
    if (metadataAgent == "plex") displayAgent = "tmdb";

    const answer = await inquirer.prompt({
        type: "input",
        name: "mediaId",
        message: `Search for ${chalk.cyan(mediaType === "tv" ? "series" : "movies")} using a ${chalk.cyan(displayAgent.toUpperCase())} ID`,
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

    const tmdb = TMDB_importApi();
    const tvdb = TVDB_importApi();
    const plex = {}; // Assuming you have an importApi function for Plex as well

    await fetchDetails(tmdb, tvdb, plex, mediaType, metadataAgent, mediaId);
}

showOpening();
searchPrompt();
