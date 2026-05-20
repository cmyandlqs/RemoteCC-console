export type HostSummary = {
  name: string;
  os: string;
  status: "online";
  claudeAuthState: "unchecked";
  tailscaleState: "unchecked";
};

export class HostService {
  getSummary(): HostSummary {
    return {
      name: "agent-console-host",
      os: process.platform,
      status: "online",
      claudeAuthState: "unchecked",
      tailscaleState: "unchecked",
    };
  }
}
