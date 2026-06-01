"""Vercel serverless entry — exposes the Flask app."""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server import app  # noqa: E402
