#!/usr/bin/env node
/* eslint-env node */
import { createServer } from "http";
import { readFile, watch } from "fs";
import { join } from "path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  options: {
    port: {
      type: "string",
      short: "p",
      default: "8080",
    },
    dir: {
      type: "string",
      short: "d",
      default: "docs",
    },
  },
  allowPositionals: true,
});

const port = positionals[0] || values.port;
const dir = positionals[1] || values.dir;

const server = createServer((req, res) => {
  const url = req.url === "/" ? "/index.html" : req.url;
  const file = join(dir, url);

  readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      const contentType = url.endsWith(".html")
        ? "text/html"
        : url.endsWith(".css")
          ? "text/css"
          : "text/plain";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
});

server.listen(port, () => {
  console.log(`Serving ${dir} at http://localhost:${port}`);
  console.log("Watching for file changes...");
});

// Watch for file changes and restart
watch(dir, { recursive: true }, (eventType, filename) => {
  if (filename) {
    console.log(`File changed: ${filename}`);
    console.log("Restarting server...");
    server.close(() => {
      process.exit(0);
    });
  }
});
