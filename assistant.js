import colors from "colors";
import pjson from "pjson";

import { rl, answerSeries, answerMovie } from "./utils/constants.js";
import { searchForMedia } from "./utils/search.js";
import { validateEnvironmentVariable } from "./utils/precheck.js";

validateEnvironmentVariable("TMDB_APIKEY", 32, /^[a-fA-F0-9]+$/, "please provide a proper API key.", true);
validateEnvironmentVariable("PLEX_HOST", null, /^(?:(?:(?:\d{1,3}\.){3}\d{1,3})|(?:(?:[a-zA-Z0-9_-]+\.)*[a-zA-Z0-9_-]+))(?::\d{1,5})?$/, "please provide a proper URL.", false);
validateEnvironmentVariable("PLEX_TOKEN", 20, null, "please provide a proper X-PLEX-TOKEN.", false);

function showOpening() {
    console.log("\x1Bc");
    console.log(`TMDB Assistant for PlexAniSync `.cyan + pjson.version + `\n`);
    console.log(`Created by ${"@Soitora".underline}`.grey);
    console.log(`Made for contribution to ${"RickDB/PlexAniSync".underline} custom mappings\n`.grey);
    console.log(`ℹ️ You can at any time change between searching for Movies and Series by typing the mode again.`);
}

showOpening();
searchPrompt();

function searchPrompt() {
    const handleSearch = (media, mediaType) => {
        showOpening();
        console.log(`\nSearching for ${media} 🎥`.yellow);
        searchForMedia(mediaType);
    };

    const question = `\nDo you want to search for a ${"S".underline.cyan}eries or a ${"M".underline.cyan}ovie? `;
    rl.question(question, (answer) => {
        if (answerMovie.includes(answer.toLowerCase())) {
            handleSearch("Movies", "movie");
        } else if (answerSeries.includes(answer.toLowerCase())) {
            handleSearch("Series", "tv");
        } else {
            console.log(colors.red(`Invalid answer.\n`));
            searchPrompt();
        }
    });
}
