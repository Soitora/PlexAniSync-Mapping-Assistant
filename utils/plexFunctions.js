import * as dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const PLEX_HOST = "http://" + process.env.PLEX_HOST || "http://127.0.0.1:32400";
const PLEX_TOKEN = process.env.PLEX_TOKEN;
const DUMMY_QUERY = process.env.DUMMY_QUERY || "A";

export async function getPlexGuid(mediaType, mediaId, metadataAgent) {
    try {
        const plexTypes = {
            movie: "1",
            tv: "2",
        };

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
                movie: "tv.plex.agents.movie",
            };
            const plexAgent = plexAgents[mediaType];

            // Make a request to search for a media item using TMDB, TVDB, or IMDB
            const matchResponse = await axios.get(`${PLEX_HOST}/library/metadata/${ratingKey}/matches?manual=1&title=${metadataAgent}-${mediaId}&agent=${plexAgent}`, {
                headers: {
                    "X-Plex-Token": PLEX_TOKEN,
                },
            });

            if (matchResponse.data.MediaContainer.size > 0) {
                // Get details of the first media item found
                const { type, guid, name, year, summary } = matchResponse.data.MediaContainer.SearchResult[0];
                return { type, guid, name, year, summary };
            }
        }
    } catch (error) {
        console.error("Error:", error.message);
        console.error("Stack Trace:", error.stack);
    }
}

export async function plexSearchMetadataAgent(mediaType, mediaId, metadataAgent) {
    try {
        const plexTypes = {
            movie: "1",
            tv: "2",
        };

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
                movie: "tv.plex.agents.movie",
            };
            const plexAgent = plexAgents[mediaType];

            // Make a request to search for a media item using TMDB, TVDB, or IMDB
            const matchResponse = await axios.get(`${PLEX_HOST}/library/metadata/${ratingKey}/matches?manual=1&title=${metadataAgent}-${mediaId}&agent=${plexAgent}`, {
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
