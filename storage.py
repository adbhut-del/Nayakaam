"""
Image storage: local uploads folder, or Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
"""
import json
import os
import urllib.error
import urllib.request

BLOB_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN", "").strip()
BLOB_API = "https://blob.vercel-storage.com"


def blob_enabled():
    return bool(BLOB_TOKEN)


def upload_to_blob(file_bytes, pathname, content_type):
    """
    Upload bytes to Vercel Blob. Returns public HTTPS URL or None on failure.
    """
    if not BLOB_TOKEN:
        return None

    url = f"{BLOB_API}/{pathname.lstrip('/')}"
    req = urllib.request.Request(
        url,
        data=file_bytes,
        method="PUT",
        headers={
            "Authorization": f"Bearer {BLOB_TOKEN}",
            "Content-Type": content_type,
            "x-api-version": "7",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return body.get("url")
    except (urllib.error.URLError, json.JSONDecodeError, KeyError) as err:
        print(f"[Blob] Upload failed: {err}")
        return None
