const fileInput = document.getElementById('fileInput');
const uploadedImage = document.getElementById('uploadedImage');
const placeholderText = document.getElementById('placeholderText');
const imageCanvas = document.getElementById('imageCanvas');
const imageContainer = document.getElementById('imageContainer');

const webcamBtn = document.getElementById('webcamBtn');
const captureBtn = document.getElementById('captureBtn');
const videoContainer = document.getElementById('videoContainer');
const webcam = document.getElementById('webcam');
const overlayCanvas = document.getElementById('overlayCanvas');

const resultsList = document.getElementById('resultsList');
const loadingState = document.getElementById('loadingState');

let stream = null;
let currentMode = 'image'; // 'image' or 'video'
let selectedFile = null;

// Image Upload Handling
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        stopWebcam();
        currentMode = 'image';
        selectedFile = e.target.files[0];
        
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage.src = e.target.result;
            uploadedImage.style.display = 'block';
            placeholderText.style.display = 'none';
            imageContainer.style.display = 'flex';
            videoContainer.style.display = 'none';
            captureBtn.style.display = 'inline-block';
            captureBtn.textContent = 'Scan Image';
            clearCanvas(imageCanvas);
            resultsList.innerHTML = '<div class="empty-state">Ready to process.</div>';
        }
        reader.readAsDataURL(selectedFile);
    }
});

webcamBtn.addEventListener('click', async () => {
    if (stream) {
        stopWebcam();
    } else {
        await startWebcam();
    }
});

async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcam.srcObject = stream;
        
        imageContainer.style.display = 'none';
        videoContainer.style.display = 'flex';
        captureBtn.style.display = 'inline-block';
        captureBtn.textContent = 'Capture & Scan';
        webcamBtn.textContent = 'Stop Webcam';
        currentMode = 'video';
        
        // Match canvas to video size once it loads
        webcam.onloadedmetadata = () => {
            overlayCanvas.width = webcam.videoWidth;
            overlayCanvas.height = webcam.videoHeight;
        };
        
        resultsList.innerHTML = '<div class="empty-state">Aim camera at face and scan.</div>';
        clearCanvas(overlayCanvas);
    } catch (err) {
        console.error("Error accessing webcam:", err);
        alert("Could not access webcam. Please ensure permissions are granted.");
    }
}

function stopWebcam() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        webcam.srcObject = null;
    }
    webcamBtn.textContent = 'Start Webcam';
}

captureBtn.addEventListener('click', async () => {
    let formData = new FormData();
    let currentCanvas = currentMode === 'image' ? imageCanvas : overlayCanvas;
    
    if (currentMode === 'image') {
        if (!selectedFile) return;
        formData.append("file", selectedFile);
        
        // Set canvas dims to match image displayed dims
        currentCanvas.width = uploadedImage.clientWidth;
        currentCanvas.height = uploadedImage.clientHeight;
    } else {
        // Capture frame from webcam
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = webcam.videoWidth;
        tempCanvas.height = webcam.videoHeight;
        tempCanvas.getContext('2d').drawImage(webcam, 0, 0);
        
        const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg'));
        formData.append("file", blob, "webcam_capture.jpg");
    }

    // UI Loading state
    resultsList.style.display = 'none';
    loadingState.style.display = 'flex';
    clearCanvas(currentCanvas);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        displayResults(data.detections, currentCanvas);
    } catch (err) {
        console.error(err);
        resultsList.innerHTML = '<div class="empty-state" style="color:var(--danger)">Error connecting to server.</div>';
    } finally {
        loadingState.style.display = 'none';
        resultsList.style.display = 'flex';
    }
});

function drawBox(canvas, box, label, confidence, color) {
    const ctx = canvas.getContext('2d');
    
    // Scale coordinates based on displayed element size vs natural size
    let scaleX = 1, scaleY = 1;
    let offsetX = 0, offsetY = 0;
    
    if (currentMode === 'image') {
        const imgRatio = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
        const containerRatio = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        
        // Handle object-fit: contain logic to map coordinates accurately
        if (imgRatio > containerRatio) {
            drawHeight = canvas.width / imgRatio;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
        }
        
        scaleX = drawWidth / uploadedImage.naturalWidth;
        scaleY = drawHeight / uploadedImage.naturalHeight;
    } else {
        // Video fills its container usually
        scaleX = canvas.clientWidth / webcam.videoWidth;
        scaleY = canvas.clientHeight / webcam.videoHeight;
    }

    const startX = offsetX + box.startX * scaleX;
    const startY = offsetY + box.startY * scaleY;
    const endX = offsetX + box.endX * scaleX;
    const endY = offsetY + box.endY * scaleY;
    const width = endX - startX;
    const height = endY - startY;

    // Set styles
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.fillStyle = color;
    ctx.font = '16px Outfit, sans-serif';

    // Draw rect
    ctx.beginPath();
    ctx.roundRect(startX, startY, width, height, 8);
    ctx.stroke();

    // Draw text background
    const textInfo = `${label} (${confidence.toFixed(1)}%)`;
    const textWidth = ctx.measureText(textInfo).width;
    ctx.fillRect(startX, startY - 25, textWidth + 10, 25);
    
    // Draw text
    ctx.fillStyle = '#111';
    ctx.fillText(textInfo, startX + 5, startY - 7);
}

function displayResults(detections, canvas) {
    resultsList.innerHTML = '';
    
    if (!detections || detections.length === 0) {
        resultsList.innerHTML = '<div class="empty-state">No faces detected in the image.</div>';
        return;
    }

    detections.forEach((det, index) => {
        const isMask = det.prediction.label === 'Mask';
        const colorClass = isMask ? 'mask' : 'no-mask';
        const strokeColor = isMask ? '#52b788' : '#e85d04';

        // Draw on canvas
        drawBox(canvas, det.box, det.prediction.label, det.prediction.confidence, strokeColor);

        // Add HTML card
        const card = document.createElement('div');
        card.className = `result-card ${colorClass}`;
        card.innerHTML = `
            <div>
                <div class="result-label">Face ${index + 1}: ${det.prediction.label}</div>
                <div class="result-conf">Confidence: ${det.prediction.confidence.toFixed(2)}%</div>
            </div>
            <div style="font-size: 1.5rem">
                ${isMask ? '✅' : '❌'}
            </div>
        `;
        resultsList.appendChild(card);
    });
}

function clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
