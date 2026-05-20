import { loadConfig } from "./config.js";
import { buildServer } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const app = await buildServer();

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
