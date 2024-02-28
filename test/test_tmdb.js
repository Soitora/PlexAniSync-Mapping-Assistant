import * as dotenv from "dotenv";
import colors from "colors";

import { describe, it } from "mocha";
import { assert } from "chai";

import { getSeriesById, getMovieById } from "../api/tmdb.js";

dotenv.config();

if (process.env.TMDB_APIKEY) {
    describe("TMDB API", () => {
        describe("TV Series", () => {
            it("should get series information by id", async () => {
                const seriesId = 37854;
                const seriesName = "One Piece";

                try {
                    const { tmdb_id, name } = await getSeriesById(seriesId);

                    assert.strictEqual(tmdb_id, seriesId, "Series IDs should match");
                    assert.strictEqual(name, seriesName, "Series names should match");
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
                    const { tmdb_id, name } = await getMovieById(movieId);

                    assert.strictEqual(tmdb_id, movieId, "Movie IDs should match");
                    assert.strictEqual(name, movieName, "Movie names should match");
                } catch (error) {
                    throw error;
                }
            });
        });
    });
} else {
    console.warn(`Skipping TMDB tests because ${"TMDB_APIKEY".red} is missing.`);
}
