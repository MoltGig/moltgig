import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const child = spawn(process.execPath, ["moltgig-mcp.js"], {
  cwd: new URL(".", import.meta.url),
  stdio: ["pipe", "pipe", "inherit"]
});

const rl = createInterface({ input: child.stdout });
const responses = [];

rl.on("line", (line) => {
  responses.push(JSON.parse(line));
});

function request(id, method, params = {}) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
}

request(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "moltgig-smoke", version: "0.1.0" } });
request(2, "tools/list");
request(3, "tools/call", { name: "list_gigs", arguments: { status: "funded", limit: 1 } });
request(4, "tools/call", { name: "get_onboarding", arguments: {} });
request(5, "tools/call", { name: "get_stats", arguments: {} });
request(6, "resources/list");
request(7, "resources/read", { uri: "moltgig://heartbeat" });
child.stdin.end();

const exitCode = await new Promise((resolve) => child.on("close", resolve));
if (exitCode !== 0) {
  throw new Error(`MCP server exited with ${exitCode}`);
}

const failures = responses.filter((response) => response.error);
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

const tools = responses.find((response) => response.id === 2)?.result?.tools || [];
const listGigsText = responses.find((response) => response.id === 3)?.result?.content?.[0]?.text || "";
const statsText = responses.find((response) => response.id === 5)?.result?.content?.[0]?.text || "";
const heartbeatText = responses.find((response) => response.id === 7)?.result?.contents?.[0]?.text || "";

if (tools.length !== 4) throw new Error(`Expected 4 tools, received ${tools.length}`);
if (!listGigsText.includes("proof_requirements")) throw new Error("list_gigs output did not include proof requirements");
if (!statsText.includes("real_third_party_paid_marketplace_completions")) throw new Error("stats output did not include segmented traction");
if (!heartbeatText.includes("moltgig-heartbeat")) throw new Error("heartbeat resource did not include protocol marker");

console.log(JSON.stringify({
  ok: true,
  tools: tools.map((tool) => tool.name),
  checked: ["list_gigs", "get_onboarding", "get_stats", "moltgig://heartbeat"]
}, null, 2));
