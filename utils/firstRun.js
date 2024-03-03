// configSetup.js
import dotenv from 'dotenv'
import chalk from "chalk";
import inquirer from "inquirer";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { promises as fsPromises } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Adjusted the configFilePath to point to the parent folder
const configFilePath = resolve(dirname(__dirname), ".env");

export async function checkAndSetupConfig() {
    try {
        // Check if the .env file exists
        if (
            await fsPromises
                .access(configFilePath)
                .then(() => true)
                .catch(() => false)
        ) {
            // Load the environment variables from the .env file
            dotenv.config({ path: configFilePath });

            return false; // Configuration setup was skipped
        }

        console.log(chalk.redBright(`  Configuration missing, please fill out the configurator.\n`));
        console.log(chalk.yellowBright(`  You are required to fill out your API key for at least one of the following services: ${chalk.cyan("TMDB")}, ${chalk.cyan("TVDB")}.`));
        console.log(chalk.yellowBright(`  You are not required to fill out your Plex details, but it is highly recommended for getting the ${chalk.cyan("guid")}.\n`));

        const tmdbApiRegex = /^[0-9a-fA-F]{32}$/;
        const validateTmdbApi = (input) => {
            // Check if the input is blank
            if (input.trim() === "") return true;

            // Check if the input matches the URL regex
            if (tmdbApiRegex.test(input)) {
                return true;
            } else {
                return "Please enter a valid API key, it looks something like: 'A1B2C3D4E5F6G7H8I9K0L1M2N3O4P5Q6'";
            }
        };

        const tvdbApiRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validateTvdbApi = (input) => {
            // Check if the input is blank
            if (input.trim() === "") return true;

            // Check if the input matches the URL regex
            if (tvdbApiRegex.test(input)) {
                return true;
            } else {
                return "Please enter a valid API key, it looks something like: 'A1B2C3D4-A1B2-A1B2-A1B2-A1B2C3D4E5F6'";
            }
        };

        const urlRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/;
        const validateUrl = (input) => {
            // Check if the input is blank
            if (input.trim() === "") return true;

            // Check if the input matches the URL regex
            if (urlRegex.test(input)) {
                return true;
            } else {
                return "Please enter a valid IP:Port format.";
            }
        };

        // Prompt the user for configuration
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "TMDB_APIKEY",
                message: "Please enter your TMDB API v3 Key:",
                validate: validateTmdbApi,
            },
            {
                type: "input",
                name: "TVDB_APIKEY",
                message: "Please enter your TVDB API v4 Key:",
                validate: validateTvdbApi,
            },
            {
                type: "input",
                name: "PLEX_HOST",
                message: "Please enter your Plex URL (IP:PORT):",
                validate: validateUrl,
            },
            {
                type: "input",
                name: "PLEX_TOKEN",
                message: "Please enter your X-PLEX-TOKEN:",
                description: "https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/",
            },
        ]);

        // Save the configuration to the .env file
        const configFileContent = Object.entries(answers)
            .map(([key, value]) => `${key.toUpperCase()}="${value}"`)
            .join("\n");

        await fsPromises.writeFile(configFilePath, configFileContent);

        console.log(`\n${chalk.green("✓")} ${chalk.greenBright(`Configuration stored to '${configFilePath}'\n`)}`);

        // Load the environment variables from the updated .env file
        dotenv.config({ path: configFilePath });

        return true; // Configuration setup was performed
    } catch (error) {
        throw error;
    }
}
