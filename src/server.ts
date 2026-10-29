import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".markdown": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
};

export interface ServeOptions {
  port?: number;
  host?: string;
}

/**
 * Starts a security-hardened local static documentation preview server.
 * Guarantees no path traversal outside rootDir and safe binding to loopback by default.
 */
export function startServer(
  directoryPath: string,
  options: ServeOptions = {}
): Promise<{ server: http.Server; port: number; url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const rootDir = path.resolve(process.cwd(), directoryPath);

    if (!fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
      return reject(new Error(`Provided path is not an existing directory: '${rootDir}'`));
    }

    const host = options.host || "127.0.0.1";
    const port = options.port ?? 0; // 0 chooses an ephemeral free port if not specified

    const server = http.createServer((req, res) => {
      // Only allow GET / HEAD
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Method Not Allowed");
        return;
      }

      let reqUrlPath = req.url || "/";
      try {
        reqUrlPath = decodeURIComponent(reqUrlPath.split("?")[0] || "/");
      } catch {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Bad Request: Malformed URL");
        return;
      }

      // Safe normalization against path traversal
      const safeRelativePath = path.posix.normalize("/" + reqUrlPath).replace(/^(\.\.[\/\\])+/, "");
      let resolvedFilePath = path.join(rootDir, safeRelativePath);

      // Verify the resolved path is strictly within rootDir
      const relative = path.relative(rootDir, resolvedFilePath);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Forbidden: Access Denied");
        return;
      }

      // Check file stats
      fs.stat(resolvedFilePath, (err, stats) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("404 Not Found");
          return;
        }

        if (stats.isDirectory()) {
          // Look for index.html or README.md
          const indexHtml = path.join(resolvedFilePath, "index.html");
          if (fs.existsSync(indexHtml)) {
            resolvedFilePath = indexHtml;
          } else {
            const readmeMd = path.join(resolvedFilePath, "README.md");
            if (fs.existsSync(readmeMd)) {
              resolvedFilePath = readmeMd;
            } else {
              // Directory listing
              fs.readdir(resolvedFilePath, (readErr, files) => {
                if (readErr) {
                  res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                  res.end("Internal Server Error");
                  return;
                }
                const listItems = files
                  .map((f) => `<li><a href="${path.posix.join(safeRelativePath, f)}">${f}</a></li>`)
                  .join("\n");
                const html = `<!DOCTYPE html><html><head><title>SoroDoc - ${safeRelativePath}</title><style>body{font-family:sans-serif;padding:2rem;background:#0d1117;color:#c9d1d9;}a{color:#58a6ff;text-decoration:none;}a:hover{text-decoration:underline;}li{margin:0.5rem 0;}</style></head><body><h1>Directory: ${safeRelativePath}</h1><ul>${listItems}</ul></body></html>`;
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(html);
              });
              return;
            }
          }
        }

        const ext = path.extname(resolvedFilePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        const stream = fs.createReadStream(resolvedFilePath);
        stream.on("open", () => {
          res.writeHead(200, {
            "Content-Type": contentType,
            "X-Content-Type-Options": "nosniff",
          });
        });
        stream.on("error", () => {
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          }
          res.end("Internal Server Error");
        });
        stream.pipe(res);
      });
    });

    server.on("error", (err) => {
      reject(err);
    });

    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      const url = `http://${host}:${actualPort}`;
      resolve({
        server,
        port: actualPort,
        url,
        close: () =>
          new Promise((res, rej) => {
            server.close((closeErr) => (closeErr ? rej(closeErr) : res()));
          }),
      });
    });
  });
}
