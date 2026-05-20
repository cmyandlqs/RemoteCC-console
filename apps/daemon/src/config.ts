export type DaemonConfig = {
  host: string;
  port: number;
};

export function loadConfig(): DaemonConfig {
  return {
    host: process.env.AGENT_CONSOLE_HOST ?? "127.0.0.1",
    port: Number(process.env.AGENT_CONSOLE_PORT ?? 8787),
  };
}
