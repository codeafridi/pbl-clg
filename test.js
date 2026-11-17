// Minimal smoke test: start the server, request "/", check 200 + title.
const http = require("http");
const { spawn } = require("child_process");

const PORT = 3099;
const child = spawn("node", ["server.js"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: "ignore",
});

let done = false;
function finish(code) {
  if (done) return;
  done = true;
  try { child.kill(); } catch (e) {}
  process.exit(code);
}

// Give the server a moment to start.
setTimeout(() => {
  http.get(`http://localhost:${PORT}/`, (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      const ok = res.statusCode === 200 && body.includes("Cloud Deploy");
      console.log(ok ? "PASS: home page loads" : "FAIL: home page");
      finish(ok ? 0 : 1);
    });
  }).on("error", (e) => {
    console.log("FAIL:", e.message);
    finish(1);
  });
}, 500);

setTimeout(() => finish(1), 5000);
