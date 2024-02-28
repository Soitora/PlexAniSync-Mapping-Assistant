import { describe, it } from "mocha";
import { assert } from "chai";

import { getSeriesById, getMovieById } from "../utils/tvdbApi.js";

describe("TVDB API", () => {
    describe("TV Series", () => {
        it("should get series information by id", async () => {
            const seriesId = 81797;
            const seriesName = "One Piece";

            try {
                const { responseOverview, responseEnglish } = await getSeriesById(seriesId);

                assert.strictEqual(responseOverview.data.id, seriesId, "Series IDs should match");
                assert.strictEqual(responseEnglish.data.name, seriesName, "Series names should match");
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
                const { responseOverview, responseEnglish } = await getMovieById(movieId);

                assert.strictEqual(responseOverview.data.id, movieId, "Movie IDs should match");
                assert.strictEqual(responseEnglish.data.name, movieName, "Movie names should match");
            } catch (error) {
                throw error;
            }
        });
    });
});
