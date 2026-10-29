import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { startServer } from "../src/server.js";

function get(url: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode || 0, headers: res.headers, body }));
    }).on("error", reject);
  });
}

describe("CLI Static Documentation Server (Security & Path Traversal)", () => {
  const testDir = path.join(__dirname, "server_test_root");
  let serverInstance: { url: string; close: () => Promise<void> };

  beforeAll(async () => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, "index.html"), "<h1>SoroDoc Home</h1>");
    fs.writeFileSync(path.join(testDir, "spec.md"), "# Contract Markdown Spec");

    // Start server on ephemeral port (port 0)
    serverInstance = await startServer(testDir, { port: 0 });
  });

  afterAll(async () => {
    if (serverInstance) {
      await serverInstance.close();
    }
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("serves index.html when root path / is requested", async () => {
    const res = await get(`${serverInstance.url}/`);
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.body).toContain("<h1>SoroDoc Home</h1>");
  });

  it("serves markdown files with appropriate content-type and security headers", async () => {
    const res = await get(`${serverInstance.url}/spec.md`);
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/markdown");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.body).toContain("# Contract Markdown Spec");
  });

  it("returns 404 for non-existent file", async () => {
    const res = await get(`${serverInstance.url}/missing.html`);
    expect(res.statusCode).toBe(404);
  });

  it("blocks path traversal attacks attempting to escape doc root", async () => {
    const res1 = await get(`${serverInstance.url}/../package.json`);
    // Will be safely normalized and either 404 or 403, never exposed
    expect([403, 404]).toContain(res1.statusCode);
    expect(res1.body).not.toContain('"name": "sorodoc-cli"');

    const res2 = await get(`${serverInstance.url}/%2e%2e%2fpackage.json`);
    expect([403, 404]).toContain(res2.statusCode);
    expect(res2.body).not.toContain('"name": "sorodoc-cli"');
  });

  it("rejects non-directory root path gracefully", async () => {
    const dummyFile = path.join(testDir, "dummy.txt");
    fs.writeFileSync(dummyFile, "test");
    await expect(startServer(dummyFile)).rejects.toThrow();
  });
});
