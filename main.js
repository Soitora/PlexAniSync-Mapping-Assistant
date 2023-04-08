import * as dotenv from "dotenv";
import MovieDB from "node-themoviedb";
import yaml from "js-yaml";
import readline from "readline";
import colors from "colors";
import clipboardy from "clipboardy";
import pjson from "pjson";

dotenv.config();
const tmdb = new MovieDB(process.env.TMDB_APIKEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function showOpening() {
  console.log('\x1Bc');
  console.log(`TMDB Scraper for PlexAniSync `.cyan + pjson.version + `\n`);
  console.log(`Created by @Soitora`.grey);
  console.log(`Made for contribution to https://github.com/RickDB/PlexAniSync-Custom-Mappings\n`.grey);
  console.log(`⚠️ You can at any time change between Movie and Series.`.grey)
}

showOpening()
searchPrompt()

function searchPrompt() {
  rl.question(
    `Do you want to search for a `.white + `M`.underline.cyan + `ovie or a `.white + `S`.underline.cyan + `eries? `.white,
    (answer) => {
      if (answer.toLowerCase() === "m" || answer.toLowerCase() === "movie") {
        showOpening()
        console.log(`\nYou're now searching for Movies!`.grey);
        searchForMovie();
      } else if (answer.toLowerCase() === "s" || answer.toLowerCase() === "series" || answer.toLowerCase() === "tv") {
        console.log(`\nYou're now searching for Series!`.grey);
        searchForSeries();
      } else {
        console.log(colors.red(`Invalid answer.\n`));
        searchPrompt()
      }
    }
  );
}

function searchForSeries() {
  rl.question(colors.cyan("\nEnter a TMDB series ID: "), (tvId) => {
    if (tvId.toLowerCase() === "m" || tvId.toLowerCase() === "movie") {
      console.log(`\nYou're now searching for Movies!`.grey);
      searchForMovie();
    } else if (tvId.toLowerCase() === "s" || tvId.toLowerCase() === "series" || tvId.toLowerCase() === "tv") {
      console.log(`\nYou're still in Series searching mode.\n`.grey);
      searchForSeries();
    } else {
      tmdb.tv
        .getDetails({ pathParameters: { tv_id: tvId } })
        .then((response) => {
          const { name, production_countries } = response.data;

          return tmdb.tv.getAlternativeTitles({ pathParameters: { tv_id: tvId } })
            .then((response) => {
              const { results } = response.data;

              const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);

              const formattedTitles = results
                .filter((alternateTitles) => isoCodes.has(alternateTitles.iso_3166_1))
                .map((alternateTitles) => alternateTitles.title)
                .sort();

              const data = [
                {
                  title: name,
                  "tmdb-id": tvId,
                  ...(formattedTitles.length > 0 && { synonyms: formattedTitles }),
                },
              ];

              const yamlOutput = yaml.dump(data, {
                quotingType: `"`,
                forceQuotes: true,
                indent: 2,
              });

              console.log("\n" + yamlOutput.green);

              clipboardy.writeSync(yamlOutput.replace(/^/gm, "  "));
              console.log(`Results copied to clipboard!`.grey);

              searchForSeries();
            });
      })
      .catch((error) => {
        console.error(colors.red(error));
        searchForSeries();
      });
    }
  });
}

function searchForMovie() {
  rl.question(colors.cyan("\nEnter a TMDB Movie ID: "), (movieId) => {
    if (movieId.toLowerCase() === "s" || movieId.toLowerCase() === "series" || movieId.toLowerCase() === "tv") {
      console.log(`You're now searching for Series!\n`.grey);
      searchForSeries();
    } else if (movieId.toLowerCase() === "m" || movieId.toLowerCase() === "movie") {
      console.log(`\nYou're still in Movie searching mode.\n`.grey);
      searchForMovie();
    } else {
      tmdb.movie
        .getDetails({ pathParameters: { movie_id: movieId } })
        .then((response) => {
          const { title, production_countries } = response.data;

          return tmdb.movie.getAlternativeTitles({ pathParameters: { movie_id: movieId } })
            .then((response) => {
              const { titles } = response.data;

              const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);

              const formattedTitles = titles
                .filter((alternateTitles) => isoCodes.has(alternateTitles.iso_3166_1))
                .map((alternateTitles) => alternateTitles.title)
                .sort();

              const data = [
                {
                  title: title,
                  "tmdb-id": movieId,
                  ...(formattedTitles.length > 0 && { synonyms: formattedTitles }),
                },
              ];

              const yamlOutput = yaml.dump(data, {
                quotingType: `"`,
                forceQuotes: true,
                indent: 2,
              });

              console.log("\n" + yamlOutput.green);

              clipboardy.writeSync(yamlOutput.replace(/^/gm, "  "));
              console.log(`Results copied to clipboard!`.grey);

              searchForMovie();
            });
        })
        .catch((error) => {
          console.error(colors.red(error));
          searchForMovie();
        });
      };
  });
}

