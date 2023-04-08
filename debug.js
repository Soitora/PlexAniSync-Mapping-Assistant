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
console.log(`TMDB Scraper for PlexAniSync `.cyan + pjson.version + `\n`);
console.log(`Created by @Soitora`.grey);
console.log(`Made for debugging\n`.grey);

// Ask questions
searchPrompt()

function searchPrompt() {
    console.log(`Right now, nothing here works!`.red)
    rl.question(
        `Type your desired query, like `.cyan + `tv.getDetails`.green + ` or `.cyan + `movie.getAlternativeTitles `.green,
        (answer) => {
            const [media, query] = answer.split(".");
            rl.question(`\nEnter a TMDB ${media} ID: `.cyan, (mediaId) => {
                console.log(query)
                tmdb[query]
                .get({ pathParameters: { [media + "_id"]: mediaId } })
                .then((response) => {
                    console.log(response.data);
                    searchPrompt1();
                })
                .catch((error) => {
                    console.error(colors.red(error));
                    searchPrompt1();
                });
            });
        }
    );
}
