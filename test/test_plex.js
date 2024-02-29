import chalk from "chalk";
import * as dotenv from "dotenv";

import { describe, it } from "mocha";
import { assert } from "chai";

import { getPlexMatch } from "../api/plex.js";

dotenv.config();

if (process.env.PLEX_HOST && process.env.PLEX_TOKEN) {
    describe("Plex API", () => {
        describe("TV Series", () => {
            describe("tmdb", () => {
                it("should get series information by TMDB id", async () => {
                    const seriesId = 37854;
                    const seriesName = "One Piece";

                    try {
                        const { name } = await getPlexMatch("tv", seriesId, "tmdb");

                        assert.strictEqual(name, seriesName, "Series names should match");
                    } catch (error) {
                        throw error;
                    }
                });
            });

            describe("tvdb", () => {
                it("should get series information by TVDB id", async () => {
                    const seriesId = 81797;
                    const seriesName = "One Piece";
                    const seriesGuid = "plex://show/5d9c084fec357c001f9ab4d8";

                    try {
                        const { name, guid } = await getPlexMatch("tv", seriesId, "tvdb");

                        assert.strictEqual(name, seriesName, "Series names should match");
                        assert.strictEqual(guid, seriesGuid, "Series guid should match");
                    } catch (error) {
                        throw error;
                    }
                });
            });
        });

        describe("Movies", () => {
            describe("tmdb", () => {
                it("should get movie information by TMDB id", async () => {
                    const movieId = 128;
                    const movieName = "Princess Mononoke";
                    const movieGuid = "plex://movie/5d7768246f4521001ea988b4";

                    try {
                        const { name, guid } = await getPlexMatch("movie", movieId, "tmdb");

                        assert.strictEqual(name, movieName, "Movie names should match");
                        assert.strictEqual(guid, movieGuid, "Movie guid should match");
                    } catch (error) {
                        throw error;
                    }
                });
            });
        });
    });
} else {
    if (!process.env.PLEX_HOST) console.warn(`Skipping Plex tests because ${chalk.redBright("PLEX_HOST")} is missing.`);
    if (!process.env.PLEX_TOKEN) console.warn(`Skipping Plex tests because ${chalk.redBright("PLEX_TOKEN")} is missing.`);
}
