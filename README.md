# 🎭 AI Face Mask Detector

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.103-009688?style=for-the-badge&logo=fastapi)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.12-orange?style=for-the-badge&logo=tensorflow)
![OpenCV](https://img.shields.io/badge/OpenCV-4.8-red?style=for-the-badge&logo=opencv)
![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render)

**A real-time AI-powered web application that detects whether a person is wearing a face mask or not — using deep learning.**

🌐 **[Live Demo](https://face-mask-detection-7hwe.onrender.com)** &nbsp;|&nbsp; 📂 **[View Code](https://github.com/ItsmeVishwa/face-mask-detection)**

</div>

---

## ✨ Features

- 🔍 **Real-time Detection** — Detects mask/no-mask on uploaded images
- 📹 **Webcam Support** — Live detection using your device camera
- 🔄 **Auto-Scan Mode** — Automatically scans webcam feed every 2.5 seconds
- 📊 **Live Statistics** — Tracks total scans, masked count, and compliance rate
- 📈 **Confidence Bars** — Visual confidence percentage for each detection
- 📂 **Drag & Drop** — Simply drag an image onto the app
- 🕘 **Scan History** — Last 6 scans shown as thumbnails
- 💾 **Download Result** — Save annotated image with bounding boxes
- 📱 **Fully Responsive** — Works on desktop, tablet, and mobile

---

## 🧠 How It Works

```
Image Input
    │
    ▼
OpenCV DNN Face Detector (SSD ResNet)
    │
    ▼
Extract Face Region(s)
    │
    ▼
MobileNetV2 Mask Classifier
    │
    ▼
Result: Mask ✅ / No Mask ❌ + Confidence %
```

1. **Face Detection** — Uses OpenCV's pre-trained SSD ResNet model to locate faces in the image
2. **Preprocessing** — Each face is resized to 224×224 and normalized
3. **Classification** — MobileNetV2 (fine-tuned via transfer learning) predicts mask/no-mask
4. **Result** — Bounding boxes drawn with label and confidence score

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **ML Model** | MobileNetV2 (Transfer Learning via TensorFlow/Keras) |
| **Face Detector** | OpenCV DNN — SSD ResNet |
| **Backend API** | FastAPI + Uvicorn |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Deployment** | Render.com |
| **Version Control** | Git + GitHub |

---

## 🚀 Run Locally

### Prerequisites
- Python 3.10+
- pip

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/ItsmeVishwa/face-mask-detection.git
cd face-mask-detection

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the server
uvicorn app:app --host 127.0.0.1 --port 8000

# 4. Open in browser
# Go to: http://localhost:8000
```

---

## 📁 Project Structure

```
face-mask-detection/
│
├── app.py                  # FastAPI backend (API endpoints)
├── train.py                # Model training script (MobileNetV2)
├── detect.py               # Standalone webcam detection script
├── get_real_dataset.py     # Dataset downloader
├── download_assets.py      # Download face detector assets
│
├── mask_detector.h5        # Trained Keras model
├── requirements.txt        # Python dependencies
├── render.yaml             # Render deployment config
│
├── face_detector/
│   ├── deploy.prototxt                         # Face detector config
│   └── res10_300x300_ssd_iter_140000.caffemodel # Face detector weights
│
└── static/
    ├── index.html          # Frontend UI
    ├── style.css           # Styling (dark theme, glassmorphism)
    └── script.js           # Frontend logic (drag-drop, webcam, stats)
```

---

## 🎯 Model Performance

- **Architecture**: MobileNetV2 (pre-trained on ImageNet) + custom classifier head
- **Training**: Transfer learning with fine-tuning on face mask dataset
- **Output**: Binary classification — `Mask` / `No Mask`

---

## 📸 Usage

1. **Upload Image** — Click or drag & drop an image
2. **Click "Scan Image"** — AI analyzes the image
3. **View Results** — See bounding boxes, labels, and confidence scores
4. **Use Webcam** — Enable camera for live detection
5. **Enable Auto-Scan** — Continuous scanning every 2.5 seconds

---

## 👨‍💻 Developer

**ItsmeVishwa**

[![GitHub](https://img.shields.io/badge/GitHub-ItsmeVishwa-181717?style=flat&logo=github)](https://github.com/ItsmeVishwa)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  Made with ❤️ using Python, TensorFlow & FastAPI
</div>
