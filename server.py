"""
NAYAKAAM PRODUCTIONS — Flask Backend Server
Handles: API routes for highlights CRUD, image uploads, 
serves static frontend files.
Deploy-ready with SQLite database.
"""

import os
import uuid
import sqlite3
import json
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from urllib.parse import unquote
from flask import Flask, request, jsonify, send_from_directory

# ===== CONFIG =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IS_VERCEL = os.environ.get('VERCEL') == '1' or bool(os.environ.get('VERCEL_ENV'))

if IS_VERCEL:
    UPLOAD_FOLDER = '/tmp/uploads'
    DATABASE = '/tmp/nayakaam_productions.db'
else:
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    DATABASE = os.path.join(BASE_DIR, 'nayakaam_productions.db')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

# ===== EMAIL CONFIG (set in Vercel → Settings → Environment Variables) =====
MAIL_ENABLED = os.environ.get('MAIL_ENABLED', 'true').lower() == 'true'
GMAIL_USER = os.environ.get('GMAIL_USER', 'info.nayakaamproductions@gmail.com')
GMAIL_PASSWORD = os.environ.get('GMAIL_PASSWORD', '')
RECEIVER_EMAIL = os.environ.get('RECEIVER_EMAIL', GMAIL_USER)

# Create uploads folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ===== FLASK APP =====
app = Flask(__name__, static_folder='.', static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


# ===== DATABASE =====
def get_db():
    """Get a database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the database with the highlights table."""
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS highlights (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            video_url TEXT DEFAULT '',
            image_filename TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            mobile TEXT DEFAULT '',
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    print("[DB] Database initialized successfully.")


def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_youtube_id(url):
    """Extract YouTube video ID from URL."""
    if not url:
        return None
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
        r'(?:shorts\/)([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


# ===== API ROUTES =====

@app.route('/api/highlights', methods=['GET'])
def get_highlights():
    """Get all highlights, newest first."""
    try:
        conn = get_db()
        rows = conn.execute(
            'SELECT * FROM highlights ORDER BY created_at DESC'
        ).fetchall()
        conn.close()

        highlights = []
        for row in rows:
            img_filename = row['image_filename']
            # If it's a full URL (YouTube thumb), use as is; otherwise prefix /uploads/
            image_url = img_filename if img_filename.startswith('http') else f'/uploads/{img_filename}'
            
            highlights.append({
                'id': row['id'],
                'title': row['title'],
                'description': row['description'],
                'videoUrl': row['video_url'],
                'imageUrl': image_url,
                'createdAt': row['created_at']
            })

        return jsonify({'success': True, 'data': highlights})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/highlights', methods=['POST'])
def add_highlight():
    """Add a new highlight with image upload."""
    try:
        # Check for required fields
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        video_url = request.form.get('videoUrl', '').strip()

        if not title:
            return jsonify({'success': False, 'error': 'Title is required'}), 400
        if not description:
            return jsonify({'success': False, 'error': 'Description is required'}), 400

        # Handle image upload
        unique_filename = ""
        if 'image' in request.files and request.files['image'].filename != '':
            file = request.files['image']
            if not allowed_file(file.filename):
                return jsonify({'success': False, 'error': 'Invalid image format. Use JPG, PNG, or WebP'}), 400
            
            # Generate unique filename
            ext = file.filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(filepath)
        elif video_url:
            # Fallback to YouTube thumbnail or Instagram placeholder
            yt_id = get_youtube_id(video_url)
            if yt_id:
                unique_filename = f"https://img.youtube.com/vi/{yt_id}/maxresdefault.jpg"
            elif 'instagram.com' in video_url:
                # Instagram doesn't provide an easy thumbnail URL, use a placeholder or require upload
                unique_filename = "https://www.instagram.com/static/images/ico/favicon-200.png/ab6cd409353a.png"
            else:
                return jsonify({'success': False, 'error': 'Image is required or provide a valid YouTube/Instagram URL'}), 400
        else:
            return jsonify({'success': False, 'error': 'Image is required'}), 400

        # Save to database
        highlight_id = uuid.uuid4().hex[:12]
        created_at = datetime.utcnow().isoformat() + 'Z'

        conn = get_db()
        conn.execute(
            'INSERT INTO highlights (id, title, description, video_url, image_filename, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            (highlight_id, title, description, video_url, unique_filename, created_at)
        )
        conn.commit()
        conn.close()

        return jsonify({
            'success': True,
            'data': {
                'id': highlight_id,
                'title': title,
                'description': description,
                'videoUrl': video_url,
                'imageUrl': unique_filename if unique_filename.startswith('http') else f'/uploads/{unique_filename}',
                'createdAt': created_at
            }
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/highlights/<highlight_id>', methods=['DELETE'])
def delete_highlight(highlight_id):
    """Delete a highlight and its image file."""
    try:
        conn = get_db()
        # Get the image filename before deleting
        row = conn.execute(
            'SELECT image_filename FROM highlights WHERE id = ?', (highlight_id,)
        ).fetchone()

        if not row:
            conn.close()
            return jsonify({'success': False, 'error': 'Highlight not found'}), 404

        # Delete the image file
        image_path = os.path.join(UPLOAD_FOLDER, row['image_filename'])
        if os.path.exists(image_path):
            os.remove(image_path)

        # Delete from database
        conn.execute('DELETE FROM highlights WHERE id = ?', (highlight_id,))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Highlight deleted'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def send_email_notification(name, email, mobile, message):
    """Send an email notification using Gmail SMTP."""
    if not MAIL_ENABLED or not GMAIL_PASSWORD:
        return False
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = RECEIVER_EMAIL
        msg['Subject'] = f"New Inquiry: {name} via Nayakaam Website"

        body = f"""
        New message received from your website contact form:

        Name: {name}
        Email: {email}
        Mobile: {mobile}
        Message:
        {message}

        ---
        This is an automated notification from Nayakaam Productions.
        """
        msg.attach(MIMEText(body, 'plain'))

        # Connect and send
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@app.route('/api/contact', methods=['POST'])
def submit_contact():
    """Handle contact form submissions."""
    try:
        # We can handle both JSON and Form Data
        data = request.json if request.is_json else request.form

        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        mobile = data.get('mobile', '').strip()
        message = data.get('message', '').strip()

        if not name or not email or not message:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400

        msg_id = uuid.uuid4().hex[:12]
        created_at = datetime.utcnow().isoformat() + 'Z'

        conn = get_db()
        conn.execute(
            'INSERT INTO messages (id, name, email, mobile, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            (msg_id, name, email, mobile, message, created_at)
        )
        conn.commit()
        conn.close()

        print(f"[CONTACT] New message from {name} ({email})")

        # Try to send email notification
        email_sent = send_email_notification(name, email, mobile, message)

        return jsonify({
            'success': True, 
            'message': 'Message sent successfully!',
            'email_notified': email_sent
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== SERVE UPLOADED IMAGES =====
@app.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded images."""
    return send_from_directory(UPLOAD_FOLDER, filename)


# ===== SERVE FRONTEND =====
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


@app.route('/admin.html')
def serve_admin():
    return send_from_directory('.', 'admin.html')


@app.route('/<path:filepath>')
def serve_static(filepath):
    """Serve images, CSS, JS, and other static assets (needed on Vercel)."""
    if filepath.startswith('api/'):
        return jsonify({'success': False, 'error': 'Not found'}), 404

    safe_path = os.path.normpath(unquote(filepath))
    if safe_path.startswith('..'):
        return jsonify({'success': False, 'error': 'Not found'}), 404
    if os.path.isabs(safe_path):
        return jsonify({'success': False, 'error': 'Not found'}), 404

    full_path = os.path.join(BASE_DIR, safe_path)
    if os.path.isfile(full_path):
        return send_from_directory(BASE_DIR, safe_path)
    return jsonify({'success': False, 'error': 'Not found'}), 404


# Initialize DB for local + Vercel serverless
init_db()

# ===== RUN =====
if __name__ == '__main__':
    print("=" * 50)
    print("  NAYAKAAM PRODUCTIONS Server is Running!")
    print("  Homepage:    http://localhost:5000")
    print("  Admin Panel: http://localhost:5000/admin.html")
    print("=" * 50)
    app.run(debug=True, port=5000)
