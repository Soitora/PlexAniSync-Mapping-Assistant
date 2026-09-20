import { readFileSync } from "node:fs";

const packageJsonUrl = new URL("../package.json", import.meta.url);
export const { version: packageVersion } = JSON.parse(readFileSync(packageJsonUrl, "utf8"));
