// Smoke test: boot the server and verify the page plus its static assets.
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

function get(path) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: "127.0.0.1", port: PORT, path }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      })
      .on("error", reject);
  });
}

function waitForServer(attempt = 0) {
  return get("/").catch((error) => {
    if (attempt >= 40) throw error;
    return new Promise((resolve) => setTimeout(resolve, 100)).then(() =>
      waitForServer(attempt + 1)
    );
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await waitForServer();

  const home = await get("/");
  assert(home.status === 200, `home returned ${home.status}`);
  assert(home.body.includes("Cloud Deploy"), "home is missing the Cloud Deploy title");
  assert(home.body.includes("From <span class=\"mono-strong\">git&nbsp;push</span>"), "home is missing the hero headline");
  assert(home.body.includes("id=\"pipeline\""), "home is missing the pipeline section");

  const css = await get("/style.css");
  assert(css.status === 200, `style.css returned ${css.status}`);
  assert(css.body.includes("--accent"), "style.css is missing its design tokens");

  const js = await get("/app.js");
  assert(js.status === 200, `app.js returned ${js.status}`);
  assert(js.body.includes("helloForm"), "app.js is missing the demo wiring");

  const icon = await get("/favicon.svg");
  assert(icon.status === 200, `favicon.svg returned ${icon.status}`);

  console.log("PASS: home page and static assets load");
  finish(0);
}

main().catch((error) => {
  console.log("FAIL:", error.message);
  finish(1);
});

setTimeout(() => finish(1), 8000);
