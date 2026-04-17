# 🎭 Face Mask Detection Project: Demo Class Guide

This document is your ultimate cheat sheet for presenting your project in a demo class. Follow these steps to ensure a flawless presentation.

---

## 1. How to Start the Demo (The "Wow" Factor)

Don't start by showing code right away! Start by showing the **working product** to grab their attention.

**Step 1:** Open VS Code and open a New Terminal.
**Step 2:** Ensure you are in the project folder by typing:
`cd c:\Users\Vishw\.antigravity\extensions\face_mask_project`
**Step 3:** Start the web server by typing:
`uvicorn app:app`
**Step 4:** Open your web browser (Chrome/Edge) and navigate to `http://localhost:8000`.
**Step 5:** Click "Start Webcam", step back, and physically show the class how the glowing box turns Green when you put on a mask, and Red when you take it off. 

*Once they are amazed by the live demo, switch back to VS Code to explain "How it works".*

---

## 2. Technical Stack Explained (What to say)

If the instructor asks, "What language and libraries did you use?", here is exactly what you say:

### Language Used
- **Python (Backend & Machine Learning)**
- **JavaScript / HTML / CSS (Frontend User Interface)**

### Core Libraries Used
Show them the `requirements.txt` file and explain these three main pillars:
1. **TensorFlow & Keras:** "I used TensorFlow to build and train the Deep Learning neural network. Specifically, I used a pre-trained architecture called MobileNetV2 which is highly optimized for real-time vision."
2. **OpenCV (cv2):** "I used OpenCV for computer vision tasks. It maps the image, identifies exactly where human faces are using a Caffe model, and extracts that face out of the background."
3. **FastAPI & Uvicorn:** "Instead of keeping it locked in a terminal, I used FastAPI to create a local web server. This allows the AI model to communicate with a beautiful internet browser front-end."

### What about the Database?
If they ask about the database:
> *"This project focuses entirely on Real-Time Machine Learning inference, so it actively processes video frames from RAM in real-time. It **does not require a traditional SQL database** because it is not saving user data or login credentials. However, the 'Database' of our machine learning knowledge is stored in the `mask_detector.h5` file, which is a serialized weight-matrix holding the patterns learned from observing over 4,000 images!"*

---

## 3. Explaining the Code from Scratch

Open these files in VS Code and walk them through in this exact order:

### File 1: `dataset/` (Data Collection)
- **Show them the images:** Open the `dataset/with_mask` folder. 
- **What to say:** *"Every AI needs data. I started by collecting a dataset of thousands of images of people with masks, and thousands without. This is what the AI learned from."*

### File 2: `train.py` (The Brains)
- **Show them lines 55-65 (The Model Construction):** 
- **What to say:** *"This script loops through all my dataset images. It does 'Data Augmentation'—meaning it slightly rotates and flips the images so the AI gets smarter. Then, it uses Transfer Learning on a MobileNetV2 network to classify the faces. It saves the resulting 'brain' into a file called `mask_detector.h5`."*
- **Show them `plot.png`:** Show the graph proving that your model reached over 98% accuracy!

### File 3: `app.py` (The Bridge)
- **Show them the `@app.post("/predict")` section.**
- **What to say:** *"This is my FastAPI backend. When the web browser takes a picture of me, it sends it here. My code uses OpenCV to find my face bounds (startX, startY), crops my face, and feeds it to the Keras Mask Detector. It then replies back to the browser with 'Mask' or 'No Mask'.'*

### File 4: `static/index.html` & `static/style.css` (The Looks)
- **What to say:** *"Finally, I designed a modern Glassmorphism frontend using vanilla HTML and CSS variables. I chose not to use basic templates so I could deliver a truly premium, 'cyberpunk' glowing aesthetic."*
