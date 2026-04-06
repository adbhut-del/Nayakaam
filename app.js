/* ============================================================
   NAYAKAAM PRODUCTIONS — Main Application JavaScript
   Handles: Highlights rendering, Video Modal, Particles,
   Header scroll, Mobile menu, Scroll reveals
   ============================================================ */

(function () {
    'use strict';

    // ===== CONSTANTS =====
    var API_BASE = '/api/highlights';

    // ===== DOM ELEMENTS =====
    const header = document.getElementById('main-header');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const highlightsGrid = document.getElementById('highlights-grid');
    const emptyState = document.getElementById('empty-state');
    const videoModal = document.getElementById('video-modal');
    const videoModalOverlay = document.getElementById('video-modal-overlay');
    const videoModalClose = document.getElementById('video-modal-close');
    const videoIframe = document.getElementById('video-iframe');
    const heroParticles = document.getElementById('hero-particles');

    // ===== HEADER SCROLL EFFECT =====
    function initHeaderScroll() {
        let ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    if (window.scrollY > 50) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ===== MOBILE MENU =====
    function initMobileMenu() {
        mobileMenuBtn.addEventListener('click', function () {
            mobileMenuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close on link click
        document.querySelectorAll('.mobile-nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                mobileMenuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ===== HERO PARTICLES =====
    function initParticles() {
        if (!heroParticles) return;

        var colors = [
            'rgba(212, 175, 55, 0.25)',  /* Gold */
            'rgba(201, 163, 78, 0.2)',   /* Deep Gold */
            'rgba(166, 124, 46, 0.15)',  /* Dark Gold */
            'rgba(255, 255, 255, 0.1)'   /* White Sparkle */
        ];

        for (var i = 0; i < 30; i++) {
            var particle = document.createElement('div');
            particle.className = 'particle';
            var size = Math.random() * 4 + 1;
            var color = colors[Math.floor(Math.random() * colors.length)];
            var left = Math.random() * 100;
            var delay = Math.random() * 15;
            var duration = Math.random() * 10 + 10;

            particle.style.cssText =
                'width:' + size + 'px;' +
                'height:' + size + 'px;' +
                'background:' + color + ';' +
                'left:' + left + '%;' +
                'bottom:-10px;' +
                'animation-delay:' + delay + 's;' +
                'animation-duration:' + duration + 's;';

            if (size > 3) {
                particle.style.boxShadow = '0 0 ' + (size * 3) + 'px ' + color;
            }

            heroParticles.appendChild(particle);
        }
    }

    // ===== YOUTUBE URL PARSING =====
    function extractYouTubeId(url) {
        if (!url) return null;
        var patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
        ];
        for (var i = 0; i < patterns.length; i++) {
            var match = url.match(patterns[i]);
            if (match) return match[1];
        }
        return null;
    }

    function getYouTubeEmbedUrl(url) {
        var id = extractYouTubeId(url);
        if (id) {
            return 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
        }
        return null;
    }

    // ===== VIDEO MODAL =====
    function openVideoModal(videoUrl) {
        var embedUrl = getYouTubeEmbedUrl(videoUrl);
        if (!embedUrl) return;

        videoIframe.src = embedUrl;
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeVideoModal() {
        videoModal.classList.remove('active');
        document.body.style.overflow = '';
        // Stop video playback
        setTimeout(function () {
            videoIframe.src = '';
        }, 400);
    }

    function initVideoModal() {
        videoModalOverlay.addEventListener('click', closeVideoModal);
        videoModalClose.addEventListener('click', closeVideoModal);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && videoModal.classList.contains('active')) {
                closeVideoModal();
            }
        });
    }

    // ===== HIGHLIGHTS RENDERING =====

    function createHighlightCard(item, index) {
        var card = document.createElement('div');
        var isFeatured = index === 0;
        card.className = 'highlight-card reveal' + (isFeatured ? ' featured' : '');

        var hasVideo = item.videoUrl && extractYouTubeId(item.videoUrl);
        var itemNumber = (index + 1) < 10 ? '0' + (index + 1) : (index + 1);

        var playIconHtml = '';
        if (hasVideo) {
            playIconHtml =
                '<div class="highlight-play-icon">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 20,12 8,19"/></svg>' +
                '</div>';
        }

        var imgSrc = item.imageUrl || item.imageData || '';

        card.innerHTML =
            '<div class="highlight-card-inner">' +
            '<div class="card-num-bg">' + itemNumber + '</div>' +
            '<div class="highlight-card-image">' +
            '<img src="' + imgSrc + '" alt="' + (item.title || 'Project') + '" loading="lazy">' +
            '<div class="card-image-overlay"></div>' +
            playIconHtml +
            '</div>' +
            '<div class="highlight-card-content">' +
            '<div class="card-category-badge">Featured Production</div>' +
            '<h3 class="highlight-card-title">' + escapeHtml(item.title) + '</h3>' +
            '<div class="card-details-reveal">' +
            '<p class="highlight-card-desc">' + escapeHtml(item.description) + '</p>' +
            (hasVideo ?
                '<div class="highlight-watch-btn">' +
                '<span class="watch-icon"></span>' +
                'Explore Case Study' +
                '</div>' : '') +
            '</div>' +
            '</div>' +
            '</div>';

        // --- MAGNETIC TILT LOGIC (Only for Desktop/Hover devices) ---
        if (window.matchMedia('(hover: hover) and (min-width: 1025px)').matches) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;

                var centerX = rect.width / 2;
                var centerY = rect.height / 2;

                var rotateX = (y - centerY) / 12;
                var rotateY = (centerX - x) / 12;

                card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02)';
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        }

        if (hasVideo) {
            card.addEventListener('click', function () {
                openVideoModal(item.videoUrl);
            });
        }

        return card;
    }

    function renderHighlights() {
        fetch(API_BASE)
            .then(function (res) { return res.json(); })
            .then(function (result) {
                var highlights = result.data || [];

                highlightsGrid.innerHTML = '';

                if (highlights.length === 0) {
                    highlightsGrid.style.display = 'none';
                    emptyState.style.display = 'block';
                    return;
                }

                highlightsGrid.style.display = 'grid';
                emptyState.style.display = 'none';

                highlights.forEach(function (item, index) {
                    var card = createHighlightCard(item, index);
                    highlightsGrid.appendChild(card);
                });

                // Trigger reveal animations for new cards
                setTimeout(function () {
                    initScrollReveal();
                }, 100);
            })
            .catch(function (err) {
                console.error('Failed to load highlights:', err);
                highlightsGrid.style.display = 'none';
                emptyState.style.display = 'block';
            });
    }

    // ===== SCROLL REVEAL =====
    function initScrollReveal() {
        var reveals = document.querySelectorAll('.reveal');

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -10% 0px'
        });

        reveals.forEach(function (el) {
            observer.observe(el);
        });
    }

    // ===== SMOOTH SCROLL FOR NAV LINKS =====
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var targetId = this.getAttribute('href');
                if (targetId === '#') return;

                var targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    var headerOffset = 80;
                    var elementPosition = targetEl.getBoundingClientRect().top;
                    var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===== UTILITY: ESCAPE HTML =====
    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ===== CONTACT FORM =====
    function initContactForm() {
        var form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var nameInput = document.getElementById('contact-name');
            var emailInput = document.getElementById('contact-email');
            var messageInput = document.getElementById('contact-message');
            var submitBtn = document.getElementById('contact-submit-btn');
            var btnText = submitBtn.querySelector('.btn-text');
            var btnLoading = submitBtn.querySelector('.btn-loading');
            var msgContainer = document.getElementById('contact-form-message');

            var payload = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                message: messageInput.value.trim()
            };

            if (!payload.name || !payload.email || !payload.message) return;

            // Loading state
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'block';
            msgContainer.textContent = '';
            msgContainer.style.color = 'inherit';

            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.success) {
                        msgContainer.textContent = 'Message sent successfully!';
                        msgContainer.style.color = '#C9A34E'; // soft gold
                        form.reset();
                    } else {
                        msgContainer.textContent = data.error || 'Failed to send message.';
                        msgContainer.style.color = '#FF5252'; // high-end red
                    }
                })
                .catch(function (err) {
                    console.error(err);
                    msgContainer.textContent = 'Network error. Please try again.';
                    msgContainer.style.color = '#FF5252'; // high-end red
                })
                .finally(function () {
                    // Restore button
                    submitBtn.disabled = false;
                    btnText.style.display = 'block';
                    btnLoading.style.display = 'none';
                });
        });
    }

    // ===== BACK TO TOP =====
    function initBackToTop() {
        var backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', function () {
            if (window.scrollY > 500) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ===== PERIODIC REFRESH (sync with admin changes) =====
    setInterval(function () {
        renderHighlights();
    }, 30000); // Refresh every 30 seconds

    // ===== PORTFOLIO FILTERING =====
    function initPortfolioFilter() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const filterItems = document.querySelectorAll('.portfolio-item');
        if (!filterBtns.length) return;

        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                filterItems.forEach(function (item) {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.style.display = 'block';
                        gsap.fromTo(item, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4 });
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // ===== GSAP ANIMATIONS =====
    function initGsapAnimations() {
        if (typeof gsap === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        gsap.from('.hero-content .reveal', {
            y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.5
        });

        gsap.utils.toArray('.section-header.reveal').forEach(header => {
            gsap.from(header, {
                scrollTrigger: { trigger: header, start: 'top 85%' },
                y: 30, opacity: 0, duration: 0.8
            });
        });
    }

    // ===== WHATSAPP =====
    function initWhatsapp() {
        const wa = document.createElement('a');
        wa.href = 'https://wa.me/919258925877';
        wa.className = 'whatsapp-btn';
        wa.target = '_blank';
        wa.innerHTML = '<span>Chat on WhatsApp</span><img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp">';
        document.body.appendChild(wa);
    }

    // ===== INITIALIZE =====
    function init() {
        document.documentElement.classList.add('js-enabled');
        initHeaderScroll();
        initMobileMenu();
        initParticles();
        initVideoModal();
        initSmoothScroll();
        renderHighlights();
        initContactForm();
        initBackToTop();
        initPortfolioFilter();
        initGsapAnimations();
        // initWhatsapp();

        document.querySelectorAll('.service-card, .about-stat-card').forEach(function (el) {
            el.classList.add('reveal');
        });

        initScrollReveal();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
