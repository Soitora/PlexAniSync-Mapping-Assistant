import chalk from "chalk";
import pjson from "pjson";
import config from "config";
import inquirer from "inquirer";

import { searchUsingMetadataAgent } from "./utils/search.js";

// Set a fallback configuration in case the user config is not found
config.util.setModuleDefaults("userConfig", {
    preferMetadata: "tmdb",
    preferMedia: "tv",
    copyResults: true,
    saveResults: false,
});

const userConfig = config.get("userConfig");

const hasTokenTmdb = process.env.TMDB_APIKEY;
const hasTokenTvdb = process.env.TVDB_APIKEY;

function showOpening() {
    console.log("\x1Bc");
    console.log(`${chalk.cyan("  PlexAniSync Mapping Assistant")} ${pjson.version} \n`);
    console.log(chalk.grey(`  Created by ${chalk.bold("@Soitora")}`));
    console.log(chalk.grey(`  Made for contribution to: ${chalk.bold("https://github.com/RickDB/PlexAniSync-Custom-Mappings")}`));
    console.log(chalk.grey(`  Join the community here:  ${chalk.bold("https://discord.gg/a9cu5t5fKc")}\n`));
}

async function searchPrompt() {
    const questions = [
        {
            type: "list",
            name: "metadataAgent",
            message: "Select the metadata agent you want to use:",
            choices: [
                { name: "🎥 The Movie Database (TMDB)", value: "tmdb", disabled: hasTokenTmdb ? false : chalk.redBright("Your TMDB_APIKEY is missing") },
                { name: "🎥 TheTVDB.com (TVDB)", value: "tvdb", disabled: hasTokenTvdb ? false : chalk.redBright("Your TVDB_APIKEY is missing") },
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
        {
            type: "confirm",
            name: "copyResults",
            message: "Do you wish to copy the output to your clipboard?",
            default: userConfig.copyResults,
        },
        {
            type: "confirm",
            name: "saveResults",
            message: "Do you wish to save the output to a file?",
            default: userConfig.saveResults,
        },
    ];

    const answers = await inquirer.prompt(questions);

    const metadataAgent = answers.metadataAgent;
    const mediaType = answers.mediaType;
    const copyResults = answers.copyResults;
    const saveResults = answers.saveResults;

    console.log("");

    searchUsingMetadataAgent(mediaType, metadataAgent, copyResults, saveResults);
}

showOpening();
searchPrompt();
