import os
import urllib.request
import zipfile
import shutil

print("Downloading Face Detector assets...")
detector_dir = "face_detector"
if not os.path.exists(detector_dir):
    os.makedirs(detector_dir)

prototxt_url = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
caffemodel_url = "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"

urllib.request.urlretrieve(prototxt_url, os.path.join(detector_dir, "deploy.prototxt"))
urllib.request.urlretrieve(caffemodel_url, os.path.join(detector_dir, "res10_300x300_ssd_iter_140000.caffemodel"))

print("Downloading sample dataset...")
dataset_dir = "dataset"
if not os.path.exists(dataset_dir):
    os.makedirs(dataset_dir)

with_mask_dir = os.path.join(dataset_dir, "with_mask")
without_mask_dir = os.path.join(dataset_dir, "without_mask")

if not os.path.exists(with_mask_dir):
    os.makedirs(with_mask_dir)
if not os.path.exists(without_mask_dir):
    os.makedirs(without_mask_dir)

# Create 2 dummy images to make the training script runnable (creates a 10x10 colored square)
# NOTE: This is SOLELY for script validation. A real dataset is needed for actual masking detection.
from PIL import Image

img_mask = Image.new('RGB', (224, 224), color = (0, 255, 0))
img_nomask = Image.new('RGB', (224, 224), color = (255, 0, 0))

# Save multiple copies to satisfy minimum batch size requirements during training
for i in range(20):
    img_mask.save(os.path.join(with_mask_dir, f"mask_{i}.jpg"))
    img_nomask.save(os.path.join(without_mask_dir, f"nomask_{i}.jpg"))

print("Assets Setup Complete!")
print("NOTE: The dataset generated is a DUMMY dataset just to verify the training script works.")
print("Please replace the contents of 'dataset/with_mask' and 'dataset/without_mask' with real images for actual results.")
