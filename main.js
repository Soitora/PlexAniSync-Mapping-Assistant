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

const answerSeries = ["s", "series", "tv"];
const answerMovie = ["m", "movie"];

function showOpening() {
  console.log('\x1Bc');
  console.log(`TMDB Scraper for PlexAniSync `.cyan + pjson.version + `\n`);
  console.log(`Created by @Soitora`.grey);
  console.log(`Made for contribution to https://github.com/RickDB/PlexAniSync-Custom-Mappings\n`.grey);
  console.log(`⚠️ You can at any time change between Movie and Series.`.grey)
}

let mediaType;

showOpening()
searchPrompt()

function searchPrompt() {
  const question = `Do you want to search for a ${"S".underline.cyan}eries or a ${"M".underline.cyan}ovie? `;
  
  rl.question(question.white, (answer) => {
    const lowercaseAnswer = answer.toLowerCase();
    if (answerMovie.includes(lowercaseAnswer)) {
      showOpening();
      console.log(`\nYou're now searching for Movies!`.grey);
      searchForMovies();
    } else if (answerSeries.includes(lowercaseAnswer)) {
      showOpening();
      console.log(`\nYou're now searching for Series!`.grey);
      searchForSeries();
    } else {
    console.log(colors.red(`Invalid answer.\n`));
    searchPrompt();
  }
  });
}

async function getFormattedTitles(mediaType, mediaId, isoCodes) {
  const apiMethods = {
    tv: tmdb.tv.getAlternativeTitles,
    movie: tmdb.movie.getAlternativeTitles
  };

  const propertyNames = {
    tv: "results",
    movie: "titles"
  }

  const apiMethod = apiMethods[mediaType];
  const propertyName = propertyNames[mediaType];

  const { data: { [propertyName]: titles } } = await apiMethod({ pathParameters: { [`${mediaType}_id`]: mediaId } });

  const formattedTitles = titles
    .filter((alternateTitles) => isoCodes.has(alternateTitles.iso_3166_1))
    .map((alternateTitles) => alternateTitles.title)
    .sort();

  return formattedTitles
}

async function getExternalIDs(mediaType, mediaId) {
  const apiMethods = {
    tv: tmdb.tv.getExternalIDs,
    movie: tmdb.movie.getExternalIDs
  };

  const apiMethod = apiMethods[mediaType];

  const { data: { tvdb_id, imdb_id } } = await apiMethod({ pathParameters: { [`${mediaType}_id`]: mediaId } });

  return { tvdb_id, imdb_id };
}


async function getDetails(mediaType, mediaId) {
  const apiMethods = {
    tv: tmdb.tv.getDetails,
    movie: tmdb.movie.getDetails
  };

  const propertyNames = {
    tv: "name",
    movie: "title"
  }

  const apiMethod = apiMethods[mediaType];
  const propertyName = propertyNames[mediaType];

  const { data: { [propertyName]: mediaName, production_countries } } = await apiMethod({ pathParameters: { [`${mediaType}_id`]: mediaId } });

  return { mediaName, production_countries };
}

async function searchForSeries() {
  mediaType = "tv"

  rl.question(colors.cyan("\nEnter a TMDB series ID: "), async (mediaId) => {
    try {
      if (answerMovie.includes(mediaId)) {
        console.log(`\nYou're now searching for Movies!`.grey);
        searchForMovies();
        return;
      } else if (answerSeries.includes(mediaId)) {
        console.log(`\nYou're still in Series searching mode.`.grey);
      } else {
        const { mediaName, production_countries } = await getDetails(mediaType, mediaId);

        const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);
        const formattedTitles = await getFormattedTitles(mediaType, mediaId, isoCodes);
        const { tvdb_id, imdb_id } = await getExternalIDs(mediaType, mediaId);

        const data = [
          {
            title: mediaName,
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
      }
    } catch (error) {
      if (error.errorCode === 404) {
        console.error("The requested media does not exist.".red);
      } else {
        console.error("An error occurred:", error.message);
      }

      searchForSeries();
    }

    searchForSeries();
  });
}

async function searchForMovies() {
  mediaType = "movie"

  rl.question(colors.cyan("\nEnter a TMDB movie ID: "), async (mediaId) => {
    try {
      if (answerSeries.includes(mediaId)) {
        console.log(`\nYou're now searching for Series!`.grey);
        searchForSeries();
        return;
      } else if (answerMovie.includes(mediaId)) {
        console.log(`\nYou're still in Movie searching mode.`.grey);
      } else {
        const { mediaName, production_countries } = await getDetails(mediaType, mediaId);

        const isoCodes = new Set(["US", "UK", ...production_countries.map((country) => country.iso_3166_1)]);
        const formattedTitles = await getFormattedTitles(mediaType, mediaId, isoCodes);
        const { imdb_id } = await getExternalIDs(mediaType, mediaId);

        const data = [
          {
            title: mediaName,
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
      }
    } catch (error) {
      if (error.errorCode === 404) {
        console.error("The requested media does not exist.".red);
      } else {
        console.error("An error occurred:", error.message);
      }

      searchForMovies();
    }

    searchForMovies();
  });
}