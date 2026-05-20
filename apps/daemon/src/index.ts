import { loadConfig } from "./config.js";
import { buildServer } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildServer();

  const gracefulShutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully`);
    await app.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
