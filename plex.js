import colors from "colors";
import pjson from "pjson";

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

        if (metadataAgent == "TMDB") {
            searchPromptTMDB(mediaType);
        } else if (metadataAgent == "TVDB") {
            searchPromptTVDB(mediaType);
        }
    };

    const question = `\nChoose your option:\n
    ${"1".underline.cyan}. Search for ${"Series".magenta} on Plex using ${"TMDB".blue}\n
    ${"2".underline.cyan}. Search for ${"Movies".yellow} on Plex using ${"TMDB".blue}\n
    ${"3".underline.cyan}. Search for ${"Series".magenta} on Plex using ${"TVDB".green}\n
    ${"4".underline.cyan}. Search for ${"Movies".yellow} on Plex using ${"TVDB".green}\n\n
    Input: `;
    rl.question(question, (answer) => {
        switch (answer) {
            case "1":
                handleSearch("Series", "tv", "TMDB");
                break;
            case "2":
                handleSearch("Movies", "movie", "TMDB");
                break;
            case "3":
                handleSearch("Series", "tv", "TVDB");
                break;
            case "4":
                handleSearch("Movies", "movie", "TVDB");
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
            const { response } = await getPlexMatch(mediaType, mediaId, "TMDB");
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
            const { response } = await getPlexMatch(mediaType, mediaId, "TVDB");
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
