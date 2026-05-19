import { query } from '@anthropic-ai/claude-agent-sdk';

function simplifyMessage(message) {
  const base = {
    type: message.type,
    subtype: message.subtype ?? null,
    session_id: message.session_id ?? null
  };

  if (message.type === 'assistant') {
    base.content = message.message?.content?.map((item) => {
      if (item.type === 'tool_use') {
        return {
          type: item.type,
          name: item.name,
          input: item.input
        };
      }

      if (item.type === 'text') {
        return {
          type: item.type,
          text: item.text
        };
      }

      return { type: item.type };
    }) ?? [];
  }

  if (message.type === 'user') {
    base.content = message.message?.content ?? [];
  }

  if (message.type === 'result') {
    base.is_error = message.is_error;
    base.result = message.result;
  }

  return base;
}

async function main() {
  const abortController = new AbortController();
  setTimeout(() => {
    abortController.abort(new Error('user-input-bridge probe timeout'));
  }, 20000);

  const prompt = [
    'Use AskUserQuestion exactly once.',
    'Ask me whether I prefer React or Vue.',
    'After you receive the answer, reply with only that framework name.'
  ].join(' ');

  const q = query({
    prompt,
    options: {
      cwd: process.cwd(),
      maxTurns: 3,
      tools: ['AskUserQuestion'],
      includeHookEvents: true,
      abortController
    }
  });

  const controlRequests = [];
  const originalProcessControlRequest = q.processControlRequest.bind(q);
  q.processControlRequest = async (request, signal) => {
    controlRequests.push({
      subtype: request.request?.subtype ?? null,
      request: request.request ?? null
    });
    return originalProcessControlRequest(request, signal);
  };

  const events = [];
  let thrownError = null;

  try {
    for await (const message of q) {
      events.push(simplifyMessage(message));
    }
  } catch (error) {
    thrownError = {
      name: error?.name ?? 'Error',
      message: error?.message ?? String(error)
    };
  }

  const resultEvent = events.findLast((event) => event.type === 'result') ?? null;

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    cwd: process.cwd(),
    prompt,
    controlRequests,
    resultEvent,
    thrownError,
    events
  }, null, 2));
}

main().catch((error) => {
  console.error('SPIKE_USER_INPUT_BRIDGE_FAILED');
  console.error(error);
  process.exitCode = 1;
});
