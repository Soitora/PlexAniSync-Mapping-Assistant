import chalk from "chalk";
import pjson from "pjson";
import inquirer from "inquirer";

import { importApi as TMDB_importApi } from "./api/tmdb.js";
import { importApi as TVDB_importApi } from "./api/tvdb.js";

function showOpening() {
    console.log("\x1Bc");
    console.log(`${chalk.cyan("  PlexAniSync Mapping Assistant")} ${chalk.grey("- Debugging -")} ${pjson.version} \n`);
    console.log(chalk.grey(`  Created by ${chalk.bold("@Soitora")}`));
    console.log(chalk.grey(`  Made for contribution to: ${chalk.bold("https://github.com/RickDB/PlexAniSync-Custom-Mappings")}`));
    console.log(chalk.grey(`  Join the community here:  ${chalk.bold("https://discord.gg/a9cu5t5fKc")}\n`));
}

const hasTokenTmdb = process.env.TMDB_APIKEY;
const hasTokenTvdb = process.env.TVDB_APIKEY;

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
    ];

    const answers = await inquirer.prompt(questions);
    const metadataAgent = answers.metadataAgent;
    const mediaType = answers.mediaType;

    console.log("");

    debugUsingMetadataAgent(mediaType, metadataAgent);
}

async function debugUsingMetadataAgent(mediaType, metadataAgent) {
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

    if (metadataAgent == "tmdb") {
        const tmdb = TMDB_importApi();

        if (mediaType == "tv") {
            try {
                const response = await tmdb.tv.getDetails({ pathParameters: { tv_id: mediaId } });
                console.log(response.data);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            } catch (error) {
                console.error(error);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            }
        } else if (mediaType == "movie") {
            try {
                const response = await tmdb.movie.getDetails({ pathParameters: { movie_id: mediaId } });
                console.log(response.data);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            } catch (error) {
                console.error(error);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            }
        }
    } else if (metadataAgent == "tvdb") {
        const tvdb = TVDB_importApi();

        if (mediaType == "tv") {
            try {
                const response = await tvdb.series.extended({ id: mediaId });
                console.log(response.data);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            } catch (error) {
                console.error(error);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            }
        } else if (mediaType == "movie") {
            try {
                const response = await tvdb.movies.extended({ id: mediaId });
                console.log(response.data);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            } catch (error) {
                console.error(error);
                console.log("");
                debugUsingMetadataAgent(mediaType, metadataAgent);
            }
        }
    }
}

showOpening();
searchPrompt();
