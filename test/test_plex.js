import * as dotenv from "dotenv";
import colors from "colors";

import { describe, it } from "mocha";
import { assert } from "chai";

import { getPlexMatch } from "../api/plex.js";

dotenv.config();

if (process.env.PLEX_HOST && process.env.PLEX_TOKEN) {
    describe("Plex API", () => {
        describe("TV Series", () => {
            describe("TMDB", () => {
                it("should get series information by TMDB id", async () => {
                    const seriesId = 37854;
                    const seriesName = "One Piece";

                    try {
                        const { name } = await getPlexMatch("tv", seriesId, "TMDB");

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
                        const { name } = await getPlexMatch("tv", seriesId, "TVDB");

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
                        const { name } = await getPlexMatch("movie", movieId, "TMDB");

                        assert.strictEqual(name, movieName, "Movie names should match");
                    } catch (error) {
                        throw error;
                    }
                });
            });
        });
    });
} else {
    if (!process.env.PLEX_HOST) console.warn(`Skipping Plex tests because ${"PLEX_HOST".red} is missing.`);
    if (!process.env.PLEX_TOKEN) console.warn(`Skipping Plex tests because ${"PLEX_TOKEN".red} is missing.`);
}
