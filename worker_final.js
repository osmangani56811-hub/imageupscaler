// ImageUpscaler — Free, Unlimited, Client-Side Batch Image Upscaler
// Everything runs in the browser: no AI API cost, no daily limits.
// Features: custom scale/resolution, denoise, sharpen, JPG/PNG/WebP export,
// before/after comparison, batch processing.

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
    --bg: #0c1211; --bg-elevated: #121a19; --panel: #17201f; --border: #263332;
    --text: #eaf2f0; --text-dim: #93a5a2; --accent: #4fd1c5; --amber: #e8a33d; --danger: #e8623d;
    --radius: 10px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif;
    background-image: radial-gradient(circle at 1px 1px, rgba(79,209,197,0.06) 1px, transparent 0);
    background-size: 26px 26px;
  }
  .wrap { max-width: 760px; margin: 0 auto; padding: 28px 18px 60px; }
  header { text-align: center; margin-bottom: 26px; }
  .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; letter-spacing: 0.14em; color: var(--accent); text-transform: uppercase; }
  h1 { font-family: 'Space Grotesk', sans-serif; font-size: 1.9rem; margin: 6px 0 8px; letter-spacing: -0.01em; }
  header p { color: var(--text-dim); font-size: 0.9rem; max-width: 44ch; margin: 0 auto; line-height: 1.5; }
  .badge-free { display: inline-block; margin-top: 10px; padding: 4px 12px; border-radius: 20px; background: rgba(79,209,197,0.12); color: var(--accent); font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.05em; }
  .panel { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; margin-bottom: 16px; }
  .panel h2 { font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; margin: 0 0 12px; color: var(--text); }
  .dropzone { border: 1.5px dashed var(--border); border-radius: var(--radius); padding: 34px 16px; text-align: center; cursor: pointer; transition: border-color .15s, background .15s; }
  .dropzone.drag { border-color: var(--accent); background: rgba(79,209,197,0.06); }
  .dropzone .icon { font-size: 1.6rem; margin-bottom: 8px; }
  .dropzone strong { color: var(--accent); }
  .dropzone small { display:block; color: var(--text-dim); margin-top: 4px; font-size: 0.78rem; }
  input[type="file"] { display: none; }

  .settings-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .field { flex: 1; min-width: 130px; }
  .field label { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 6px; }
  .field label span.val { color: var(--accent); text-transform: none; }
  select { width: 100%; padding: 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.88rem; }
  input[type="range"] { width: 100%; accent-color: var(--accent); }
  input[type="number"] { width: 100%; padding: 9px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.85rem; }
  .toggle-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.82rem; color: var(--text-dim); }
  .toggle-row input { accent-color: var(--accent); width: 16px; height: 16px; }
  .custom-res { display: none; gap: 10px; margin-bottom: 12px; }
  .custom-res.show { display: flex; }

  .queue { margin-top: 6px; display: flex; flex-direction: column; gap: 8px; }
  .item { display: flex; align-items: center; gap: 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; flex-wrap: wrap; cursor: pointer; }
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

  /* Before/after compare modal */
  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 50; align-items: center; justify-content: center; padding: 16px; }
  .modal-overlay.show { display: flex; }
  .modal-box { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; max-width: 480px; width: 100%; }
  .modal-box h3 { margin: 0 0 10px; font-family: 'Space Grotesk', sans-serif; font-size: 0.95rem; }
  .compare-wrap { position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; border-radius: 8px; background: #000; touch-action: none; }
  .compare-wrap img { position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
  .compare-after-clip { position: absolute; top:0; left:0; width: 50%; height: 100%; overflow: hidden; }
  .compare-after-clip img { width: 200%; max-width: none; height: 100%; }
  .compare-handle { position: absolute; top: 0; bottom: 0; left: 50%; width: 3px; background: var(--accent); cursor: ew-resize; }
  .compare-handle::after { content: '⇔'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: var(--accent); color: #06201d; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
  .compare-labels { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; color: var(--text-dim); margin-top: 6px; }
  .modal-close { margin-top: 10px; width: 100%; padding: 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; color: var(--text); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow">Batch Image Upscaler</div>
    <h1>ImageUpscaler</h1>
    <p>Upscale, sharpen and denoise many images at once, right in your browser — clean, natural results tuned for microstock review.</p>
    <div class="badge-free">100% FREE &middot; NO LIMITS &middot; RUNS ON-DEVICE</div>
  </header>

  <div class="panel">
    <div class="dropzone" id="dropzone">
      <div class="icon">📥</div>
      <div><strong>Choose images</strong> or drag & drop here</div>
      <small>Select multiple files at once — JPG, PNG, WEBP</small>
    </div>
    <input type="file" id="fileInput" accept="image/*" multiple>
  </div>

  <div class="panel">
    <h2>Upscale Settings</h2>
    <div class="settings-grid">
      <div class="field">
        <label>Scale Factor</label>
        <select id="scaleSelect">
          <option value="2" selected>2x</option>
          <option value="3">3x</option>
          <option value="4">4x</option>
          <option value="6">6x</option>
          <option value="8">8x</option>
          <option value="16">16x</option>
          <option value="custom">Custom resolution…</option>
        </select>
      </div>
    </div>
    <div class="custom-res" id="customResRow">
      <div class="field">
        <label>Target Width (px)</label>
        <input type="number" id="customWidth" placeholder="e.g. 6000">
      </div>
      <div class="field">
        <label>Target Height (px)</label>
        <input type="number" id="customHeight" placeholder="e.g. 4000">
      </div>
    </div>

    <div class="settings-grid">
      <div class="field">
        <label>Sharpen Strength <span class="val" id="sharpVal">40%</span></label>
        <input type="range" id="sharpRange" min="0" max="100" value="40">
      </div>
      <div class="field">
        <label>Denoise Strength <span class="val" id="denoiseVal">20%</span></label>
        <input type="range" id="denoiseRange" min="0" max="100" value="20">
      </div>
    </div>

    <div class="settings-grid">
      <div class="field">
        <label>Output Format</label>
        <select id="formatSelect">
          <option value="jpeg" selected>JPG</option>
          <option value="png">PNG (lossless)</option>
          <option value="webp">WebP</option>
        </select>
      </div>
      <div class="field" id="qualityField">
        <label>Quality <span class="val" id="qualityVal">95%</span></label>
        <input type="range" id="qualityRange" min="60" max="100" value="95">
      </div>
    </div>
  </div>

  <div class="panel">
    <h2>Queue</h2>
    <div class="queue" id="queue"></div>
    <div class="actions">
      <button class="btn-primary" id="processBtn" disabled>Start Upscaling</button>
      <button class="btn-secondary" id="downloadBtn" disabled>⬇️ Download ZIP</button>
    </div>
    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <div class="progress-label" id="progressLabel">0 / 0 processed</div>
    <div class="note">
      <strong>Tip:</strong> tap any completed thumbnail to see a before/after comparison.
      Everything runs on your device — nothing is uploaded, so it's free with no daily limit.
      This sharpens and cleans up existing detail; it can't invent detail that truly isn't in the source image.
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalOverlay">
  <div class="modal-box">
    <h3>Before / After</h3>
    <div class="compare-wrap" id="compareWrap">
      <img id="compareBefore" src="">
      <div class="compare-after-clip" id="compareAfterClip">
        <img id="compareAfter" src="">
      </div>
      <div class="compare-handle" id="compareHandle"></div>
    </div>
    <div class="compare-labels"><span>ORIGINAL</span><span>UPSCALED</span></div>
    <button class="modal-close" id="modalClose">Close</button>
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

const scaleSelect = document.getElementById('scaleSelect');
const customResRow = document.getElementById('customResRow');
const sharpRange = document.getElementById('sharpRange');
const sharpVal = document.getElementById('sharpVal');
const denoiseRange = document.getElementById('denoiseRange');
const denoiseVal = document.getElementById('denoiseVal');
const formatSelect = document.getElementById('formatSelect');
const qualityField = document.getElementById('qualityField');
const qualityRange = document.getElementById('qualityRange');
const qualityVal = document.getElementById('qualityVal');

scaleSelect.addEventListener('change', () => {
  customResRow.classList.toggle('show', scaleSelect.value === 'custom');
});
sharpRange.addEventListener('input', () => sharpVal.textContent = sharpRange.value + '%');
denoiseRange.addEventListener('input', () => denoiseVal.textContent = denoiseRange.value + '%');
qualityRange.addEventListener('input', () => qualityVal.textContent = qualityRange.value + '%');
formatSelect.addEventListener('change', () => {
  qualityField.style.display = formatSelect.value === 'png' ? 'none' : 'block';
});

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
    if (item.status === 'done') {
      div.addEventListener('click', () => openCompare(item));
    }
    queueEl.appendChild(div);
  }
}

// ---- Image processing pipeline ----

function boxBlur(ctx, w, h, radius) {
  if (radius <= 0) return;
  const src = ctx.getImageData(0, 0, w, h);
  const data = src.data;
  const out = new Uint8ClampedArray(data.length);
  const r = radius;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rSum=0,gSum=0,bSum=0,count=0;
      for (let dy=-r; dy<=r; dy++) {
        const ny = y+dy;
        if (ny<0||ny>=h) continue;
        for (let dx=-r; dx<=r; dx++) {
          const nx = x+dx;
          if (nx<0||nx>=w) continue;
          const i=(ny*w+nx)*4;
          rSum+=data[i]; gSum+=data[i+1]; bSum+=data[i+2]; count++;
        }
      }
      const i=(y*w+x)*4;
      out[i]=rSum/count; out[i+1]=gSum/count; out[i+2]=bSum/count; out[i+3]=data[i+3];
    }
  }
  ctx.putImageData(new ImageData(out, w, h), 0, 0);
}

function sharpenCanvas(ctx, w, h, amount) {
  if (amount <= 0) return;
  const src = ctx.getImageData(0, 0, w, h);
  const data = src.data;
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y*w+x)*4;
      if (x===0||y===0||x===w-1||y===h-1) {
        out[i]=data[i]; out[i+1]=data[i+1]; out[i+2]=data[i+2]; out[i+3]=data[i+3];
        continue;
      }
      for (let c=0;c<3;c++) {
        const center = data[(y*w+x)*4+c];
        const up = data[((y-1)*w+x)*4+c];
        const down = data[((y+1)*w+x)*4+c];
        const left = data[(y*w+x-1)*4+c];
        const right = data[(y*w+x+1)*4+c];
        const lap = center*4 - up - down - left - right;
        out[i+c] = Math.max(0, Math.min(255, center + lap * amount));
      }
      out[i+3]=data[i+3];
    }
  }
  ctx.putImageData(new ImageData(out, w, h), 0, 0);
}

async function upscaleImage(file, targetW, targetH, sharpAmount, denoiseAmount, format, quality) {
  const bitmap = await createImageBitmap(file);

  let curCanvas = document.createElement('canvas');
  curCanvas.width = bitmap.width;
  curCanvas.height = bitmap.height;
  let ctx = curCanvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  // Denoise pass on the original-resolution image (cheaper, and avoids amplifying noise on upscale)
  if (denoiseAmount > 0) {
    const radius = denoiseAmount > 66 ? 2 : 1;
    boxBlur(ctx, curCanvas.width, curCanvas.height, radius);
  }

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

  ctx = curCanvas.getContext('2d');
  if (sharpAmount > 0) {
    sharpenCanvas(ctx, curW, curH, sharpAmount);
  }

  const dims = curW + '×' + curH;
  const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const q = format === 'png' ? undefined : quality;
  const blob = await new Promise(resolve => curCanvas.toBlob(resolve, mime, q));
  const dataUrl = curCanvas.toDataURL('image/jpeg', 0.85); // for before/after preview only
  return { blob, dims, dataUrl };
}

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  downloadBtn.disabled = true;
  processedCount = 0;
  progressFill.style.width = '0%';

  const scaleVal = scaleSelect.value;
  const sharpAmount = parseInt(sharpRange.value, 10) / 100 * 1.6; // map 0-100% to 0-1.6 kernel strength
  const denoiseAmount = parseInt(denoiseRange.value, 10);
  const format = formatSelect.value;
  const quality = parseInt(qualityRange.value, 10) / 100;
  const ext = format === 'png' ? '.png' : format === 'webp' ? '.webp' : '.jpg';

  for (const item of queue) {
    item.status = 'working';
    renderQueue();
    try {
      const bitmap = await createImageBitmap(item.file);
      let targetW, targetH;
      if (scaleVal === 'custom') {
        const cw = parseInt(document.getElementById('customWidth').value, 10);
        const ch = parseInt(document.getElementById('customHeight').value, 10);
        if (cw > 0 && ch > 0) { targetW = cw; targetH = ch; }
        else if (cw > 0) { targetW = cw; targetH = Math.round(bitmap.height * (cw / bitmap.width)); }
        else { targetW = bitmap.width * 2; targetH = bitmap.height * 2; }
      } else {
        const factor = parseFloat(scaleVal);
        targetW = Math.round(bitmap.width * factor);
        targetH = Math.round(bitmap.height * factor);
      }

      const { blob, dims, dataUrl } = await upscaleImage(item.file, targetW, targetH, sharpAmount, denoiseAmount, format, quality);
      item.status = 'done';
      item.resultBlob = blob;
      item.dims = dims;
      item.previewDataUrl = dataUrl;
      const dotIdx = item.file.name.lastIndexOf('.');
      const base = dotIdx > -1 ? item.file.name.slice(0, dotIdx) : item.file.name;
      item.resultName = base + '_upscaled' + ext;
    } catch (e) {
      item.status = 'error';
    }
    processedCount++;
    progressFill.style.width = Math.round((processedCount / queue.length) * 100) + '%';
    progressLabel.textContent = processedCount + ' / ' + queue.length + ' processed';
    renderQueue();
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

// ---- Before/after compare modal ----
const modalOverlay = document.getElementById('modalOverlay');
const compareBefore = document.getElementById('compareBefore');
const compareAfter = document.getElementById('compareAfter');
const compareAfterClip = document.getElementById('compareAfterClip');
const compareHandle = document.getElementById('compareHandle');
const compareWrap = document.getElementById('compareWrap');
const modalClose = document.getElementById('modalClose');

function openCompare(item) {
  compareBefore.src = URL.createObjectURL(item.file);
  compareAfter.src = item.previewDataUrl;
  compareAfterClip.style.width = '50%';
  compareHandle.style.left = '50%';
  modalOverlay.classList.add('show');
}
modalClose.addEventListener('click', () => modalOverlay.classList.remove('show'));
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('show'); });

let dragging = false;
function setComparePos(clientX) {
  const rect = compareWrap.getBoundingClientRect();
  let pct = ((clientX - rect.left) / rect.width) * 100;
  pct = Math.max(0, Math.min(100, pct));
  compareAfterClip.style.width = pct + '%';
  compareHandle.style.left = pct + '%';
}
compareHandle.addEventListener('mousedown', () => dragging = true);
compareHandle.addEventListener('touchstart', () => dragging = true);
window.addEventListener('mousemove', (e) => { if (dragging) setComparePos(e.clientX); });
window.addEventListener('touchmove', (e) => { if (dragging) setComparePos(e.touches[0].clientX); });
window.addEventListener('mouseup', () => dragging = false);
window.addEventListener('touchend', () => dragging = false);
compareWrap.addEventListener('click', (e) => setComparePos(e.clientX));
</script>
</body>
</html>`;
