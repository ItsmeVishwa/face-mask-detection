/* ============================================================
   FACE MASK DETECTOR — script.js
   Features: Image upload, drag & drop, webcam, auto-scan,
             download result, scan history, live stats
   ============================================================ */

// ──────────────────────────────────────────────
// Element References
// ──────────────────────────────────────────────
const fileInput       = document.getElementById('fileInput');
const dropZone        = document.getElementById('dropZone');
const dropZoneInner   = document.getElementById('dropZoneInner');
const uploadedImage   = document.getElementById('uploadedImage');
const imageCanvas     = document.getElementById('imageCanvas');

const webcam          = document.getElementById('webcam');
const overlayCanvas   = document.getElementById('overlayCanvas');
const webcamPlaceholder = document.getElementById('webcamPlaceholder');
const autoscanBadge   = document.getElementById('autoscanBadge');

const resultsList     = document.getElementById('resultsList');
const loadingState    = document.getElementById('loadingState');
const downloadBtn     = document.getElementById('downloadBtn');
const historySection  = document.getElementById('historySection');
const historyGrid     = document.getElementById('historyGrid');

const scanImageBtn    = document.getElementById('scanImageBtn');
const clearImageBtn   = document.getElementById('clearImageBtn');
const webcamToggleBtn = document.getElementById('webcamToggleBtn');
const autoScanBtn     = document.getElementById('autoScanBtn');
const captureScanBtn  = document.getElementById('captureScanBtn');

// Stats
const totalScansEl    = document.getElementById('totalScans');
const maskedCountEl   = document.getElementById('maskedCount');
const noMaskCountEl   = document.getElementById('noMaskCount');
const complianceRateEl = document.getElementById('complianceRate');

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────
let currentMode   = 'image';   // 'image' | 'webcam'
let selectedFile  = null;
let stream        = null;
let autoScanTimer = null;
let isScanning    = false;

let stats = { total: 0, masked: 0, noMask: 0 };
let scanHistory = [];   // [ { dataUrl, label } ]

let lastAnnotatedCanvas = null;  // for download

// ──────────────────────────────────────────────
// MODE SWITCHER
// ──────────────────────────────────────────────
function switchMode(mode) {
    currentMode = mode;
    document.getElementById('tabImage').classList.toggle('active', mode === 'image');
    document.getElementById('tabWebcam').classList.toggle('active', mode === 'webcam');
    document.getElementById('imageModeView').style.display  = mode === 'image'   ? 'block' : 'none';
    document.getElementById('webcamModeView').style.display = mode === 'webcam'  ? 'block' : 'none';
    document.getElementById('imageControls').style.display  = mode === 'image'   ? 'flex'  : 'none';
    document.getElementById('webcamControls').style.display = mode === 'webcam'  ? 'flex'  : 'none';

    if (mode === 'image') {
        stopAutoScan();
        stopWebcam();
    }
    resetResults();
    downloadBtn.style.display = 'none';
}

// ──────────────────────────────────────────────
// DRAG & DROP
// ──────────────────────────────────────────────
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
});

fileInput.addEventListener('change', e => {
    if (e.target.files?.[0]) loadImageFile(e.target.files[0]);
});

function loadImageFile(file) {
    selectedFile = file;
    switchMode('image');

    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImage.src = e.target.result;
        uploadedImage.style.display = 'block';
        dropZoneInner.style.display = 'none';
        clearCanvas(imageCanvas);
        resetResults();
        scanImageBtn.disabled = false;
        clearImageBtn.style.display = 'inline-flex';
        downloadBtn.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedFile = null;
    uploadedImage.src = '';
    uploadedImage.style.display = 'none';
    dropZoneInner.style.display = 'flex';
    clearCanvas(imageCanvas);
    resetResults();
    scanImageBtn.disabled = true;
    clearImageBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    fileInput.value = '';
}

// ──────────────────────────────────────────────
// SCAN IMAGE
// ──────────────────────────────────────────────
async function scanImage() {
    if (!selectedFile || isScanning) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    imageCanvas.width  = uploadedImage.clientWidth;
    imageCanvas.height = uploadedImage.clientHeight;

    await runDetection(formData, imageCanvas);

    // Save for download
    lastAnnotatedCanvas = imageCanvas;
    downloadBtn.style.display = 'inline-flex';

    // Add to history
    addToHistory(uploadedImage.src, resultsList);
}

// ──────────────────────────────────────────────
// WEBCAM
// ──────────────────────────────────────────────
async function toggleWebcam() {
    if (stream) {
        stopAutoScan();
        stopWebcam();
    } else {
        await startWebcam();
    }
}

async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        webcam.srcObject = stream;
        webcam.style.display = 'block';
        webcamPlaceholder.style.display = 'none';
        webcamToggleBtn.innerHTML = '<span class="btn-icon">⏹</span> Stop Camera';
        autoScanBtn.style.display = 'inline-flex';
        captureScanBtn.style.display = 'inline-flex';

        webcam.onloadedmetadata = () => {
            overlayCanvas.width  = webcam.videoWidth;
            overlayCanvas.height = webcam.videoHeight;
        };

        resetResults();
    } catch (err) {
        console.error('Webcam error:', err);
        alert('Could not access camera. Please check browser permissions.');
    }
}

function stopWebcam() {
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
    webcam.srcObject = null;
    webcam.style.display = 'none';
    webcamPlaceholder.style.display = 'flex';
    webcamToggleBtn.innerHTML = '<span class="btn-icon">📹</span> Start Camera';
    autoScanBtn.style.display = 'none';
    captureScanBtn.style.display = 'none';
    clearCanvas(overlayCanvas);
}

// ──────────────────────────────────────────────
// CAPTURE & SCAN (Webcam)
// ──────────────────────────────────────────────
async function captureAndScan() {
    if (!stream || isScanning) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width  = webcam.videoWidth;
    tempCanvas.height = webcam.videoHeight;
    tempCanvas.getContext('2d').drawImage(webcam, 0, 0);

    const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg'));
    const formData = new FormData();
    formData.append('file', blob, 'webcam.jpg');

    await runDetection(formData, overlayCanvas);

    // History
    addToHistory(tempCanvas.toDataURL(), resultsList);
}

// ──────────────────────────────────────────────
// AUTO-SCAN (Webcam)
// ──────────────────────────────────────────────
function toggleAutoScan() {
    if (autoScanTimer) {
        stopAutoScan();
    } else {
        startAutoScan();
    }
}

function startAutoScan() {
    autoScanBtn.classList.add('active');
    autoScanBtn.innerHTML = '<span class="btn-icon">⏸</span> Stop Auto';
    autoscanBadge.style.display = 'flex';
    autoScanTimer = setInterval(captureAndScan, 2500);
}

function stopAutoScan() {
    clearInterval(autoScanTimer);
    autoScanTimer = null;
    autoScanBtn.classList.remove('active');
    autoScanBtn.innerHTML = '<span class="btn-icon">🔄</span> Auto Scan';
    autoscanBadge.style.display = 'none';
}

// ──────────────────────────────────────────────
// CORE DETECTION
// ──────────────────────────────────────────────
async function runDetection(formData, canvas) {
    isScanning = true;
    showLoading(true);

    try {
        const response = await fetch('/predict', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        displayResults(data.detections, canvas);
        updateStats(data.detections);
    } catch (err) {
        console.error(err);
        resultsList.innerHTML = `<div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <p>Connection error</p>
            <span>${err.message}</span>
        </div>`;
    } finally {
        showLoading(false);
        isScanning = false;
    }
}

// ──────────────────────────────────────────────
// DISPLAY RESULTS
// ──────────────────────────────────────────────
function displayResults(detections, canvas) {
    clearCanvas(canvas);
    resultsList.innerHTML = '';

    if (!detections || detections.length === 0) {
        resultsList.innerHTML = `<div class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No faces detected</p>
            <span>Try a clearer image with faces visible</span>
        </div>`;
        return;
    }

    const maskedInFrame = detections.filter(d => d.prediction.label === 'Mask').length;
    const total = detections.length;
    const rate = Math.round((maskedInFrame / total) * 100);

    // Summary card
    const summaryCard = document.createElement('div');
    summaryCard.className = 'result-summary-card';
    summaryCard.innerHTML = `
        <div>
            <div class="summary-label">Detected Faces</div>
            <div class="summary-value">${total} face${total > 1 ? 's' : ''}</div>
        </div>
        <div style="text-align:right;">
            <div class="summary-label">Compliance</div>
            <div class="summary-value" style="color: ${rate === 100 ? 'var(--success)' : rate > 50 ? 'var(--warning)' : 'var(--danger)'}">${rate}%</div>
        </div>
    `;
    resultsList.appendChild(summaryCard);

    // Individual cards
    detections.forEach((det, i) => {
        const isMask = det.prediction.label === 'Mask';
        const color  = isMask ? '#10b981' : '#ef4444';
        const conf   = det.prediction.confidence;

        drawBox(canvas, det.box, det.prediction.label, conf, color);

        const card = document.createElement('div');
        card.className = `result-card ${isMask ? 'mask' : 'no-mask'}`;
        card.style.animationDelay = `${i * 0.08}s`;
        card.innerHTML = `
            <div class="face-badge">#${i + 1}</div>
            <div class="result-info">
                <div class="result-label">${isMask ? '✅ Mask Detected' : '❌ No Mask'}</div>
                <div class="confidence-bar-wrap">
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${conf.toFixed(1)}%"></div>
                    </div>
                    <span class="conf-text">${conf.toFixed(1)}%</span>
                </div>
            </div>
            <div class="result-emoji">${isMask ? '😷' : '😐'}</div>
        `;
        resultsList.appendChild(card);
    });
}

// ──────────────────────────────────────────────
// DRAW BOUNDING BOX ON CANVAS
// ──────────────────────────────────────────────
function drawBox(canvas, box, label, confidence, color) {
    const ctx = canvas.getContext('2d');
    let scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0;

    if (currentMode === 'image') {
        const imgRatio = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
        const cW = canvas.width, cH = canvas.height;
        const cRatio = cW / cH;
        let drawW = cW, drawH = cH;
        if (imgRatio > cRatio) {
            drawH = cW / imgRatio;
            offsetY = (cH - drawH) / 2;
        } else {
            drawW = cH * imgRatio;
            offsetX = (cW - drawW) / 2;
        }
        scaleX = drawW / uploadedImage.naturalWidth;
        scaleY = drawH / uploadedImage.naturalHeight;
    } else {
        scaleX = canvas.clientWidth  / (webcam.videoWidth  || 1);
        scaleY = canvas.clientHeight / (webcam.videoHeight || 1);
    }

    const x  = offsetX + box.startX * scaleX;
    const y  = offsetY + box.startY * scaleY;
    const w  = (box.endX - box.startX) * scaleX;
    const h  = (box.endY - box.startY) * scaleY;
    const text = `${label}  ${confidence.toFixed(1)}%`;

    // Shadow glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    // Box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Label background
    ctx.font = 'bold 14px Outfit, sans-serif';
    const tw = ctx.measureText(text).width + 16;
    const th = 24;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y - th - 2, tw, th, 5);
    ctx.fill();

    // Label text
    ctx.fillStyle = '#000';
    ctx.fillText(text, x + 8, y - 7);
}

// ──────────────────────────────────────────────
// DOWNLOAD RESULT
// ──────────────────────────────────────────────
function downloadResult() {
    if (!lastAnnotatedCanvas) return;

    // Compose final image: original + overlay
    const outCanvas = document.createElement('canvas');
    outCanvas.width  = imageCanvas.width;
    outCanvas.height = imageCanvas.height;
    const ctx = outCanvas.getContext('2d');
    ctx.drawImage(uploadedImage, 0, 0, outCanvas.width, outCanvas.height);
    ctx.drawImage(imageCanvas, 0, 0);

    const link = document.createElement('a');
    link.download = `mask-detection-${Date.now()}.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
}

// ──────────────────────────────────────────────
// SCAN HISTORY
// ──────────────────────────────────────────────
function addToHistory(dataUrl, resultsEl) {
    const allCards = resultsEl.querySelectorAll('.result-card');
    const hasNoMask = Array.from(allCards).some(c => c.classList.contains('no-mask'));

    scanHistory.unshift({ dataUrl, hasNoMask });
    if (scanHistory.length > 6) scanHistory.pop();

    renderHistory();
    historySection.style.display = 'flex';
}

function renderHistory() {
    historyGrid.innerHTML = '';
    scanHistory.forEach((item, i) => {
        const thumb = document.createElement('div');
        thumb.className = `history-thumb ${item.hasNoMask ? 'has-nomask' : 'all-safe'}`;
        thumb.title = item.hasNoMask ? 'Has no-mask' : 'All masked';
        thumb.innerHTML = `
            <img src="${item.dataUrl}" alt="Scan ${i+1}">
            <span class="history-badge">${item.hasNoMask ? '❌' : '✅'}</span>
        `;
        historyGrid.appendChild(thumb);
    });
}

// ──────────────────────────────────────────────
// LIVE STATS UPDATE
// ──────────────────────────────────────────────
function updateStats(detections) {
    if (!detections?.length) return;

    const newMasked = detections.filter(d => d.prediction.label === 'Mask').length;
    const newNoMask = detections.length - newMasked;

    stats.total  += detections.length;
    stats.masked += newMasked;
    stats.noMask += newNoMask;

    animateCount(totalScansEl,    stats.total);
    animateCount(maskedCountEl,   stats.masked);
    animateCount(noMaskCountEl,   stats.noMask);

    const rate = stats.total > 0 ? Math.round((stats.masked / stats.total) * 100) : 0;
    complianceRateEl.textContent = `${rate}%`;
}

function animateCount(el, target) {
    const start = parseInt(el.textContent) || 0;
    const diff  = target - start;
    const dur   = 500;
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / dur, 1);
        el.textContent = Math.round(start + diff * easeOut(progress));
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function showLoading(show) {
    loadingState.style.display = show ? 'flex' : 'none';
    resultsList.style.display  = show ? 'none'  : 'flex';
}

function resetResults() {
    resultsList.innerHTML = `<div class="empty-state">
        <div class="empty-icon">🎭</div>
        <p>Scan an image to see results</p>
        <span>Faces and mask status will appear here</span>
    </div>`;
}

function clearCanvas(canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}
