import requests
import json

# Test the dual response system
url = "http://localhost:8002/api/test-dual-response"

# Test 1: Simple greeting
response1 = requests.post(url, json={"prompt": "Hello"})
print("=== Test 1: Greeting ===")
print(json.dumps(response1.json(), indent=2))

print("\n" + "="*50 + "\n")

# Test 2: Code request
response2 = requests.post(url, json={"prompt": "Write a calculator in tkinter"})
print("=== Test 2: Code Request ===")
result = response2.json()
print("SPOKEN:", result["spoken_response"])
print("TEXT LENGTH:", len(result["text_response"]), "characters")
print("TEXT (first 200 chars):", result["text_response"][:200] + "...")

print("\n" + "="*50 + "\n")

# Test 3: Complex explanation
response3 = requests.post(url, json={"prompt": "Explain how neural networks work"})
print("=== Test 3: Complex Explanation ===")
result = response3.json()
print("SPOKEN:", result["spoken_response"])
print("TEXT LENGTH:", len(result["text_response"]), "characters")