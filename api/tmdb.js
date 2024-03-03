import dotenv from 'dotenv'
import chalk from "chalk";
import MovieDB from "node-themoviedb";

import { getPlexMatch } from "./plex.js";

dotenv.config();

export function importApi() {
    const tmdb = new MovieDB(process.env.TMDB_APIKEY);
    return tmdb;
}

export async function getEntryByTypeAndId(mediaType, mediaId) {
    try {
        switch (mediaType) {
            case "tv":
                return getSeriesById(mediaId);
            case "movie":
                return getMovieById(mediaId);
            default:
                throw new Error(`Unsupported mediaType: ${mediaType}`);
        }
    } catch (error) {
        throw error;
    }
}

async function fetchDetailsData(tmdbMethod, mediaType, mediaId) {
    try {
        const response = await tmdbMethod.getDetails({ pathParameters: { [`${mediaType}_id`]: mediaId } });

        return response;
    } catch (error) {
        throw error;
    }
}

export async function getSeriesById(mediaId) {
    const tmdb = importApi();

    try {
        const mediaType = "tv";

        const response = await fetchDetailsData(tmdb.tv, mediaType, mediaId);

        const { name, id: tmdb_id, production_countries, number_of_seasons } = response.data;
        const { plex_guid, imdb_id, tvdb_id } = await getExternalIDs(tmdb.tv, mediaType, mediaId);
        const alternativeTitles = await getSortedAlternativeTitles(tmdb.tv, mediaType, mediaId, name, production_countries);
        const seasons = await getAmountOfSeasons(number_of_seasons);

        return { response, name, plex_guid, imdb_id, tmdb_id, tvdb_id, alternativeTitles, seasons };
    } catch (error) {
        throw error;
    }
}

export async function getMovieById(mediaId) {
    const tmdb = importApi();

    try {
        const mediaType = "movie";

        const response = await fetchDetailsData(tmdb.movie, mediaType, mediaId);

        const { title: name, id: tmdb_id, production_countries } = response.data;
        const { plex_guid, imdb_id, tvdb_id } = await getExternalIDs(tmdb.movie, mediaType, mediaId);
        const alternativeTitles = await getSortedAlternativeTitles(tmdb.movie, mediaType, mediaId, name, production_countries);

        return { response, name, plex_guid, imdb_id, tmdb_id, tvdb_id, alternativeTitles, seasons: 1 };
    } catch (error) {
        throw error;
    }
}

async function getExternalIDs(tmdbMethod, mediaType, mediaId) {
    try {
        const {
            data: { tvdb_id, imdb_id },
        } = await tmdbMethod.getExternalIDs({ pathParameters: { [`${mediaType}_id`]: mediaId } });

        let plex_guid = null;

        dotenv.config();
        if (process.env.PLEX_HOST && process.env.PLEX_TOKEN) {
            try {
                const plexMatchResponse = await getPlexMatch(mediaType, mediaId, "tmdb");
                if (plexMatchResponse.response) {
                    plex_guid = plexMatchResponse.response.guid;
                }
            } catch (plexError) {
                console.error(plexError)
                console.log(`${chalk.redBright("Plex API issue:")} ${chalk.gray("guid")} will be missing from the results.`);
            }
        }

        return { plex_guid, imdb_id, tvdb_id };
    } catch (error) {
        throw error;
    }
}

async function getSortedAlternativeTitles(tmdbMethod, mediaType, mediaId, mediaName, production_countries) {
    try {
        const propertyNames = {
            tv: "results",
            movie: "titles",
        };

        const {
            data: { [propertyNames[mediaType]]: titles },
        } = await tmdbMethod.getAlternativeTitles({ pathParameters: { [`${mediaType}_id`]: mediaId } });

        // Create a map to store titles for each ISO code
        const titlesByIsoCode = new Map();

        // Iterate through titles and group them by ISO codes
        for (const title of titles) {
            if (title.iso_3166_1 && title.title !== mediaName) {
                const isoCode = title.iso_3166_1;
                if (!titlesByIsoCode.has(isoCode)) {
                    titlesByIsoCode.set(isoCode, []);
                }
                titlesByIsoCode.get(isoCode).push(title.title);
            }
        }

        // Create a list to hold all sorted titles
        const sortedAlternativeTitles = [];

        // Define the desired order of ISO codes (US, UK, then production_countries)
        const desiredIsoCodes = ["US", "UK", ...production_countries.map((country) => country.iso_3166_1)];

        // Iterate through the desired ISO codes and add sorted titles
        for (const isoCode of desiredIsoCodes) {
            if (titlesByIsoCode.has(isoCode)) {
                sortedAlternativeTitles.push(...titlesByIsoCode.get(isoCode).sort());
            }
        }

        return sortedAlternativeTitles;
    } catch (error) {
        throw error;
    }
}

async function getAmountOfSeasons(number_of_seasons) {
    try {
        let amountOfSeasons = 0;

        amountOfSeasons += number_of_seasons;

        return amountOfSeasons;
    } catch (error) {
        throw error;
    }
}
