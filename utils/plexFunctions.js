import * as dotenv from "dotenv";
import axios from "axios";

import { validateEnvironmentVariable } from "./precheck.js";

dotenv.config();

const PLEX_HOST = "http://" + process.env.PLEX_HOST || "http://127.0.0.1:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN;
const DUMMY_QUERY = process.env.DUMMY_QUERY || "A";

validateEnvironmentVariable("PLEX_HOST", null, /^(?:(?:(?:\d{1,3}\.){3}\d{1,3})|(?:(?:[a-zA-Z0-9_-]+\.)*[a-zA-Z0-9_-]+))(?::\d{1,5})?$/, "please provide a proper URL.");
validateEnvironmentVariable("PLEX_TOKEN", 20, null, "please provide a proper X-PLEX-TOKEN.");

export async function getPlexGuid(mediaType, mediaId) {
    try {
        const plexTypes = {
            movie: "1",
            tv: "2",
        }

        const plexType = plexTypes[mediaType];

        // Make a request to search for a media item using a dummy query
        const searchResponse = await axios.get(`${PLEX_HOST}/search?type=${plexType}&query=${DUMMY_QUERY}`, {
            headers: {
                "X-Plex-Token": PLEX_TOKEN,
            },
        });

        // Check if any media items were found
        if (searchResponse.data.MediaContainer.size > 0) {
            // Get the ratingKey of the first media item found
            const { ratingKey } = searchResponse.data.MediaContainer.Metadata[0];

            // Determine the Plex agent based on media type
            const plexAgents = {
                tv: "tv.plex.agents.series",
                movie: "tv.plex.agents.movie"
            };
            const plexAgent = plexAgents[mediaType];

            // Make a request to search for a media item using TMDB ID
            const matchResponse = await axios.get(`${PLEX_HOST}/library/metadata/${ratingKey}/matches?manual=1&title=TMDB-${mediaId}&agent=${plexAgent}`, {
                headers: {
                    "X-Plex-Token": PLEX_TOKEN,
                },
            });

            if (matchResponse.data.MediaContainer.size > 0) {
                // Get details of the first media item found
                const { guid } = matchResponse.data.MediaContainer.SearchResult[0];
                return guid;
            }
        }
    } catch (error) {
        console.error("Error:", error.message);
        console.error("Stack Trace:", error.stack);
    }
}

export async function plexSearchTmdb(mediaType, mediaId) {
    try {
        const plexTypes = {
            movie: "1",
            tv: "2",
        }

        const plexType = plexTypes[mediaType];

        // Make a request to search for a media item using a dummy query
        const searchResponse = await axios.get(`${PLEX_HOST}/search?type=${plexType}&query=${DUMMY_QUERY}`, {
            headers: {
                "X-Plex-Token": PLEX_TOKEN,
            },
        });

        // Check if any media items were found
        if (searchResponse.data.MediaContainer.size > 0) {
            // Get the ratingKey of the first media item found
            const { ratingKey } = searchResponse.data.MediaContainer.Metadata[0];

            // Determine the Plex agent based on media type
            const plexAgents = {
                tv: "tv.plex.agents.series",
                movie: "tv.plex.agents.movie"
            };
            const plexAgent = plexAgents[mediaType];

            // Make a request to search for a media item using TMDB ID
            const matchResponse = await axios.get(`${PLEX_HOST}/library/metadata/${ratingKey}/matches?manual=1&title=TMDB-${mediaId}&agent=${plexAgent}`, {
                headers: {
                    "X-Plex-Token": PLEX_TOKEN,
                },
            });

            if (matchResponse.data.MediaContainer.size > 0) {
                // Get details of the first media item found
                return matchResponse.data.MediaContainer.SearchResult[0];
            }
        }
    } catch (error) {
        console.error("Error:", error.message);
        console.error("Stack Trace:", error.stack);
    }
}