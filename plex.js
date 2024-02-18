import colors from "colors";
import pjson from "pjson";

import { rl } from "./utils/constants.js";
import { plexSearchTmdb } from "./utils/plexFunctions.js";

function showOpening() {
    console.log("\x1Bc");
    console.log(`TMDB Assistant for PlexAniSync `.cyan + pjson.version + `\n`);
    console.log(`Created by ${"@Soitora".underline}`.grey);
    console.log(`Made for contribution to ${"RickDB/PlexAniSync".underline} custom mappings\n`.grey);
}

showOpening();
searchPrompt();

function searchPrompt() {
    const question = `\nChoose your option:\n${"1".underline.cyan}. Search for ${"Series".grey} on Plex using ${"TMDB".grey}\n${"2".underline.cyan}. Search for ${
        "Movies".grey
    } on Plex using ${"TMDB".grey}\n\nInput: `;
    rl.question(question, (answer) => {
        switch (answer) {
            case "1":
                showOpening();
                console.log(`\nSearching for Series 📺`.yellow);
                searchPromptTMDB("tv");
                break;
            case "2":
                showOpening();
                console.log(`\nSearching for Movies 🎥`.yellow);
                searchPromptTMDB("movie");
                break;
        }
    });
}

function searchPromptTMDB(mediaType) {
    const prompt = `\nEnter a ${"TMDB ID:".bold} `;
    rl.question(prompt.cyan, async (mediaId) => {
        try {
            const plex_guid = await plexSearchTmdb(mediaType, mediaId);
            console.log(plex_guid);
        } catch (error) {
            if (error.errorCode === 404) {
                console.error("The requested media does not exist.".red);
            } else {
                console.error("An error occurred:", error.message);
            }

            searchPromptTMDB();
        }

        searchPromptTMDB();
    });
}
