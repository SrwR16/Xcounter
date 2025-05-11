#!/usr/bin/env python
import json
import sys

import requests


def test_verification_url(url):
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")

    try:
        response_json = response.json()
        print(f"Response: {json.dumps(response_json, indent=2)}")
    except:
        print(f"Response: {response.text}")

    return response.status_code


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_verification_request.py <verification_url>")
        sys.exit(1)

    url = sys.argv[1]
    test_verification_url(url)
