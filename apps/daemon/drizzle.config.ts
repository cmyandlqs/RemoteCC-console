import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/infra/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "~/.agent-console/data/remotecc.db",
  },
});
