// Loads .env once and exports clean settings. Require this FIRST in every entry file.
require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:3000",
};
env.isProd = env.NODE_ENV === "production";

if (!env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing. Check your .env file.");
}

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET is missing or too short (use 32+ characters). Check your .env file.");
}

module.exports = env;
