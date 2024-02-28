import * as dotenv from "dotenv";
import colors from "colors";

import { describe, it } from "mocha";
import { assert } from "chai";

import { getDetails } from "../utils/tmdbApi.js";

dotenv.config();

if (process.env.TMDB_APIKEY) {
    describe("TMDB API", () => {
        describe("TV Series", () => {
            it("should get series information by id", async () => {
                const seriesId = 37854;
                const seriesName = "One Piece";

                try {
                    const response = await getDetails("tv", seriesId);

                    assert.strictEqual(response.tmdb_id, seriesId, "TMDB IDs should match");
                    assert.strictEqual(response.mediaName, seriesName, "Media names should match");
                } catch (error) {
                    throw error;
                }
            });
        });

        describe("Movies", () => {
            it("should get movie information by id", async () => {
                const movieId = 128;
                const movieName = "Princess Mononoke";

                try {
                    const response = await getDetails("movie", movieId);

                    assert.strictEqual(response.tmdb_id, movieId, "TMDB IDs should match");
                    assert.strictEqual(response.mediaName, movieName, "Media names should match");
                } catch (error) {
                    throw error;
                }
            });
        });
    });
} else {
    console.warn(`Skipping TMDB tests because ${"TMDB_APIKEY".red} is missing.`);
}
