import chalk from "chalk";
import pjson from "pjson";
import inquirer from "inquirer";
import { readFile, appendFile, writeFile } from "fs/promises";

import { mediaSearch } from "./utils/search.js";

function showOpening() {
    console.log("\x1Bc");
    console.log(`${chalk.cyan("  PlexAniSync Mapping Assistant")} ${chalk.grey("- Auto Scraper -")} ${pjson.version} \n`);
    console.log(chalk.grey(`  Created by ${chalk.bold("@Soitora")}`));
    console.log(chalk.grey(`  Made for contribution to: ${chalk.bold("https://github.com/RickDB/PlexAniSync-Custom-Mappings")}`));
    console.log(chalk.grey(`  Join the community here:  ${chalk.bold("https://discord.gg/a9cu5t5fKc")}\n\n`));
    console.log(chalk.grey(`  For this tool, please make sure you got ${chalk.cyan(inputFilePath)} created and filled with IDs.\n`));
}

const inputFilePath = "batch/input.txt";
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

    processFile(mediaType, metadataAgent);
}

async function processFile(mediaType, metadataAgent) {
    try {
        // Check if the input file exists
        let inputData = "";
        try {
            inputData = await readFile(inputFilePath, "utf-8");
        } catch (readError) {
            if (readError.code === "ENOENT") {
                // If the file doesn't exist, create it
                await writeFile(inputFilePath, "");
                console.warn(
                    `${chalk.redBright("Warning")}: ${chalk.cyan(
                        inputFilePath
                    )} did not exist and has been created.\n\nPlease enter a list of IDs, seperated by a newline; then try again.`
                );
                return;
            } else {
                throw readError; // If it's a different error, propagate it
            }
        }

        const mediaIdList = inputData.trim().split("\n"); // Trim to remove leading/trailing whitespace
        // Check if the file is empty
        if (mediaIdList.length <= 1) {
            console.warn(`${chalk.redBright("Warning")}: ${chalk.cyan(inputFilePath)} is empty. Add lines to process.`);
            return;
        }

        // Filter out lines that start with "✅"
        const linesToProcess = mediaIdList.filter((line) => !line.trim().startsWith("✅"));

        if (linesToProcess.length === 0) {
            console.log("No lines to process. All lines have already been marked as processed.");
            return;
        }

        for (let i = 0; i < linesToProcess.length; i++) {
            const mediaId = linesToProcess[i];

            try {
                const yamlOutput = await mediaSearch(mediaType, metadataAgent, mediaId, false, false);

                // Check if yamlOutput is undefined before proceeding
                if (yamlOutput === undefined) {
                    console.error(`Error processing ${mediaId}: The mediaSearch function returned undefined.`);
                    continue; // Skip to the next iteration of the loop
                }

                // Edit the line to append "✅ " before the processed mediaId
                linesToProcess[i] = `✅ ${mediaId}`;

                console.log(`Processing:\n${chalk.yellowBright(yamlOutput)}`);
                await appendFile(`batch/output/${mediaType === "tv" ? "series" : "movies"}-${metadataAgent}.en.yaml`, yamlOutput + "\n");
            } catch (error) {
                console.error(`Error processing ${mediaId}:`, error.message);
                // If there's an error, you may want to handle it accordingly, e.g., log the error or skip the line.
            }
        }

        // Write the updated lines back to the input file
        await writeFile(inputFilePath, linesToProcess.join("\n"));

        console.log(`Processing complete.\nCheck ${chalk.cyan(`batch/output/${mediaType === "tv" ? "series" : "movies"}-${metadataAgent}.en.yaml`)} for the result.\n`);
    } catch (error) {
        console.error("Error:", error.message);
        // Handle errors related to reading or writing the input file
    }
}

showOpening();
searchPrompt();
