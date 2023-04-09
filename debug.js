import * as dotenv from "dotenv";
import MovieDB from "node-themoviedb";
import readline from "readline";
import colors from "colors";
import pjson from "pjson";

dotenv.config();
const tmdb = new MovieDB(process.env.TMDB_APIKEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\x1Bc');
console.log(`TMDB Assistant for PlexAniSync `.cyan + pjson.version + `\n`);
console.log(`Created by @Soitora`.grey);
console.log(`Made for debugging\n`.grey);

// Ask questions
searchPrompt()

function searchPrompt() {
    rl.question(colors.cyan("\nEnter a TMDB ID: "), (mediaId) => {
        tmdb.tv
        .getDetails({ pathParameters: { tv_id: mediaId } })
        .then((response) => {
            console.log(response.data)
            searchPrompt();
        })
        .catch((error) => {
            console.error(colors.red(error));
            searchPrompt();
        });
    });
}
