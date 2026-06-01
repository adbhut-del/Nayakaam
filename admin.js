/* ============================================================
   NAYAKAAM PRODUCTIONS — Admin Panel JavaScript
   Handles: Login/Logout, Image upload, form submission,
   Flask API CRUD, Toast notifications, Drag & Drop,
   Existing highlights list
   ============================================================ */

(function () {
    'use strict';

    // ===== CONSTANTS =====
    var API_BASE = '/api/highlights';
    var SESSION_KEY = 'nayakaam_admin_session';
    var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Default credentials (you can change these)
    var ADMIN_USERNAME = 'admin';
    var ADMIN_PASSWORD = 'admin123';

    // ===== LOGIN DOM ELEMENTS =====
    var loginOverlay = document.getElementById('login-overlay');
    var loginForm = document.getElementById('login-form');
    var loginUsername = document.getElementById('login-username');
    var loginPassword = document.getElementById('login-password');
    var loginError = document.getElementById('login-error');
    var passwordToggle = document.getElementById('password-toggle');
    var adminHeader = document.getElementById('admin-header');
    var adminMain = document.getElementById('admin-main');
    var logoutBtn = document.getElementById('admin-logout-btn');

    // ===== ADMIN DOM ELEMENTS =====
    var form = document.getElementById('highlight-form');
    var titleInput = document.getElementById('highlight-title');
    var descInput = document.getElementById('highlight-description');
    var videoInput = document.getElementById('highlight-video');
    var imageInput = document.getElementById('highlight-image');
    var fileUploadArea = document.getElementById('file-upload-area');
    var fileUploadContent = document.getElementById('file-upload-content');
    var filePreview = document.getElementById('file-preview');
    var existingContainer = document.getElementById('existing-highlights');
    var emptyAdminState = document.getElementById('empty-admin-state');
    var submitBtn = document.getElementById('submit-highlight-btn');

    // ===== STATE =====
    var selectedFile = null;

    // ===== LOGIN / SESSION MANAGEMENT =====
    function isLoggedIn() {
        return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
    }

    function doLogin(username, password) {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            sessionStorage.setItem(SESSION_KEY, 'authenticated');
            return true;
        }
        return false;
    }

    function doLogout() {
        sessionStorage.removeItem(SESSION_KEY);
        showLoginScreen();
    }

    function showLoginScreen() {
        loginOverlay.classList.remove('hidden');
        adminHeader.style.display = 'none';
        adminMain.style.display = 'none';
        loginUsername.value = '';
        loginPassword.value = '';
        loginError.style.display = 'none';
        loginUsername.focus();
    }

    function showAdminPanel() {
        loginOverlay.classList.add('hidden');
        adminHeader.style.display = '';
        adminMain.style.display = '';
    }

    function initLogin() {
        // Login form submit
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var username = loginUsername.value.trim();
            var password = loginPassword.value;

            if (doLogin(username, password)) {
                showAdminPanel();
                initAdminPanel();
            } else {
                loginError.style.display = 'flex';
                // Re-trigger shake animation
                loginError.style.animation = 'none';
                loginError.offsetHeight; // force reflow
                loginError.style.animation = '';
                loginPassword.value = '';
                loginPassword.focus();
            }
        });

        // Password toggle (show/hide)
        passwordToggle.addEventListener('click', function () {
            var eyeOpen = passwordToggle.querySelector('.eye-open');
            var eyeClosed = passwordToggle.querySelector('.eye-closed');

            if (loginPassword.type === 'password') {
                loginPassword.type = 'text';
                eyeOpen.style.display = 'none';
                eyeClosed.style.display = 'block';
            } else {
                loginPassword.type = 'password';
                eyeOpen.style.display = 'block';
                eyeClosed.style.display = 'none';
            }
        });

        // Logout button
        logoutBtn.addEventListener('click', function () {
            doLogout();
        });

        // Hide error on input
        loginUsername.addEventListener('input', function () {
            loginError.style.display = 'none';
        });
        loginPassword.addEventListener('input', function () {
            loginError.style.display = 'none';
        });
    }

    // ===== TOAST NOTIFICATION =====
    function showToast(message, type) {
        type = type || 'success';

        // Remove existing toast
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.innerHTML = (type === 'success' ? '✓' : '✗') + '&nbsp;&nbsp;' + message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(function () {
            toast.classList.add('show');
        }, 10);

        // Auto-hide
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                if (toast.parentNode) toast.remove();
            }, 400);
        }, 3000);
    }

    // ===== FILE HANDLING =====
    function handleFile(file) {
        if (!file) return;

        // Validate type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file (JPG, PNG, WebP)', 'error');
            return;
        }

        // Validate size
        if (file.size > MAX_FILE_SIZE) {
            showToast('Image must be under 10MB', 'error');
            return;
        }

        selectedFile = file;
        var reader = new FileReader();
        reader.onload = function (e) {
            filePreview.src = e.target.result;
            filePreview.style.display = 'block';
            fileUploadContent.style.display = 'none';
            fileUploadArea.classList.add('has-preview');
        };
        reader.readAsDataURL(file);
    }

    function resetFileUpload() {
        selectedFile = null;
        filePreview.src = '';
        filePreview.style.display = 'none';
        fileUploadContent.style.display = 'block';
        fileUploadArea.classList.remove('has-preview');
        imageInput.value = '';
    }

    // ===== FILE UPLOAD AREA EVENTS =====
    function initFileUpload() {
        // Click to browse
        fileUploadArea.addEventListener('click', function () {
            imageInput.click();
        });

        // File input change
        imageInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                handleFile(this.files[0]);
            }
        });

        // Drag & Drop
        fileUploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.remove('dragover');

            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
    }

    // ===== FORM SUBMISSION (via Flask API) =====
    function initForm() {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var title = titleInput.value.trim();
            var description = descInput.value.trim();
            var videoUrl = videoInput.value.trim();

            // Validate
            if (!title) {
                showToast('Please enter a project title', 'error');
                titleInput.focus();
                return;
            }

            if (!description) {
                showToast('Please enter a description', 'error');
                descInput.focus();
                return;
            }

            if (!selectedFile && !videoUrl) {
                showToast('Please upload a project image or provide a Video URL', 'error');
                return;
            }

            // Validate Video URL if provided
            if (videoUrl && !isValidVideoUrl(videoUrl)) {
                showToast('Please enter a valid YouTube or Instagram Reel URL', 'error');
                videoInput.focus();
                return;
            }

            // Build FormData and send to API
            var formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('videoUrl', videoUrl);
            if (selectedFile) {
                formData.append('image', selectedFile);
            }

            // Disable button while uploading
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').style.display = 'none';
            submitBtn.querySelector('.btn-loading').style.display = 'inline';

            fetch(API_BASE, {
                method: 'POST',
                body: formData
            })
            .then(function (res) { return res.json(); })
            .then(function (result) {
                if (result.success) {
                    showToast('Highlight added successfully!', 'success');
                    form.reset();
                    resetFileUpload();
                    renderExistingHighlights();
                } else {
                    showToast(result.error || 'Failed to add highlight', 'error');
                }
            })
            .catch(function (err) {
                showToast('Network error. Is the server running?', 'error');
                console.error(err);
            })
            .finally(function () {
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').style.display = 'inline';
                submitBtn.querySelector('.btn-loading').style.display = 'none';
            });
        });

        // Reset button
        form.addEventListener('reset', function () {
            setTimeout(function () {
                resetFileUpload();
            }, 10);
        });
    }

    // ===== VIDEO URL VALIDATION =====
    function isValidVideoUrl(url) {
        if (!url) return true; // Optional field
        var patterns = [
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[a-zA-Z0-9_-]{11}/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[a-zA-Z0-9_-]{11}/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/live\/[a-zA-Z0-9_-]{11}/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[a-zA-Z0-9_-]{11}/,
            /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels)\/[a-zA-Z0-9_-]+/
        ];
        for (var i = 0; i < patterns.length; i++) {
            if (patterns[i].test(url)) return true;
        }
        return false;
    }

    // ===== RENDER EXISTING HIGHLIGHTS (from API) =====
    function renderExistingHighlights() {
        fetch(API_BASE)
            .then(function (res) { return res.json(); })
            .then(function (result) {
                var highlights = result.data || [];

                existingContainer.innerHTML = '';

                if (highlights.length === 0) {
                    existingContainer.style.display = 'none';
                    emptyAdminState.style.display = 'block';
                    return;
                }

                existingContainer.style.display = 'flex';
                emptyAdminState.style.display = 'none';

                highlights.forEach(function (item) {
                    var imgSrc = item.imageUrl || '';
                    var el = document.createElement('div');
                    el.className = 'existing-item';
                    el.innerHTML =
                        '<div class="existing-item-image">' +
                            '<img src="' + imgSrc + '" alt="' + escapeHtml(item.title) + '">' +
                        '</div>' +
                        '<div class="existing-item-info">' +
                            '<div class="existing-item-title">' + escapeHtml(item.title) + '</div>' +
                            '<div class="existing-item-desc">' + escapeHtml(item.description) + '</div>' +
                        '</div>' +
                        '<button class="existing-item-delete" data-id="' + item.id + '" title="Delete this highlight">✕</button>';

                    existingContainer.appendChild(el);
                });

                // Bind delete buttons
                existingContainer.querySelectorAll('.existing-item-delete').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var id = this.getAttribute('data-id');
                        if (confirm('Delete this highlight? This cannot be undone.')) {
                            fetch(API_BASE + '/' + id, { method: 'DELETE' })
                                .then(function (res) { return res.json(); })
                                .then(function (result) {
                                    if (result.success) {
                                        showToast('Highlight deleted', 'success');
                                        renderExistingHighlights();
                                    } else {
                                        showToast('Failed to delete', 'error');
                                    }
                                })
                                .catch(function () {
                                    showToast('Network error', 'error');
                                });
                        }
                    });
                });
            })
            .catch(function (err) {
                console.error('Failed to load highlights:', err);
                existingContainer.style.display = 'none';
                emptyAdminState.style.display = 'block';
            });
    }

    // ===== UTILITY: ESCAPE HTML =====
    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ===== INIT ADMIN PANEL (after login) =====
    function initAdminPanel() {
        initFileUpload();
        initForm();
        renderExistingHighlights();
    }

    // ===== MAIN INITIALIZE =====
    function init() {
        initLogin();

        // Check if already logged in this session
        if (isLoggedIn()) {
            showAdminPanel();
            initAdminPanel();
        } else {
            showLoginScreen();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

