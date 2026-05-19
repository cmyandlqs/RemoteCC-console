import { query } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  console.log(JSON.stringify({
    env: {
      ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
      CLAUDE_CODE_USE_BEDROCK: Boolean(process.env.CLAUDE_CODE_USE_BEDROCK),
      CLAUDE_CODE_USE_VERTEX: Boolean(process.env.CLAUDE_CODE_USE_VERTEX),
      CLAUDE_CODE_USE_FOUNDRY: Boolean(process.env.CLAUDE_CODE_USE_FOUNDRY)
    }
  }, null, 2));

  const events = [];
  try {
    for await (const message of query({
      prompt: 'Reply with exactly OK',
      options: {
        cwd: process.cwd()
      }
    })) {
      events.push(message);
      console.log(JSON.stringify(message));
      if (events.length >= 10) {
        break;
      }
    }
  } catch (error) {
    console.error('SDK_QUERY_FAILED');
    console.error(error);
    process.exitCode = 1;
  }
}

main();
