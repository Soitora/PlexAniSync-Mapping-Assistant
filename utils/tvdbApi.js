import * as dotenv from "dotenv";
import TVDB from "node-tvdb";

dotenv.config();

const tvdb = new TVDB(process.env.TVDB_APIKEY);
