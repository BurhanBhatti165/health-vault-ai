import os
import base64
import json
import requests


API_URL = "https://openrouter.ai/api/v1/chat/completions"
API_KEY = "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"


image_path = os.path.join(os.getcwd(), "prescription.png")
try:
  with open(image_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("ascii")
    image_data_url = f"data:image/png;base64,{b64}"
except FileNotFoundError:
  print("prescription.png not found in current directory.")
  raise SystemExit(1)

payload = {
  "model": "google/gemma-3-27b-it:free",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "Extract the text from this image"},
        {"type": "image_url", "image_url": {"url": image_data_url}},
      ],
    }
  ],
  "stream": False,
}

headers = {
  "Authorization": f"Bearer {API_KEY}",
  "Content-Type": "application/json",
}

resp = requests.post(API_URL, headers=headers, data=json.dumps(payload), timeout=60)

try:
  resp.raise_for_status()
except requests.HTTPError:
  print("HTTP error:", resp.status_code, resp.text[:1000])
  raise SystemExit(1)

data = resp.json()


content = None
try:
  content = data["choices"][0]["message"]["content"]
except Exception:
  content = json.dumps(data, indent=2)

print(content)