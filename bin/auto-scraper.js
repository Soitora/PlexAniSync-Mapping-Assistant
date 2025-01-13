import path from "path";
import chalk from "chalk";
import pjson from "pjson";
import inquirer from "inquirer";
import { readFile, appendFile, writeFile } from "fs/promises";
import { promises as fsPromises } from "fs";

import { mediaSearch } from "../utils/search.js";
import { setUserConfigDefaults, getUserConfig } from "../utils/configHandler.js";

// Call setUserConfigDefaults if needed
setUserConfigDefaults();

// Use getUserConfig to get the user configuration
const userConfig = getUserConfig();

function showOpening() {
    console.log("\x1Bc");
    console.log(`${chalk.cyan("  PlexAniSync Mapping Assistant")} ${chalk.grey("- Auto Scraper -")} ${pjson.version} \n`);
    console.log(chalk.grey(`  Created by ${chalk.bold("@Soitora")}`));
    console.log(chalk.grey(`  Made for contribution to: ${chalk.bold("https://github.com/RickDB/PlexAniSync-Custom-Mappings")}`));
    console.log(chalk.grey(`  Join the community here:  ${chalk.bold("https://discord.gg/a9cu5t5fKc")}\n`));
    console.log(chalk.grey(`  For this tool, please make sure you got ${chalk.cyan(userConfig.inputFilePath)} created and filled with IDs.\n`));
}

async function searchPrompt() {
    const hasTokenTmdb = process.env.TMDB_APIKEY;
    const hasTokenTvdb = process.env.TVDB_APIKEY;

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
    ];

    const answers = await inquirer.prompt(questions);

    const metadataAgent = answers.metadataAgent;
    const mediaType = answers.mediaType;

    processFile(mediaType, metadataAgent);
}

async function processFile(mediaType, metadataAgent) {
    try {
        // Check if the input file exists
        const inputData = await fsPromises.readFile(userConfig.inputFilePath, "utf-8").catch(async (readError) => {
            if (readError.code === "ENOENT") {
                // If the file doesn't exist, create it
                await fsPromises.writeFile(userConfig.inputFilePath, "");
                console.warn(
                    `${chalk.redBright("Warning")}: ${chalk.cyan(
                        userConfig.inputFilePath
                    )} did not exist and has been created.\n\nPlease enter a list of IDs, separated by a newline; then try again.`
                );
                return ""; // Return an empty string to prevent further processing with non-existent data
            } else {
                throw readError; // If it's a different error, propagate it
            }
        });

        const mediaIdList = inputData.trim().split("\n"); // Trim to remove leading/trailing whitespace
        // Check if the file is empty
        if (inputData.trim() == "") {
            console.warn(`${chalk.redBright("Warning")}: ${chalk.cyan(userConfig.inputFilePath)} is empty. Add lines to process.`);
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

            // Process each line with a 500ms delay
            await new Promise((resolve) => setTimeout(resolve, 500));

            try {
                const outputPath = `${userConfig.outputFilePath.replace(/\/$/, "")}/${mediaType === "tv" ? "series" : "movies"}-${metadataAgent}.en.yaml`;
                const outputDir = path.dirname(outputPath);

                const { primaryOutput } = await mediaSearch(mediaType, metadataAgent, mediaId, false, false);

                // Check if primaryOutput is undefined before proceeding
                if (primaryOutput === undefined) {
                    console.error(`Error processing ${mediaId}: The mediaSearch function returned undefined.`);
                    continue; // Skip to the next iteration of the loop
                }

                // Edit the line to append "✅ " before the processed mediaId
                linesToProcess[i] = `✅ ${mediaId}`;

                await fsPromises.mkdir(outputDir, { recursive: true });
                await fsPromises.appendFile(outputPath, primaryOutput + "\n");

                console.log(`${chalk.green("✓")} ${chalk.dim(`Processing:`)}\n${chalk.yellowBright(primaryOutput)}`);
            } catch (error) {
                console.error(`Error processing ${mediaId}:`, error.message);
                // If there's an error, you may want to handle it accordingly, e.g., log the error or skip the line.
            }
        }

        // Write the updated lines back to the input file
        await writeFile(userConfig.inputFilePath, linesToProcess.join("\n"));

        console.log(
            `Processing complete.\nCheck ${chalk.cyan(
                `${userConfig.outputFilePath.replace(/\/$/, "")}/${mediaType === "tv" ? "series" : "movies"}-${metadataAgent}.en.yaml`
            )} for the result.\n`
        );
    } catch (error) {
        console.error("Error:", error.message);
        // Handle errors related to reading or writing the input file
    }
}

showOpening();
searchPrompt();
