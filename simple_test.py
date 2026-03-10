import requests
import json

# Simple test of the dual response system
try:
    response = requests.post(
        "http://localhost:8003/api/test-dual-response",
        json={"prompt": "Write a calculator in Python"},
        timeout=30
    )
    
    if response.status_code == 200:
        result = response.json()
        print("SUCCESS!")
        print(f"SPOKEN: {result['spoken_response']}")
        print(f"TEXT LENGTH: {len(result['text_response'])} characters")
        print(f"PROMPT: {result['prompt']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Exception: {e}")