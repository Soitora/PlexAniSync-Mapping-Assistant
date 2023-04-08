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
  rl.question(colors.cyan("\nEnter a TMDB series ID: "), (mediaId) => {
    if (mediaId.toLowerCase() === "m" || mediaId.toLowerCase() === "movie") {
      console.log(`\nYou're now searching for Movies!`.grey);
      searchForMovie();
    } else if (mediaId.toLowerCase() === "s" || mediaId.toLowerCase() === "series" || mediaId.toLowerCase() === "tv") {
      console.log(`\nYou're still in Series searching mode.`.grey);
      searchForSeries();
    } else {
      tmdb.tv
        .getDetails({ pathParameters: { tv_id: mediaId } })
        .then((response) => {
          const { name, production_countries } = response.data;

          return tmdb.tv.getAlternativeTitles({ pathParameters: { tv_id: mediaId } })
            .then((response) => {
              const { results } = response.data;

              const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);

              const formattedTitles = results
                .filter((alternateTitles) => isoCodes.has(alternateTitles.iso_3166_1))
                .map((alternateTitles) => alternateTitles.title)
                .sort();

              return tmdb.tv.getExternalIDs({ pathParameters: { tv_id: mediaId } })
                .then((response) => {
                  const { tvdb_id, imdb_id } = response.data;

                  const data = [
                    {
                      title: name,
                      ...(formattedTitles.length > 0 && { synonyms: formattedTitles }),
                    },
                  ];

                  const yamlOutput = yaml.dump(data, {
                    quotingType: `"`,
                    forceQuotes: true,
                    indent: 2,
                  });

                  const url_TMDB = "\n  # https://www.themoviedb.org/tv/" + mediaId;
                  const url_TVDB = tvdb_id !== null ? `\n  # https://www.thetvdb.com/dereferrer/series/${tvdb_id}` : '';
                  const url_IMDB = imdb_id !== null ? `\n  # https://www.imdb.com/title/${imdb_id}/` : '';

                  const regex = /^(\s*- title:.*)$/m;
                  const modifiedYamlOutput = yamlOutput.replace(regex, `$1${url_TMDB}${url_TVDB}${url_IMDB}`);

                  console.log(`Results copied to clipboard!\n`.grey);
                  console.log(modifiedYamlOutput.green);

                  clipboardy.writeSync(modifiedYamlOutput.replace(/^/gm, "  "));
                  searchForSeries();
                });
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
  rl.question(colors.cyan("\nEnter a TMDB Movie ID: "), (mediaId) => {
    if (mediaId.toLowerCase() === "s" || mediaId.toLowerCase() === "series" || mediaId.toLowerCase() === "tv") {
      console.log(`\nYou're now searching for Series!\n`.grey + `⚠️ You can at any time type `.white + `M`.underline.cyan + `ovies to switch mode.`.white);
      searchForSeries();
    } else if (mediaId.toLowerCase() === "m" || mediaId.toLowerCase() === "movie") {
      console.log(`\nYou're still in Movie searching mode.\n`.grey + `⚠️ You can at any time type `.white + `S`.underline.cyan + `eries to switch mode.`.white);
      searchForMovie();
    } else {
      tmdb.movie
        .getDetails({ pathParameters: { movie_id: mediaId } })
        .then((response) => {
          const { title, production_countries } = response.data;

          return tmdb.movie.getAlternativeTitles({ pathParameters: { movie_id: mediaId } })
            .then((response) => {
              const { titles } = response.data;

              const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);

              const formattedTitles = titles
                .filter((alternateTitles) => isoCodes.has(alternateTitles.iso_3166_1))
                .map((alternateTitles) => alternateTitles.title)
                .sort();

              return tmdb.movie.getExternalIDs({ pathParameters: { movie_id: mediaId } })
                .then((response) => {
                  const { imdb_id } = response.data;

                  const data = [
                    {
                      title: title,
                      ...(formattedTitles.length > 0 && { synonyms: formattedTitles }),
                    },
                  ];

                  const yamlOutput = yaml.dump(data, {
                    quotingType: `"`,
                    forceQuotes: true,
                    indent: 2,
                  });

                  const url_TMDB = "\n  # https://www.themoviedb.org/tv/" + mediaId;
                  const url_IMDB = imdb_id !== null ? `\n  # https://www.imdb.com/title/${imdb_id}/` : '';

                  const regex = /^(\s*- title:.*)$/m;
                  const modifiedYamlOutput = yamlOutput.replace(regex, `$1${url_TMDB}${url_IMDB}`);

                  console.log(`Results copied to clipboard!\n`.grey);
                  console.log(modifiedYamlOutput.green);

                  clipboardy.writeSync(modifiedYamlOutput.replace(/^/gm, "  "));
                  searchForMovie();
                });
            });
        })
        .catch((error) => {
          console.error(colors.red(error));
          searchForMovie();
        });
    };
  });
}


