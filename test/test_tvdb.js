import * as dotenv from "dotenv";
import colors from "colors";

import { describe, it } from "mocha";
import { assert } from "chai";

import { getSeriesById, getMovieById } from "../api/tvdb.js";

dotenv.config();

if (process.env.TVDB_APIKEY) {
    describe("TVDB API", () => {
        describe("TV Series", () => {
            it("should get series information by id", async () => {
                const seriesId = 81797;
                const seriesName = "One Piece";

                try {
                    const { tvdb_id, name } = await getSeriesById(seriesId);

                    assert.strictEqual(tvdb_id, seriesId, "Series IDs should match");
                    assert.strictEqual(name, seriesName, "Series names should match");
                } catch (error) {
                    throw error;
                }
            });
        });

        describe("Movies", () => {
            it("should get movie information by id", async () => {
                const movieId = 791;
                const movieName = "Princess Mononoke";

                try {
                    const { tvdb_id, name } = await getMovieById(movieId);

                    assert.strictEqual(tvdb_id, movieId, "Movie IDs should match");
                    assert.strictEqual(name, movieName, "Movie names should match");
                } catch (error) {
                    throw error;
                }
            });
        });
    });
} else {
    console.warn(`Skipping TVDB tests because ${"TVDB_APIKEY".red} is missing.`);
}
