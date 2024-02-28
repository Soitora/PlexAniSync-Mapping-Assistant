import { describe, it } from "mocha";
import { assert } from "chai";

import { getPlexGuid } from "../utils/plexFunctions.js";

describe("Plex API", () => {
    describe("TV Series", () => {
        describe("TMDB", () => {
            it("should get series information by TMDB id", async () => {
                const seriesId = 37854;
                const seriesName = "One Piece";

                try {
                    const { name } = await getPlexGuid("tv", seriesId, "TMDB");

                    assert.strictEqual(name, seriesName, "Series names should match");
                } catch (error) {
                    throw error;
                }
            });
        });

        describe("TVDB", () => {
            it("should get series information by TVDB id", async () => {
                const seriesId = 81797;
                const seriesName = "One Piece";

                try {
                    const { name } = await getPlexGuid("tv", seriesId, "TVDB");

                    assert.strictEqual(name, seriesName, "Series names should match");
                } catch (error) {
                    throw error;
                }
            });
        });
    });

    describe("Movies", () => {
        describe("TMDB", () => {
            it("should get movie information by TMDB id", async () => {
                const movieId = 128;
                const movieName = "Princess Mononoke";

                try {
                    const { name } = await getPlexGuid("movie", movieId, "TMDB");

                    assert.strictEqual(name, movieName, "Movie names should match");
                } catch (error) {
                    throw error;
                }
            });
        });
    });
});
