import { writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { query } from '@anthropic-ai/claude-agent-sdk';

function toBashPath(winPath) {
  const normalized = winPath.replace(/\\/g, '/');
  const match = normalized.match(/^([A-Za-z]):\/(.*)$/);
  if (!match) {
    return normalized;
  }

  return `/${match[1].toLowerCase()}/${match[2]}`;
}

function simplifyEvent(message) {
  if (message.type === 'system' && message.subtype === 'init') {
    return {
      type: message.type,
      subtype: message.subtype,
      session_id: message.session_id,
      model: message.model,
      permissionMode: message.permissionMode
    };
  }

  if (message.type === 'system' && message.subtype === 'permission_denied') {
    return {
      type: message.type,
      subtype: message.subtype,
      session_id: message.session_id,
      tool_name: message.tool_name,
      decision_reason: message.decision_reason ?? null,
      message: message.message
    };
  }

  if (message.type === 'system' && message.subtype === 'task_notification') {
    return {
      type: message.type,
      subtype: message.subtype,
      session_id: message.session_id,
      task_id: message.task_id,
      tool_use_id: message.tool_use_id,
      status: message.status,
      summary: message.summary
    };
  }

  if (message.type === 'assistant') {
    return {
      type: message.type,
      session_id: message.session_id,
      content: message.message?.content?.map((item) => {
        if (item.type === 'thinking') {
          return { type: 'thinking' };
        }

        if (item.type === 'text') {
          return { type: 'text', text: item.text };
        }

        if (item.type === 'tool_use') {
          return { type: 'tool_use', name: item.name, input: item.input };
        }

        return { type: item.type };
      }) ?? []
    };
  }

  if (message.type === 'user' && message.message?.content?.[0]?.type === 'tool_result') {
    return {
      type: message.type,
      session_id: message.session_id,
      tool_result: message.message.content[0]
    };
  }

  if (message.type === 'result') {
    return {
      type: message.type,
      subtype: message.subtype,
      session_id: message.session_id,
      is_error: message.is_error,
      result: message.result,
      total_cost_usd: message.total_cost_usd
    };
  }

  return {
    type: message.type,
    subtype: message.subtype
  };
}

function summarizePermissionRequest(toolName, input, ctx) {
  return {
    toolName,
    input,
    blockedPath: ctx.blockedPath ?? null,
    decisionReason: ctx.decisionReason ?? null,
    title: ctx.title ?? null,
    displayName: ctx.displayName ?? null,
    description: ctx.description ?? null,
    toolUseID: ctx.toolUseID,
    agentID: ctx.agentID ?? null,
    suggestions: ctx.suggestions ?? []
  };
}

async function runScenario({ name, prompt, tools, onPermission }) {
  const permissionRequests = [];
  const events = [];
  let thrownError = null;

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd: process.cwd(),
        maxTurns: 4,
        permissionMode: 'default',
        tools,
        canUseTool: async (toolName, input, ctx) => {
          const permissionRequest = summarizePermissionRequest(toolName, input, ctx);
          permissionRequests.push(permissionRequest);
          return onPermission(permissionRequest, ctx);
        }
      }
    })) {
      events.push(simplifyEvent(message));
    }
  } catch (error) {
    thrownError = {
      name: error?.name ?? 'Error',
      message: error?.message ?? String(error)
    };
  }

  const resultEvent = events.findLast((event) => event.type === 'result') ?? null;
  const permissionDeniedEvent = events.find(
    (event) => event.type === 'system' && event.subtype === 'permission_denied'
  ) ?? null;

  return {
    scenario: name,
    prompt,
    permissionRequestCount: permissionRequests.length,
    permissionRequests,
    permissionDeniedEvent,
    resultEvent,
    thrownError,
    events
  };
}

async function main() {
  const tempFile = path.join(os.tmpdir(), 'remotecc-approval-spike.txt');
  const tempFileBashPath = toBashPath(tempFile);
  const cwdWriteFile = path.join(process.cwd(), 'approval_bridge_write_test.txt');

  await writeFile(tempFile, 'approval-spike-ok', 'utf8');
  await rm(cwdWriteFile, { force: true });

  const safePwdScenario = await runScenario({
    name: 'safe-bash-no-approval',
    prompt: 'Use the Bash tool exactly once to run `pwd`. After the command completes, reply with only the directory path.',
    tools: ['Bash'],
    onPermission: async (_, ctx) => ({
      behavior: 'deny',
      message: 'Unexpected approval request in safe-bash-no-approval',
      toolUseID: ctx.toolUseID
    })
  });

  const externalReadDenyScenario = await runScenario({
    name: 'external-temp-read-deny',
    prompt: `Use the Bash tool exactly once to run \`cat ${tempFileBashPath}\`. After the command completes, reply with only the file content.`,
    tools: ['Bash'],
    onPermission: async (_, ctx) => ({
      behavior: 'deny',
      message: 'Denied by approval bridge spike: external temp read',
      toolUseID: ctx.toolUseID
    })
  });

  const workspaceWriteDenyScenario = await runScenario({
    name: 'workspace-write-deny',
    prompt: 'Use the Bash tool exactly once to run `printf approval-write-ok > approval_bridge_write_test.txt`. After that, reply with only DONE.',
    tools: ['Bash'],
    onPermission: async (_, ctx) => ({
      behavior: 'deny',
      message: 'Denied by approval bridge spike: workspace write',
      toolUseID: ctx.toolUseID
    })
  });

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    cwd: process.cwd(),
    tempFile,
    tempFileBashPath,
    fileChecks: {
      workspaceWriteFileExistsAfterDeny: existsSync(cwdWriteFile)
    },
    safePwdScenario,
    externalReadDenyScenario,
    workspaceWriteDenyScenario
  }, null, 2));
}

main().catch((error) => {
  console.error('SPIKE_APPROVAL_BRIDGE_FAILED');
  console.error(error);
  process.exitCode = 1;
});
