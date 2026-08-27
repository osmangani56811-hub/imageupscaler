// ImageUpscaler — Batch AI Image Upscale/Enhance Tool
// Cloudflare Workers AI (pruna/p-image-upscale) দিয়ে চলে
// একটাই ফাইল — GitHub-এ paste করে auto-deploy করা যাবে

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
    const scale = parseInt(formData.get("scale") || "2", 10); // 2 or 4
    const mode = formData.get("mode") || "balanced"; // natural | balanced | max

    if (!file) return jsonError("কোনো ছবি পাওয়া যায়নি", 400);

    // মাইক্রোস্টক-সেফ প্রিসেট: মোড অনুযায়ী enhance_details কন্ট্রোল করা হচ্ছে
    // যাতে over-sharpening halo / unnatural texture তৈরি না হয়
    let enhanceDetails;
    if (mode === "natural") enhanceDetails = false;
    else if (mode === "max") enhanceDetails = true;
    else enhanceDetails = true; // balanced — মডেলের নিজস্ব ব্যালান্সড ডিটেইল

    const arrayBuffer = await file.arrayBuffer();
    const imageArray = [...new Uint8Array(arrayBuffer)];

    const result = await env.AI.run("pruna/p-image-upscale", {
      image: imageArray,
      target: scale,
      enhance_details: enhanceDetails,
      output_format: "jpg",
    });

    return new Response(
      JSON.stringify({
        success: true,
        image: result.image,
        filename: file.name || "image.jpg",
      }),
      { headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return jsonError("এরর হয়েছে: " + err.message, 500);
  }
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const HTML_PAGE = `<!DOCTYPE html>
<html lang="bn">
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
    max-width: 40ch;
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
    <p>একসাথে অনেক ছবি আপস্কেল ও এনহ্যান্স করো — মাইক্রোস্টকের জন্য সেফ, নয়েজ ও আর্টিফ্যাক্ট-ফ্রি ফলাফল।</p>
  </header>

  <div class="panel">
    <div class="dropzone" id="dropzone">
      <div class="icon">📥</div>
      <div><strong>ছবি সিলেক্ট করো</strong> অথবা এখানে ড্র্যাগ করে ছাড়ো</div>
      <small>একসাথে একাধিক ছবি নেওয়া যাবে — JPG, PNG, WEBP</small>
    </div>
    <input type="file" id="fileInput" accept="image/*" multiple>

    <div class="settings">
      <div class="field">
        <label>Scale</label>
        <select id="scaleSelect">
          <option value="2">2x</option>
          <option value="4">4x</option>
        </select>
      </div>
      <div class="field">
        <label>Mode</label>
        <select id="modeSelect">
          <option value="natural">Natural (সবচেয়ে নিরাপদ)</option>
          <option value="balanced" selected>Balanced</option>
          <option value="max">Max Detail</option>
        </select>
      </div>
    </div>

    <div class="queue" id="queue"></div>

    <div class="actions">
      <button class="btn-primary" id="processBtn" disabled>Upscale শুরু করো</button>
      <button class="btn-secondary" id="downloadBtn" disabled>⬇️ ZIP ডাউনলোড</button>
    </div>

    <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
    <div class="progress-label" id="progressLabel">০ / ০ প্রসেস হয়েছে</div>

    <div class="note">
      <strong>মাইক্রোস্টক টিপ:</strong> Natural মোড রিভিউয়ারদের কাছে সবচেয়ে বেশি accept হওয়ার সম্ভাবনা রাখে —
      Max Detail বেশি শার্প করে, তবে কিছু ক্ষেত্রে over-processed লাগতে পারে। আপলোডের আগে ১০০% জুমে চেক করে নিও।
    </div>
  </div>
</div>

<script>
let queue = []; // {file, id, status, resultB64, resultName}
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
      queued: 'অপেক্ষমান',
      working: 'প্রসেস হচ্ছে',
      done: 'সম্পন্ন',
      error: 'এরর'
    }[item.status];
    div.innerHTML =
      '<img src="' + url + '">' +
      '<div class="name">' + item.file.name + '</div>' +
      '<div class="status ' + item.status + '">' + statusText + '</div>';
    queueEl.appendChild(div);
  }
}

processBtn.addEventListener('click', async () => {
  processBtn.disabled = true;
  downloadBtn.disabled = true;
  processedCount = 0;
  progressFill.style.width = '0%';

  const scale = document.getElementById('scaleSelect').value;
  const mode = document.getElementById('modeSelect').value;
  const CONCURRENCY = 2; // একসাথে বেশি রিকোয়েস্ট পাঠালে টাইমআউট হতে পারে

  let index = 0;
  async function worker() {
    while (index < queue.length) {
      const item = queue[index++];
      item.status = 'working';
      renderQueue();
      try {
        const formData = new FormData();
        formData.append('image', item.file);
        formData.append('scale', scale);
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
        }
      } catch (e) {
        item.status = 'error';
      }
      processedCount++;
      progressFill.style.width = Math.round((processedCount / queue.length) * 100) + '%';
      progressLabel.textContent = processedCount + ' / ' + queue.length + ' প্রসেস হয়েছে';
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
  downloadBtn.textContent = 'ZIP তৈরি হচ্ছে...';

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
  downloadBtn.textContent = '⬇️ ZIP ডাউনলোড';
});
</script>
</body>
</html>`;
