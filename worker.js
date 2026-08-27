// ImageUpscaler — Batch AI Image Upscale/Enhance Tool
// Cloudflare Workers AI (pruna/p-image-upscale)
// Single-file Worker for GitHub -> Cloudflare auto-deploy

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(HTML_PAGE, {
        headers: { "content-type": "text/html;charset=UTF-8" },
      });
    }

    if (url.pathname === "/upscale" && request.method === "POST") {
      return handleUpscale(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleUpscale(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    const target = parseInt(formData.get("target") || "4", 10); // target megapixels (1-128)
    const mode = formData.get("mode") || "balanced"; // natural | balanced | max

    if (!file) return jsonError("No image received", 400);

    // Microstock-safe presets: control enhance_details per mode
    // to avoid over-sharpening halos / unnatural texture
    const enhanceDetails = mode !== "natural";

    const arrayBuffer = await file.arrayBuffer();
    const mimeType = file.type || "image/jpeg";
    const base64 = arrayBufferToBase64(arrayBuffer);
    const dataUri = `data:${mimeType};base64,${base64}`;

    const result = await env.AI.run("pruna/p-image-upscale", {
      image: dataUri,
      target: target,
      enhance_details: enhanceDetails,
      output_format: "jpg",
    });

    // result.image is returned as a data URI string; strip the prefix for the client
    let outImage = result.image;
    if (typeof outImage === "string" && outImage.startsWith("data:")) {
      outImage = outImage.split(",")[1];
    }

    return new Response(
      JSON.stringify({
        success: true,
        image: outImage,
        filename: file.name || "image.jpg",
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return jsonError("Error: " + err.message, 500);
  }
}

// Converts an ArrayBuffer to a base64 string in chunks to avoid call-stack limits on large images
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ImageUpscaler — AI Batch Image Upscaler</title>
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
    --accent-dim: #2b746c;
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
    background-image:
      radial-gradient(circle at 1px 1px, rgba(79,209,197,0.06) 1px, transparent 0);
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
  h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.9rem;
    margin: 6px 0 8px;
    letter-spacing: -0.01em;
  }
  header p {
    color: var(--text-dim);
    font-size: 0.9rem;
    max-width: 42ch;
    margin: 0 auto;
    line-height: 1.5;
  }

  .panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px;
    margin-bottom: 16px;
  }

  .dropzone {
    border: 1.5px dashed var(--border);
    border-radius: var(--radius);
    padding: 34px 16px;
    text-align: center;
    cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .dropzone.drag { border-color: var(--accent); background: rgba(79,209,197,0.06); }
  .dropzone .icon { font-size: 1.6rem; margin-bottom: 8px; }
  .dropzone strong { color: var(--accent); }
  .dropzone small { display:block; color: var(--text-dim); margin-top: 4px; font-size: 0.78rem; }
  input[type="file"] { display: none; }

  .settings { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
  .field { flex: 1; min-width: 140px; }
  .field label {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.68rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 6px;
  }
  select {
    width: 100%;
    padding: 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 0.88rem;
  }

  .queue { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
  }
  .item img { width: 40px; height: 40px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .item .name {
    flex: 1;
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item .status {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.7rem;
    padding: 3px 8px;
    border-radius: 20px;
    background: var(--border);
    color: var(--text-dim);
    flex-shrink: 0;
  }
  .item .status.done { background: rgba(79,209,197,0.15); color: var(--accent); }
  .item .status.error { background: rgba(232,98,61,0.15); color: var(--danger); }
  .item .status.working { background: rgba(232,163,61,0.15); color: var(--amber); }
  .item .err-msg {
    font-size: 0.68rem;
    color: var(--danger);
    flex-basis: 100%;
    margin-top: 4px;
  }

  .actions { display: flex; gap: 10px; margin-top: 16px; }
  button {
    flex: 1;
    padding: 13px;
    border: none;
    border-radius: 8px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.92rem;
    cursor: pointer;
  }
  .btn-primary { background: var(--accent); color: #06201d; }
  .btn-primary:disabled { background: var(--border); color: var(--text-dim); cursor: not-allowed; }
  .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }

  .progress-bar {
    height: 6px;
    background: var(--bg-elevated);
    border-radius: 10px;
    overflow: hidden;
    margin-top: 14px;
  }
  .progress-fill { height: 100%; background: var(--accent); width: 0%; transition: width .25s; }
  .progress-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.72rem;
    color: var(--text-dim);
    margin-top: 6px;
    text-align: center;
  }

  .note {
    font-size: 0.76rem;
    color: var(--text-dim);
    line-height: 1.5;
    margin-top: 10px;
  }
  .note strong { color: var(--accent); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="eyebrow">Batch AI Upscaler</div>
    <h1>ImageUpscaler</h1>
    <p>Upscale and enhance many images at once — clean, natural results tuned to pass microstock quality review.</p>
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
        <label>Output Size</label>
        <select id="targetSelect">
          <option value="4">4 MP (Standard)</option>
          <option value="8" selected>8 MP (High)</option>
          <option value="16">16 MP (Print)</option>
          <option value="24">24 MP (Max)</option>
        </select>
      </div>
      <div class="field">
        <label>Mode</label>
        <select id="modeSelect">
          <option value="natural">Natural (safest)</option>
          <option value="balanced" selected>Balanced</option>
          <option value="max">Max Detail</option>
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
      <strong>Microstock tip:</strong> "Natural" mode has the best chance of passing review —
      it avoids the over-sharpening halos and noise that trigger rejections. "Max Detail" is sharper
      but can look over-processed on some images. Always zoom to 100% before uploading to a stock site.
    </div>
  </div>
</div>

<script>
let queue = []; // {file, id, status, resultB64, resultName, error}
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
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('drag');
  addFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => addFiles(fileInput.files));

function addFiles(fileList) {
  for (const file of fileList) {
    if (!file.type.startsWith('image/')) continue;
    const id = Math.random().toString(36).slice(2);
    queue.push({ file, id, status: 'queued' });
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
    const statusText = {
      queued: 'Queued',
      working: 'Processing',
      done: 'Done',
      error: 'Error'
    }[item.status];
    div.innerHTML =
      '<img src="' + url + '">' +
      '<div class="name">' + item.file.name + '</div>' +
      '<div class="status ' + item.status + '">' + statusText + '</div>' +
      (item.error ? '<div class="err-msg">' + item.error + '</div>' : '');
    queueEl.appendChild(div);
  }
}

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  downloadBtn.disabled = true;
  processedCount = 0;
  progressFill.style.width = '0%';

  const target = document.getElementById('targetSelect').value;
  const mode = document.getElementById('modeSelect').value;
  const CONCURRENCY = 2; // keep low to avoid timeouts on large batches

  let index = 0;
  async function worker() {
    while (index < queue.length) {
      const item = queue[index++];
      item.status = 'working';
      renderQueue();
      try {
        const formData = new FormData();
        formData.append('image', item.file);
        formData.append('target', target);
        formData.append('mode', mode);
        const res = await fetch('/upscale', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          item.status = 'done';
          item.resultB64 = data.image;
          const dotIdx = item.file.name.lastIndexOf('.');
          const base = dotIdx > -1 ? item.file.name.slice(0, dotIdx) : item.file.name;
          item.resultName = base + '_upscaled.jpg';
        } else {
          item.status = 'error';
          item.error = data.error || 'Unknown error';
        }
      } catch (e) {
        item.status = 'error';
        item.error = e.message;
      }
      processedCount++;
      progressFill.style.width = Math.round((processedCount / queue.length) * 100) + '%';
      progressLabel.textContent = processedCount + ' / ' + queue.length + ' processed';
      renderQueue();
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);

  processBtn.disabled = false;
  const anyDone = queue.some(i => i.status === 'done');
  downloadBtn.disabled = !anyDone;
});

downloadBtn.addEventListener('click', async () => {
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Building ZIP...';

  const zip = new JSZip();
  for (const item of queue) {
    if (item.status === 'done' && item.resultB64) {
      zip.file(item.resultName, item.resultB64, { base64: true });
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
