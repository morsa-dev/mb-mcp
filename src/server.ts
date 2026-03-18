import { createServer } from "node:http";

import { readConfig } from "./config.js";
import { createHttpApp } from "./http/createHttpApp.js";
import { PROJECT_NAME } from "./serverMetadata.js";

const config = readConfig();
const app = createHttpApp(config);
const server = createServer(app);

server.on("error", (error) => {
  console.error("Failed to start HTTP server", error);
  process.exit(1);
});

server.listen(config.port, config.host, () => {
  console.info(`${PROJECT_NAME} listening on http://${config.host}:${config.port}${config.mcpPath}`);
});

const shutdown = (signal: string) => {
  console.info(`${signal} received, shutting down`);
  server.close((error) => {
    if (error) {
      console.error("Failed to close HTTP server", error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
