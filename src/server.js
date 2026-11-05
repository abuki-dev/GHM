const env = require("./config/env");
const app = require("./app");
const { connectDB, mongoose } = require("./config/db");

let server;

async function start() {
  await connectDB();
  server = app.listen(env.PORT, () => {
    console.log("Server running on http://localhost:" + env.PORT);
  });
}

start().catch((err) => {
  console.error("Failed to start:", err.message);
  process.exit(1);
});

function shutdown(signal) {
  console.log(signal + " received, shutting down...");
  if (!server) return process.exit(0);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
