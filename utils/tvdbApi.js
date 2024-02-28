import * as dotenv from "dotenv";
import TVDB from "tvdbapi";

dotenv.config();

const tvdb = new TVDB({ apikey: process.env.TVDB_APIKEY })

export async function getSeriesById(id) {
    try {
        const responseOverview = await tvdb.series.get({id});
        const responseEnglish = await tvdb.series.translations({id, language: "eng"});

        return { responseOverview, responseEnglish }
    } catch (error) {
        console.error(error)
    }
}

export async function getMovieById(id) {
    try {
        const responseOverview = await tvdb.movies.get({id});
        const responseEnglish = await tvdb.movies.translations({id, language: "eng"});

        return { responseOverview, responseEnglish }
    } catch (error) {
        console.error(error)
    }
}

getSeriesById(81797)
