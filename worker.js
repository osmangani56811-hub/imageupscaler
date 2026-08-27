// ImageUpscaler — Free, Unlimited, Client-Side Batch Image Upscaler
// No AI API calls, no cost, no limits — all processing happens in the browser
// using high-quality Canvas resizing + an unsharp-mask sharpening filter.

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(HTML_PAGE, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
};

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ImageUpscaler — Free Batch Image Upscaler</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<style>
  :root {
    --bg: #0c1211;
    --bg-elevated: #121a19;
    --panel: #17201f;
    --border: #263332;
    --text: #eaf2f0;
    --text-dim: #93a5a2;
    --accent: #4fd1c5;
    --amber: #e8a33d;
    --danger: #e8623d;
    --radius: 10px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', sans-serif;
    background-image: radial-gradient(circle at 1px 1px, rgba(79,209,197,0.06) 1px, transparent 0);
    background-size: 26px 26px;
  }
  .wrap { max-width: 720px; margin: 0 auto; padding: 28px 18px 60px; }
  header { text-align: center; margin-bottom: 26px; }
  .eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    color: var(--accent);
    text-transform: uppercase;
  }
  h1 { font-family: 'Space Grotesk', sans-serif; font-size: 1.9rem; margin: 6px 0 8px; letter-spacing: -0.01em; }
  header p { color: var(--text-dim); font-size: 0.9rem; max-width: 42ch; margin: 0 auto; line-height: 1.5; }
  .badge-free {
    display: inline-block;
    margin-top: 10px;
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(79,209,197,0.12);
    color: var(--accent);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
  }
  .panel { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; margin-bottom: 16px; }
  .dropzone { border: 1.5px dashed var(--border); border-radius: var(--radius); padding: 34px 16px; text-align: center; cursor: pointer; transition: border-color .15s, background .15s; }
  .dropzone.drag { border-color: var(--accent); background: rgba(79,209,197,0.06); }
  .dropzone .icon { font-size: 1.6rem; margin-bottom: 8px; }
  .dropzone strong { color: var(--accent); }
  .dropzone small { display:block; color: var(--text-dim); margin-top: 4px; font-size: 0.78rem; }
  input[type="file"] { display: none; }
  .settings { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
  .field { flex: 1; min-width: 140px; }
  .field label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
  select { width: 100%; padding: 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.88rem; }
  .queue { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  .item { display: flex; align-items: center; gap: 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; flex-wrap: wrap; }
  .item img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .item .name { flex: 1; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item .dims { font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--text-dim); }
  .item .status { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; padding: 3px 8px; border-radius: 20px; background: var(--border); color: var(--text-dim); flex-shrink: 0; display: flex; align-items: center; gap: 5px; }
  .item .status.done { background: rgba(79,209,197,0.15); color: var(--accent); }
  .item .status.error { background: rgba(232,98,61,0.15); color: var(--danger); }
  .item .status.working { background: rgba(232,163,61,0.15); color: var(--amber); }
  .spinner { width: 10px; height: 10px; border: 2px solid rgba(232,163,61,0.35); border-top-color: var(--amber); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .actions { display: flex; gap: 10px; margin-top: 16px; }
  button { flex: 1; padding: 13px; border: none; border-radius: 8px; font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 0.92rem; cursor: pointer; }
  .btn-primary { background: var(--accent); color: #06201d; }
  .btn-primary:disabled { background: var(--border); color: var(--text-dim); cursor: not-allowed; }
  .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
  .progress-bar { height: 6px; background: var(--bg-elevated); border-radius: 10px; overflow: hidden; margin-top: 14px; }
  .progress-fill { height: 100%; background: var(--accent); width: 0%; transition: width .2s; }
  .progress-label { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--text-dim); margin-top: 6px; text-align: center; }
  .note { font-size: 0.76rem; color: var(--text-dim); line-height: 1.5; margin-top: 10px; }
  .note strong { color: var(--accent); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow">Batch Image Upscaler</div>
    <h1>ImageUpscaler</h1>
    <p>Upscale and sharpen many images at once, right in your browser — clean, natural results tuned for microstock review.</p>
    <div class="badge-free">100% FREE &middot; NO LIMITS &middot; RUNS ON-DEVICE</div>
  </header>

  <div class="panel">
    <div class="dropzone" id="dropzone">
      <div class="icon">📥</div>
      <div><strong>Choose images</strong> or drag & drop here</div>
      <small>Select multiple files at once — JPG, PNG, WEBP</small>
    </div>
    <input type="file" id="fileInput" accept="image/*" multiple>

    <div class="settings">
      <div class="field">
        <label>Upscale Factor</label>
        <select id="scaleSelect">
          <option value="2" selected>2x</option>
          <option value="3">3x</option>
          <option value="4">4x</option>
        </select>
      </div>
      <div class="field">
        <label>Sharpening</label>
        <select id="sharpSelect">
          <option value="0">Off</option>
          <option value="0.4">Light</option>
          <option value="0.8" selected>Balanced</option>
          <option value="1.4">Strong</option>
        </select>
      </div>
    </div>

    <div class="queue" id="queue"></div>

    <div class="actions">
      <button class="btn-primary" id="processBtn" disabled>Start Upscaling</button>
      <button class="btn-secondary" id="downloadBtn" disabled>⬇️ Download ZIP</button>
    </div>

    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <div class="progress-label" id="progressLabel">0 / 0 processed</div>

    <div class="note">
      <strong>How it works:</strong> Your images never leave your device — everything runs locally in the browser
      using high-quality multi-step resizing plus a controlled sharpening filter. That means it's completely free
      with no daily limits. This works best on images that are already clean (like your AI-generated art) —
      it increases resolution and clarity, but can't invent detail that isn't there. Use "Balanced" sharpening
      for the safest results on microstock sites; "Strong" can look over-processed on some images.
    </div>
  </div>
</div>

<script>
let queue = [];
let processedCount = 0;

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const queueEl = document.getElementById('queue');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressFill = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
dropzone.addEventListener('drop', (e) => { e.preventDefault(); dropzone.classList.remove('drag'); addFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', () => addFiles(fileInput.files));

function addFiles(fileList) {
  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue;
    queue.push({ file, id: Math.random().toString(36).slice(2), status: 'queued' });
  }
  renderQueue();
  processBtn.disabled = queue.length === 0;
}

function renderQueue() {
  queueEl.innerHTML = '';
  for (const item of queue) {
    const url = URL.createObjectURL(item.file);
    const div = document.createElement('div');
    div.className = 'item';
    const statusText = { queued: 'Queued', working: 'Processing', done: 'Done', error: 'Error' }[item.status];
    const spinner = item.status === 'working' ? '<span class="spinner"></span>' : '';
    const dims = item.dims ? '<div class="dims">' + item.dims + '</div>' : '';
    div.innerHTML =
      '<img src="' + url + '">' +
      '<div class="name">' + item.file.name + '</div>' +
      dims +
      '<div class="status ' + item.status + '">' + spinner + statusText + '</div>';
    queueEl.appendChild(div);
  }
}

// High-quality upscale: step the resize up gradually (each step <=2x) for sharper results
// than a single huge stretch, then apply an unsharp-mask sharpen pass.
async function upscaleImage(file, scaleFactor, sharpAmount) {
  const bitmap = await createImageBitmap(file);
  const targetW = Math.round(bitmap.width * scaleFactor);
  const targetH = Math.round(bitmap.height * scaleFactor);

  let curCanvas = document.createElement('canvas');
  curCanvas.width = bitmap.width;
  curCanvas.height = bitmap.height;
  let ctx = curCanvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  let curW = bitmap.width, curH = bitmap.height;
  while (curW < targetW || curH < targetH) {
    const nextW = Math.min(targetW, Math.round(curW * 2));
    const nextH = Math.min(targetH, Math.round(curH * 2));
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = nextW;
    nextCanvas.height = nextH;
    const nextCtx = nextCanvas.getContext('2d');
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = 'high';
    nextCtx.drawImage(curCanvas, 0, 0, nextW, nextH);
    curCanvas = nextCanvas;
    curW = nextW; curH = nextH;
  }

  if (sharpAmount > 0) {
    sharpenCanvas(curCanvas, sharpAmount);
  }

  const dims = curW + '×' + curH;
  const blob = await new Promise(resolve => curCanvas.toBlob(resolve, 'image/jpeg', 0.94));
  return { blob, dims };
}

// Simple unsharp mask: blurred copy subtracted from original, added back at 'amount' strength.
function sharpenCanvas(canvas, amount) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const src = ctx.getImageData(0, 0, w, h);
  const data = src.data;
  const out = new Uint8ClampedArray(data.length);

  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]; // base sharpen kernel
  const k = kernel.map(v => v === 5 ? 1 + 4 * amount : (v === -1 ? -amount : 0));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        out[i] = data[i]; out[i+1] = data[i+1]; out[i+2] = data[i+2]; out[i+3] = data[i+3];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        sum += data[((y-1)*w+x)*4+c] * k[1];
        sum += data[(y*w+x-1)*4+c] * k[3];
        sum += data[(y*w+x)*4+c] * k[4];
        sum += data[(y*w+x+1)*4+c] * k[5];
        sum += data[((y+1)*w+x)*4+c] * k[7];
        out[i+c] = Math.max(0, Math.min(255, sum));
      }
      out[i+3] = data[i+3];
    }
  }
  ctx.putImageData(new ImageData(out, w, h), 0, 0);
}

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  downloadBtn.disabled = true;
  processedCount = 0;
  progressFill.style.width = '0%';

  const scale = parseFloat(document.getElementById('scaleSelect').value);
  const sharp = parseFloat(document.getElementById('sharpSelect').value);

  for (const item of queue) {
    item.status = 'working';
    renderQueue();
    try {
      const { blob, dims } = await upscaleImage(item.file, scale, sharp);
      item.status = 'done';
      item.resultBlob = blob;
      item.dims = dims;
      const dotIdx = item.file.name.lastIndexOf('.');
      const base = dotIdx > -1 ? item.file.name.slice(0, dotIdx) : item.file.name;
      item.resultName = base + '_upscaled.jpg';
    } catch (e) {
      item.status = 'error';
    }
    processedCount++;
    progressFill.style.width = Math.round((processedCount / queue.length) * 100) + '%';
    progressLabel.textContent = processedCount + ' / ' + queue.length + ' processed';
    renderQueue();
    // yield to the browser so the UI stays responsive on large batches
    await new Promise(r => setTimeout(r, 10));
  }

  processBtn.disabled = false;
  downloadBtn.disabled = !queue.some(i => i.status === 'done');
});

downloadBtn.addEventListener('click', async () => {
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Building ZIP...';
  const zip = new JSZip();
  for (const item of queue) {
    if (item.status === 'done' && item.resultBlob) {
      zip.file(item.resultName, item.resultBlob);
    }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ImageUpscaler_output.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  downloadBtn.disabled = false;
  downloadBtn.textContent = '⬇️ Download ZIP';
});
</script>
</body>
</html>`;
