import fs from "node:fs/promises";

const CDP = "http://127.0.0.1:9223";
const pages = ["index", "services", "team", "contact"];

async function newTarget(url) {
  const res = await fetch(`${CDP}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  return res.json();
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    } else if (msg.method) {
      listeners.forEach((fn) => fn(msg));
    }
  });
  const ready = new Promise((resolve) => ws.addEventListener("open", resolve));
  return {
    ready,
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const msgId = ++id;
        pending.set(msgId, { resolve, reject });
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    },
    on(fn) { listeners.push(fn); },
    close() { ws.close(); },
  };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const page of pages) {
  const target = await newTarget("about:blank");
  const client = connect(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send("Page.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await client.send("Page.navigate", { url: `http://127.0.0.1:4173/${page}.html` });
  await wait(1600);
  await client.send("Runtime.evaluate", { expression: "document.fonts.ready", awaitPromise: true });

  const metrics = await client.send("Page.getLayoutMetrics");
  const height = Math.ceil(metrics.cssContentSize.height);
  const shot = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: 390, height, scale: 1 },
  });
  await fs.writeFile(`screens/true-${page}-mobile.png`, Buffer.from(shot.data, "base64"));
  console.log(page, "width", metrics.cssContentSize.width, "height", height);

  if (page === "index") {
    await client.send("Runtime.evaluate", { expression: "document.querySelector('.nav-toggle').click()" });
    await wait(400);
    const menu = await client.send("Page.captureScreenshot", { format: "png" });
    await fs.writeFile("screens/true-menu-mobile.png", Buffer.from(menu.data, "base64"));
  }

  client.close();
  await fetch(`${CDP}/json/close/${target.id}`);
}
console.log("done");
