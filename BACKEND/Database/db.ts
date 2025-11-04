import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;


if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL variable must be set");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
export const db = drizzle({ client: pool, schema });