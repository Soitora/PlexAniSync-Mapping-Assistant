import * as dotenv from "dotenv";
import TVDB from "tvdbapi";

import { getPlexMatch } from "./plexFunctions.js";

dotenv.config();

const tvdb = new TVDB({ apikey: process.env.TVDB_APIKEY });

export async function getEntryByTypeAndId(mediaType, mediaId) {
    switch (mediaType) {
        case "tv":
            return getSeriesById(mediaId);
        case "movie":
            return getMovieById(mediaId);
        default:
            throw new Error(`Unsupported mediaType: ${mediaType}`);
    }
}

async function fetchExtendedData(tvdbMethod, mediaId) {
    const response = await tvdbMethod.extended({ id: mediaId });
    const { name } = (await tvdbMethod.translations({ id: mediaId, language: "eng" })).data;

    return { response, name };
}

export async function getSeriesById(mediaId) {
    try {
        const { response, name } = await fetchExtendedData(tvdb.series, mediaId);

        const { id: tvdb_id } = response.data;
        const { plex_guid, imdb_id, tmdb_id } = await getRemoteIDs(response.data.remoteIds, "tv", mediaId);
        const aliases = await getSortedAliases(response.data.aliases);
        const seasons = await getAmountOfSeasons(response.data.seasons);

        return { response, name, plex_guid, imdb_id, tmdb_id, tvdb_id, aliases, seasons };
    } catch (error) {
        console.error(error);
    }
}

export async function getMovieById(mediaId) {
    try {
        const { response, name } = await fetchExtendedData(tvdb.movies, mediaId);

        const { id: tvdb_id } = response.data;
        const { plex_guid, imdb_id, tmdb_id } = await getRemoteIDs(response.data.remoteIds, "movie", mediaId);
        const aliases = await getSortedAliases(response.data.aliases);

        return { response, name, plex_guid, imdb_id, tmdb_id, tvdb_id, aliases, seasons: 1 };
    } catch (error) {
        console.error(error);
    }
}

async function getRemoteIDs(remoteIds, mediaType, mediaId) {
    let imdb_id, tmdb_id;

    remoteIds.forEach((remoteId) => {
        if (remoteId.sourceName === "TheMovieDB.com") {
            tmdb_id = remoteId.id;
        } else if (remoteId.sourceName === "IMDB") {
            imdb_id = remoteId.id;
        }
    });

    if (process.env.PLEX_HOST && process.env.PLEX_TOKEN) {
        const { guid: plex_guid } = await getPlexMatch(mediaType, mediaId, "TVDB");

        return { plex_guid, imdb_id, tmdb_id };
    }

    return { imdb_id, tmdb_id };
}

async function getSortedAliases(aliases) {
    // Filter aliases based on language
    const engAliases = aliases.filter((alias) => alias.language === "eng").map((alias) => alias.name);
    const jpnAliases = aliases.filter((alias) => alias.language === "jpn").map((alias) => alias.name);

    // Sort and remove duplicates from the arrays
    const sortedEngAliases = [...new Set(engAliases.sort())];
    const sortedJpnAliases = [...new Set(jpnAliases.sort())];

    // Combine the sorted arrays with English aliases first and remove duplicates
    const sortedAliases = [...new Set(sortedEngAliases.concat(sortedJpnAliases))];

    return sortedAliases;
}

async function getAmountOfSeasons(seasons) {
    let amountOfSeasons = 0;

    // Filter seasons based on type 'Aired Order' and exclude season 0 and count the number
    amountOfSeasons += seasons.filter((season) => season.type.type === "official" && season.number !== 0).length;

    return amountOfSeasons;
}
