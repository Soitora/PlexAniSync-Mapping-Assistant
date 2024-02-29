import colors from "colors";
import pjson from "pjson";
import inquirer from "inquirer";

import { rl } from "./utils/constants.js";
import { getPlexMatch } from "./api/plex.js";
import { validateEnvironmentVariable } from "./utils/precheck.js";

validateEnvironmentVariable("PLEX_HOST", null, /^(?:(?:(?:\d{1,3}\.){3}\d{1,3})|(?:(?:[a-zA-Z0-9_-]+\.)*[a-zA-Z0-9_-]+))(?::\d{1,5})?$/, "please provide a proper URL.", true);
validateEnvironmentVariable("PLEX_TOKEN", 20, null, "please provide a proper X-PLEX-TOKEN.", true);

function showOpening() {
    console.log("\x1Bc");
    console.log(`TMDB Assistant for PlexAniSync `.cyan + pjson.version + `\n`);
    console.log(`Created by ${"@Soitora".underline}`.grey);
    console.log(`Made for contribution to ${"RickDB/PlexAniSync".underline} custom mappings\n`.grey);
}

showOpening();
searchPrompt();

function searchPrompt() {
    const handleSearch = (media, mediaType, metadataAgent) => {
        showOpening();
        console.log(`\nSearching for ${media.gray} ${mediaType === "movie" ? "🎥" : "📺"}`.yellow);

        if (metadataAgent == "tmdb") {
            searchPromptTMDB(mediaType);
        } else if (metadataAgent == "tvdb") {
            searchPromptTVDB(mediaType);
        }
    };

    const questions = [
        {
            type: "list",
            name: "option",
            message: "Choose your option:",
            choices: [
                { name: "Search for Series on Plex using TMDB", value: "1" },
                { name: "Search for Movies on Plex using TMDB", value: "2" },
                { name: "Search for Series on Plex using TVDB", value: "3" },
                { name: "Search for Movies on Plex using TVDB", value: "4" },
            ],
        },
    ];

    inquirer.prompt(questions).then((answers) => {
        const answer = answers.option;
        switch (answer) {
            case "1":
                handleSearch("Series", "tv", "tmdb");
                break;
            case "2":
                handleSearch("Movies", "movie", "tmdb");
                break;
            case "3":
                handleSearch("Series", "tv", "tvdb");
                break;
            case "4":
                handleSearch("Movies", "movie", "tvdb");
                break;
            default:
                console.log(colors.red(`Invalid answer.\n`));
                searchPrompt();
                break;
        }
    });
}

function searchPromptTMDB(mediaType) {
    const prompt = `\nEnter a ${"TMDB ID:".bold} `;

    rl.question(prompt.cyan, async (mediaId) => {
        try {
            const { response } = await getPlexMatch(mediaType, mediaId, "tmdb");
            console.log(response);
        } catch (error) {
            if (error.errorCode === 404) {
                console.error("The requested media does not exist.".red);
            } else {
                console.error("An error occurred:", error.message);
            }

            searchPromptTMDB(mediaType);
        }

        searchPromptTMDB(mediaType);
    });
}

function searchPromptTVDB(mediaType) {
    const prompt = `\nEnter a ${"TVDB ID:".bold} `;
    rl.question(prompt.cyan, async (mediaId) => {
        try {
            const { response } = await getPlexMatch(mediaType, mediaId, "tvdb");
            console.log(response);
        } catch (error) {
            if (error.errorCode === 404) {
                console.error("The requested media does not exist.".red);
            } else {
                console.error("An error occurred:", error.message);
            }

            searchPromptTVDB(mediaType);
        }

        searchPromptTVDB(mediaType);
    });
}
