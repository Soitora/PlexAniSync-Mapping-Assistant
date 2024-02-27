import * as dotenv from "dotenv";
import MovieDB from "node-themoviedb";

import { getPlexGuid } from "./plexFunctions.js";

dotenv.config();

const tmdb = new MovieDB(process.env.TMDB_APIKEY);

export async function getFormattedTitles(mediaType, mediaId, isoCodes, mediaName) {
    const apiMethods = {
        tv: tmdb.tv.getAlternativeTitles,
        movie: tmdb.movie.getAlternativeTitles,
    };

    const propertyNames = {
        tv: "results",
        movie: "titles",
    };

    const apiMethod = apiMethods[mediaType];
    const propertyName = propertyNames[mediaType];

    const {
        data: { [propertyName]: titles },
    } = await apiMethod({ pathParameters: { [`${mediaType}_id`]: mediaId } });

    const formattedTitles = titles
        .filter((alternateTitles) => isoCodes.has(alternateTitles.iso_3166_1) && alternateTitles.title !== mediaName)
        .map((alternateTitles) => alternateTitles.title)
        .sort();

    return formattedTitles;
}

export async function getExternalIDs(mediaType, mediaId) {
    const apiMethods = {
        tv: tmdb.tv.getExternalIDs,
        movie: tmdb.movie.getExternalIDs,
    };

    const apiMethod = apiMethods[mediaType];

    const {
        data: { tvdb_id, imdb_id },
    } = await apiMethod({ pathParameters: { [`${mediaType}_id`]: mediaId } });

    if (process.env.PLEX_HOST && process.env.PLEX_TOKEN) {
        const plex_guid = await getPlexGuid(mediaType, mediaId, "TMDB");

        return { plex_guid, tvdb_id, imdb_id };
    }

    return { tvdb_id, imdb_id };
}

export async function getDetails(mediaType, mediaId) {
    const apiMethods = {
        tv: tmdb.tv.getDetails,
        movie: tmdb.movie.getDetails,
    };

    const propertyNames = {
        tv: "name",
        movie: "title",
    };

    const apiMethod = apiMethods[mediaType];
    const propertyName = propertyNames[mediaType];

    const {
        data: { [propertyName]: mediaName, production_countries, id: tmdb_id, number_of_seasons },
    } = await apiMethod({ pathParameters: { [`${mediaType}_id`]: mediaId } });

    return { mediaName, production_countries, tmdb_id, number_of_seasons };
}
