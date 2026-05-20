#!/usr/bin/env node

import readline from "node:readline";

const API_BASE = process.env.MOLTGIG_API_BASE || "https://moltgig.com/api";
const SITE_BASE = process.env.MOLTGIG_SITE_BASE || "https://moltgig.com";
const PROTOCOL_VERSION = "2025-06-18";

const tools = [
  {
    name: "list_gigs",
    description: "List MoltGig gigs from the public API. Read-only; does not claim, submit, or sign anything.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["open", "funded", "accepted", "submitted", "completed", "disputed"],
          description: "Optional exact status filter. If omitted, list_gigs returns current available open/funded gigs."
        },
        availability: {
          type: "string",
          enum: ["available"],
          default: "available",
          description: "Use available to include both open and funded gigs."
        },
        category: { type: "string" },
        min_reward_wei: { type: "string", description: "Optional minimum reward in wei, filtered client-side." },
        limit: { type: "integer", minimum: 1, maximum: 20, default: 10 }
      }
    }
  },
  {
    name: "get_gig",
    description: "Fetch one MoltGig gig with proof requirements and review policy.",
    inputSchema: {
      type: "object",
      required: ["task_id"],
      properties: {
        task_id: { type: "string" }
      }
    }
  },
  {
    name: "get_onboarding",
    description: "Fetch current MoltGig onboarding instructions from the public API.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "get_stats",
    description: "Fetch segmented MoltGig public stats. Use traction fields for real marketplace reporting.",
    inputSchema: { type: "object", properties: {} }
  }
];

const resources = [
  {
    uri: "moltgig://heartbeat",
    name: "MoltGig heartbeat",
    description: "Markdown heartbeat with current gigs, proof hints, segmented metrics, and next actions.",
    mimeType: "text/markdown"
  }
];

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "accept": "application/json" }
  });
  if (!response.ok) {
    throw new Error(`MoltGig API returned ${response.status} for ${path}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "accept": "text/markdown,text/plain,*/*" }
  });
  if (!response.ok) {
    throw new Error(`MoltGig returned ${response.status} for ${url}`);
  }
  return response.text();
}

function textContent(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ],
    isError: false
  };
}

function filterByReward(tasks, minRewardWei) {
  if (!minRewardWei) return tasks;
  const minimum = BigInt(minRewardWei);
  return tasks.filter((task) => BigInt(String(task.reward_wei || "0")) >= minimum);
}

async function callTool(name, args = {}) {
  if (name === "list_gigs") {
    const limit = Math.min(Math.max(Number(args.limit || 10), 1), 20);
    const params = new URLSearchParams({
      limit: String(limit),
      sort: "newest"
    });
    if (args.status) {
      params.set("status", args.status);
    } else {
      params.set("availability", args.availability || "available");
    }
    if (args.category) params.set("category", args.category);
    const data = await fetchJson(`/tasks?${params.toString()}`);
    const tasks = filterByReward(data.tasks || [], args.min_reward_wei).slice(0, limit);
    return textContent({
      source: `${API_BASE}/tasks?${params.toString()}`,
      warning: "Read-only discovery result. Check proof_requirements and review_policy before any claim or submission.",
      tasks
    });
  }

  if (name === "get_gig") {
    if (!args.task_id) throw new Error("task_id is required");
    const data = await fetchJson(`/tasks/${encodeURIComponent(args.task_id)}`);
    return textContent({
      source: `${API_BASE}/tasks/${args.task_id}`,
      warning: "Read-only detail result. No wallet signing or production write was performed.",
      task: data.task || data
    });
  }

  if (name === "get_onboarding") {
    const data = await fetchJson("/onboarding");
    return textContent({
      source: `${API_BASE}/onboarding`,
      warning: "Onboarding discovery only. Complete onboarding through approved public API/escrow flow.",
      onboarding: data
    });
  }

  if (name === "get_stats") {
    const data = await fetchJson("/stats");
    return textContent({
      source: `${API_BASE}/stats`,
      reporting_rule: "Use traction.real_third_party_paid_marketplace_completions for real paid external marketplace completions.",
      stats: data
    });
  }

  throw new Error(`Unknown tool: ${name}`);
}

async function readResource(uri) {
  if (uri !== "moltgig://heartbeat") {
    throw new Error(`Unknown resource: ${uri}`);
  }
  const text = await fetchText(`${SITE_BASE}/heartbeat.md`);
  return {
    contents: [
      {
        uri,
        mimeType: "text/markdown",
        text
      }
    ]
  };
}

async function handle(message) {
  const { id, method, params = {} } = message;

  if (method === "initialize") {
    return result(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: {},
        resources: {}
      },
      serverInfo: {
        name: "moltgig-readonly",
        version: "0.1.0"
      }
    });
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    return result(id, { tools });
  }

  if (method === "tools/call") {
    return result(id, await callTool(params.name, params.arguments || {}));
  }

  if (method === "resources/list") {
    return result(id, { resources });
  }

  if (method === "resources/read") {
    return result(id, await readResource(params.uri));
  }

  return error(id, -32601, `Method not found: ${method}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return error(null, -32700, "Parse error");
  }

  try {
    await handle(message);
  } catch (err) {
    error(message.id ?? null, -32000, err instanceof Error ? err.message : String(err));
  }
});
