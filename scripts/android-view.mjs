// Dev-only: streams an Android device to http://127.0.0.1:8765 (DEVICE=<adb id> PORT=<n>); clicks become taps.

import http from 'node:http';
import { execFile } from 'node:child_process';

const DEV = process.env.DEVICE ?? 'emulator-5554';
const PORT = Number(process.env.PORT ?? 8765);
const adb = (args, opts = {}) => new Promise((res, rej) =>
  execFile('adb', ['-s', DEV, ...args], { encoding: 'buffer', maxBuffer: 20e6, ...opts }, (e, out) => (e ? rej(e) : res(out))));

const page = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1">
<body style="margin:0;background:#111;display:flex;justify-content:center">
<img id=s style="height:100vh;cursor:pointer;user-select:none" draggable=false>
<script>
const s = document.getElementById('s');
let busy = false;
async function tick() {
  if (!busy) { busy = true;
    try { const b = await (await fetch('/shot?' + Date.now())).blob(); const u = URL.createObjectURL(b); const o = s.src; s.src = u; if (o) URL.revokeObjectURL(o); } catch {}
    busy = false; }
  setTimeout(tick, 250);
}
tick();
s.onclick = e => { const r = s.getBoundingClientRect();
  fetch('/tap?x=' + (e.clientX - r.left) / r.width + '&y=' + (e.clientY - r.top) / r.height); };
</script>`;

let size;
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/shot') {
      const png = await adb(['exec-out', 'screencap', '-p']);
      res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' }); res.end(png);
    } else if (u.pathname === '/tap') {
      size ??= (await adb(['shell', 'wm', 'size'])).toString().match(/(\d+)x(\d+)/).slice(1).map(Number);
      const x = Math.round(u.searchParams.get('x') * size[0]), y = Math.round(u.searchParams.get('y') * size[1]);
      await adb(['shell', 'input', 'tap', String(x), String(y)]); res.end('ok');
    } else { res.writeHead(200, { 'content-type': 'text/html' }); res.end(page); }
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(PORT, '127.0.0.1', () => console.log('emulator view on http://127.0.0.1:' + PORT));
