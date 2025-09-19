/* eslint-env node */
import { createServer } from "http";
import { readFile, watch } from "fs";
import { join } from "path";

const port = process.argv[2] || 8080;
const dir = process.argv[3] || "docs";

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
