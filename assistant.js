import chalk from "chalk";
import pjson from "pjson";
import inquirer from "inquirer";

import { searchUsingMetadataAgent } from "./utils/search.js";

function showOpening() {
    console.log("\x1Bc");
    console.log(`${chalk.cyan("PlexAniSync Mapping Assistant")} ${pjson.version} \n`);
    console.log(chalk.grey(`Created by ${chalk.underline("@Soitora")}`));
    console.log(chalk.grey(`Made for contribution to ${chalk.underline("RickDB/PlexAniSync-Custom-Mappings")}.\n`));
}

async function searchPrompt() {
    const questions = [
        {
            type: "list",
            name: "metadataAgent",
            message: "Select the metadata agent you want to use:",
            choices: [
                { name: "🎥 The Movie Database (TMDB)", value: "tmdb" },
                { name: "🎥 TheTVDB.com (TVDB)", value: "tvdb" },
            ],
        },
        {
            type: "list",
            name: "mediaType",
            message: "Select the type of media you want to use:",
            choices: [
                { name: "📺 Series", value: "tv" },
                { name: "🍿 Movies", value: "movie" },
            ],
        },
        {
            type: "confirm",
            name: "usePlex",
            message: "Do you wish to use the Plex integration?",
            default: true,
        },
    ];

    const answers = await inquirer.prompt(questions);

    const metadataAgent = answers.metadataAgent;
    const mediaType = answers.mediaType;

    console.log("");

    searchUsingMetadataAgent(mediaType, metadataAgent);
}

showOpening();
searchPrompt();
