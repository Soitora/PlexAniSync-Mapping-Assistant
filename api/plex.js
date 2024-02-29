import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const PLEX_HOST = "http://" + process.env.PLEX_HOST || "http://127.0.0.1:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN;
const DUMMY_QUERY = process.env.DUMMY_QUERY || "A";

const plexTypes = {
    movie: "1",
    tv: "2",
};

const plexAgents = {
    tv: "tv.plex.agents.series",
    movie: "tv.plex.agents.movie",
};

async function makePlexRequest(endpoint, params) {
    try {
        const response = await axios.get(`${PLEX_HOST}/${endpoint}`, {
            headers: {
                "X-Plex-Token": PLEX_TOKEN,
            },
            params,
        });

        return response.data.MediaContainer;
    } catch (error) {
        throw error;
    }
}

async function searchPlexForMedia(type, query) {
    const params = {
        type: plexTypes[type],
        query: query || DUMMY_QUERY,
    };

    return await makePlexRequest("search", params);
}

async function getMatchesFromPlex(ratingKey, metadataAgent, mediaId, type) {
    const params = {
        manual: 1,
        title: `${metadataAgent}-${mediaId}`,
        agent: plexAgents[type],
    };

    return await makePlexRequest(`library/metadata/${ratingKey}/matches`, params);
}

export async function getPlexMatch(mediaType, mediaId, metadataAgent) {
    try {
        const searchResponse = await searchPlexForMedia(mediaType);

        if (searchResponse.size > 0) {
            const ratingKey = searchResponse.Metadata[0].ratingKey;
            const matchResponse = await getMatchesFromPlex(ratingKey, metadataAgent, mediaId, mediaType);

            if (matchResponse.size > 0) {
                const response = matchResponse.SearchResult[0];
                const { type, guid, name, year, summary } = response;

                return { response, type, guid, name, year, summary };
            }
        }
    } catch (error) {
        throw error;
    }
}
