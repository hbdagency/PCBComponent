import fs from "node:fs/promises";
const CDP = "http://127.0.0.1:9223";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const res = await fetch(`${CDP}/json/new?about:blank`, { method: "PUT" });
const target = await res.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((resolve) => {
  const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params }));
});

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url: "http://127.0.0.1:4173/index.html" });
await wait(1500);

const expr = `(() => {
  const vw = innerWidth;
  const steps = [...document.querySelectorAll('.step')].map(s => ({ pad: getComputedStyle(s).padding, rect: s.getBoundingClientRect().toJSON() }));
  const gs = getComputedStyle(document.querySelector('.process-steps'));
  const band = document.querySelector('.team-band p').getBoundingClientRect().toJSON();
  const imgs = [...document.querySelectorAll('.service-art img')].map(i => ({ src: i.getAttribute('src'), w: i.naturalWidth }));
  const wide = [...document.querySelectorAll('body *')].filter(el => !el.closest('.marquee') && !el.closest('.toolbelt')).filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 1 || r.left < -1); }).map(el => el.tagName + '.' + String(el.className).slice(0, 30));
  return JSON.stringify({ vw, docW: document.documentElement.scrollWidth, grid: gs.gridTemplateColumns, steps, band, imgs, wide: wide.slice(0, 8) }, null, 1);
})()`;
const out = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(out.result.value);
ws.close();
await fetch(`${CDP}/json/close/${target.id}`);
