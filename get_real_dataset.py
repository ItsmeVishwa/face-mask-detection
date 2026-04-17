import urllib.request
import zipfile
import os
import shutil

url = "https://github.com/chandrikadeb7/Face-Mask-Detection/archive/refs/heads/master.zip"
zip_path = "real_dataset.zip"

print(f"Downloading real dataset from {url}...")
urllib.request.urlretrieve(url, zip_path)

print("Extracting dataset...")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("temp_extract")

print("Replacing old dummy dataset...")
if os.path.exists("dataset"):
    shutil.rmtree("dataset")

# The extracted zip will have a folder named 'Face-Mask-Detection-master'
# Which contains a subfolder 'dataset'
source_dataset = os.path.join("temp_extract", "Face-Mask-Detection-master", "dataset")
shutil.move(source_dataset, "dataset")

print("Cleaning up...")
shutil.rmtree("temp_extract")
os.remove(zip_path)

print("Real dataset successfully downloaded and extracted into 'dataset/' folder!")
