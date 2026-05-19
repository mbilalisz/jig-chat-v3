import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Explicitly load .env from the current directory
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
