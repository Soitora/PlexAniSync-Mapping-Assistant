import * as dotenv from "dotenv";
import MovieDB from "node-themoviedb";
import colors from "colors";
import pjson from "pjson";

import { rl } from "./utils/constants.js";

dotenv.config();

const tmdb = new MovieDB(process.env.TMDB_APIKEY);

console.log("\x1Bc");
console.log(`TMDB Assistant for PlexAniSync `.cyan + pjson.version + `\n`);
console.log(`Created by @Soitora`.grey);
console.log(`Made for debugging\n`.grey);

// Ask questions
searchPrompt();

function searchPrompt() {
    rl.question(colors.cyan("\nEnter a TMDB ID: "), (mediaId) => {
        tmdb.tv
            .getDetails({ pathParameters: { tv_id: mediaId } })
            .then((response) => {
                console.log(response.data);
                searchPrompt();
            })
            .catch((error) => {
                console.error(colors.red(error));
                searchPrompt();
            });
    });
}
