import * as dotenv from "dotenv";
import TVDB from "tvdbapi";

import { getPlexMatch } from "./plex.js";

dotenv.config();

export function importApi() {
    const tvdb = new TVDB({ apikey: process.env.TVDB_APIKEY });
    return tvdb;
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

async function fetchExtendedData(tvdbMethod, mediaId) {
    try {
        const response = await tvdbMethod.extended({ id: mediaId });
        const { name } = (await tvdbMethod.translations({ id: mediaId, language: "eng" })).data;

        return { response, name };
    } catch (error) {
        throw error;
    }
}

export async function getSeriesById(mediaId) {
    const tvdb = importApi();

    try {
        const { response, name } = await fetchExtendedData(tvdb.series, mediaId);

        const { id: tvdb_id } = response.data;
        const { plex_guid, imdb_id, tmdb_id } = await getRemoteIDs(response.data.remoteIds, "tv", mediaId);
        const aliases = await getSortedAliases(response.data.aliases);
        const seasons = await getAmountOfSeasons(response.data.seasons);

        return { response, name, plex_guid, imdb_id, tmdb_id, tvdb_id, aliases, seasons };
    } catch (error) {
        throw error;
    }
}

export async function getMovieById(mediaId) {
    const tvdb = importApi();

    try {
        const { response, name } = await fetchExtendedData(tvdb.movies, mediaId);

        const { id: tvdb_id } = response.data;
        const { plex_guid, imdb_id, tmdb_id } = await getRemoteIDs(response.data.remoteIds, "movie", mediaId);
        const aliases = await getSortedAliases(response.data.aliases);

        return { response, name, plex_guid, imdb_id, tmdb_id, tvdb_id, aliases, seasons: 1 };
    } catch (error) {
        throw error;
    }
}

async function getRemoteIDs(remoteIds, mediaType, mediaId) {
    try {
        let imdb_id, tmdb_id;

        remoteIds.forEach((remoteId) => {
            if (remoteId.sourceName === "TheMovieDB.com") {
                tmdb_id = remoteId.id;
            } else if (remoteId.sourceName === "IMDB") {
                imdb_id = remoteId.id;
            }
        });

        if (process.env.PLEX_HOST && process.env.PLEX_TOKEN) {
            const { guid: plex_guid } = await getPlexMatch(mediaType, mediaId, "tvdb");

            return { plex_guid, imdb_id, tmdb_id };
        }

        return { imdb_id, tmdb_id };
    } catch (error) {
        throw error;
    }
}

async function getSortedAliases(aliases) {
    try {
        // Filter aliases based on language
        const engAliases = aliases.filter((alias) => alias.language === "eng").map((alias) => alias.name);
        const jpnAliases = aliases.filter((alias) => alias.language === "jpn").map((alias) => alias.name);

        // Sort and remove duplicates from the arrays
        const sortedEngAliases = [...new Set(engAliases.sort())];
        const sortedJpnAliases = [...new Set(jpnAliases.sort())];

        // Combine the sorted arrays with English aliases first and remove duplicates
        const sortedAliases = [...new Set(sortedEngAliases.concat(sortedJpnAliases))];

        return sortedAliases;
    } catch (error) {
        throw error;
    }
}

async function getAmountOfSeasons(seasons) {
    try {
        let amountOfSeasons = 0;

        // Filter seasons based on type 'Aired Order' and exclude season 0 and count the number
        amountOfSeasons += seasons.filter((season) => season.type.type === "official" && season.number !== 0).length;

        return amountOfSeasons;
    } catch (error) {
        throw error;
    }
}
