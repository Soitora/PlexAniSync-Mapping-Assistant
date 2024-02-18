import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const answerSeries = ["s", "series", "serie", "show", "tv"];
const answerMovie = ["m", "movie", "film"];

export { rl, answerSeries, answerMovie }