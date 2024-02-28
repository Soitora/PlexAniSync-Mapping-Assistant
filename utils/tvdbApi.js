import * as dotenv from "dotenv";
import TVDB from "tvdbapi";

dotenv.config();

const tvdb = new TVDB({ apikey: process.env.TVDB_APIKEY });

export async function getSeriesById(mediaId) {
    try {
        const response = await tvdb.series.extended({ id: mediaId });

        const { name } = (await tvdb.series.translations({ id: mediaId, language: "eng" })).data;
        const { id: tvdb_id, year } = response.data;
        const { imdb_id, tmdb_id } = await getRemoteIDs(response.data.remoteIds);
        const aliases = await getSortedAliases(response.data.aliases);
        const seasons = await getAmountOfSeasons(response.data.seasons);

        return { response, name, year, imdb_id, tmdb_id, tvdb_id, aliases, seasons };
    } catch (error) {
        console.error(error);
    }
}

export async function getMovieById(mediaId) {
    try {
        const response = await tvdb.movies.extended({ id: mediaId });

        const { name } = (await tvdb.movies.translations({ id: mediaId, language: "eng" })).data;
        const { id: tvdb_id, year } = response.data;
        const { imdb_id, tmdb_id } = await getRemoteIDs(response.data.remoteIds);
        const aliases = await getSortedAliases(response.data.aliases);

        return { response, name, year, imdb_id, tmdb_id, tvdb_id, aliases, seasons: 1 };
    } catch (error) {
        console.error(error);
    }
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

async function getRemoteIDs(remoteIds) {
    let imdb_id, tmdb_id;

    remoteIds.forEach((remoteId) => {
        if (remoteId.sourceName === "TheMovieDB.com") {
            tmdb_id = remoteId.id;
        } else if (remoteId.sourceName === "IMDB") {
            imdb_id = remoteId.id;
        }
    });

    return { imdb_id, tmdb_id };
}

async function getAmountOfSeasons(seasons) {
    let amountOfSeasons = 0;

    // Filter seasons based on type 'Aired Order' and exclude season 0 and count the number
    amountOfSeasons += seasons.filter((season) => season.type.type === "official" && season.number !== 0).length;

    return amountOfSeasons;
}
