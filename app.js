/* ============================================================
   NAYAKAAM PRODUCTIONS — Main Application JavaScript
   Handles: Highlights rendering, Video Modal, Particles,
   Header scroll, Mobile menu, Scroll reveals
   ============================================================ */

(function () {
    'use strict';

    // ===== CONSTANTS =====
    var API_BASE = '/api/highlights';

    /** Encode each path segment so spaces/special chars work on Vercel (Linux). */
    function assetUrl(path) {
        if (!path || /^https?:\/\//i.test(path) || path.indexOf('//') === 0) {
            return path;
        }
        if (path.charAt(0) === '/') {
            return path.split('/').map(function (part, i) {
                return i === 0 ? part : encodeURIComponent(part);
            }).join('/');
        }
        return path.split('/').map(encodeURIComponent).join('/');
    }

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

    // ===== PRELOADER =====
    // ===== HERO BACKGROUND VIDEO (YouTube embed — mobile cover + autoplay) =====
    function initHeroVideo() {
        var hero = document.getElementById('hero');
        var iframe = document.getElementById('hero-bg-video');
        if (!hero || !iframe) return;

        function markReady() {
            hero.classList.add('hero-video-ready');
        }

        iframe.addEventListener('load', markReady);
        setTimeout(markReady, 800);

        if (window.matchMedia('(max-width: 768px)').matches) {
            markReady();
        }

        function syncHeroLayout() {
            hero.classList.toggle('hero--mobile', window.matchMedia('(max-width: 768px)').matches);
        }

        syncHeroLayout();
        window.addEventListener('resize', syncHeroLayout, { passive: true });
        window.addEventListener('orientationchange', syncHeroLayout, { passive: true });
    }

    function initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        // Prevent scrolling while preloader is active
        document.body.style.overflow = 'hidden';

        window.addEventListener('load', () => {
            // Minimum display time of 1.5 seconds for the cinematic feel
            setTimeout(() => {
                const tl = gsap.timeline({
                    onComplete: () => {
                        preloader.style.display = 'none';
                        document.body.style.overflow = '';
                        if (typeof ScrollTrigger !== 'undefined') {
                            ScrollTrigger.refresh();
                        }
                    }
                });

                // Cinematic exit sequence
                tl.to('.preloader-circle', {
                    scale: 1.2,
                    opacity: 0,
                    duration: 1,
                    ease: "power3.in"
                })
                .to(preloader, {
                    opacity: 0,
                    duration: 0.8,
                    ease: "power2.out"
                }, "-=0.6");
            }, 1500);
        });
    }

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
            'rgba(255, 0, 0, 0.25)',  /* Gold */
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

    // ===== VIDEO URL PARSING =====
    function extractYouTubeId(url) {
        if (!url) return null;
        var patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
        ];
        for (var i = 0; i < patterns.length; i++) {
            var match = url.match(patterns[i]);
            if (match) return match[1];
        }
        return null;
    }

    function extractInstagramId(url) {
        if (!url) return null;
        var match = url.match(/instagram\.com\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    function getEmbedUrl(url) {
        var ytId = extractYouTubeId(url);
        if (ytId) {
            return 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0';
        }
        var igId = extractInstagramId(url);
        if (igId) {
            return 'https://www.instagram.com/reel/' + igId + '/embed';
        }
        return null;
    }

    // ===== VIDEO MODAL =====
    function openVideoModal(videoUrl) {
        var embedUrl = getEmbedUrl(videoUrl);
        if (!embedUrl) return;

        // Check if it's Instagram for vertical layout
        videoModal.classList.remove('is-vertical');
        if (extractInstagramId(videoUrl)) {
            videoModal.classList.add('is-vertical');
        }

        videoIframe.src = embedUrl;
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Hide header to prevent any overlap
        var header = document.querySelector('.header');
        if(header) header.style.opacity = '0';
    }

    function closeVideoModal() {
        videoModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Show header back
        var header = document.querySelector('.header');
        if(header) header.style.opacity = '1';

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

        var isEmbeddable = item.videoUrl && (extractYouTubeId(item.videoUrl) || extractInstagramId(item.videoUrl));
        var hasVideo = !!item.videoUrl;
        var itemNumber = (index + 1) < 10 ? '0' + (index + 1) : (index + 1);

        var playIconHtml = '';
        if (hasVideo) {
            playIconHtml =
                '<div class="highlight-play-icon">' +
                '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8,5 20,12 8,19"/></svg>' +
                '</div>';
        }

        var imgSrc = item.imageUrl || item.imageData || '';
        if (imgSrc && !/^https?:\/\//i.test(imgSrc)) {
            imgSrc = assetUrl(imgSrc);
        }

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
                if (isEmbeddable) {
                    openVideoModal(item.videoUrl);
                } else {
                    window.open(item.videoUrl, '_blank');
                }
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
            var mobileInput = document.getElementById('contact-mobile');
            var messageInput = document.getElementById('contact-message');
            var submitBtn = document.getElementById('contact-submit-btn');
            var btnText = submitBtn.querySelector('.btn-text');
            var btnLoading = submitBtn.querySelector('.btn-loading');
            var msgContainer = document.getElementById('contact-form-message');

            var payload = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                mobile: mobileInput.value.trim(),
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
                        // Show Custom Fancy Success Modal
                        const successModal = document.getElementById('success-modal');
                        if (successModal) {
                            successModal.classList.add('active');
                            document.body.style.overflow = 'hidden';

                            // Handle Closing
                            const closeModal = () => {
                                successModal.classList.remove('active');
                                document.body.style.overflow = '';
                            };

                            const closeBtn = document.getElementById('success-modal-close');
                            const overlay = document.getElementById('success-modal-overlay');

                            if (closeBtn) closeBtn.onclick = closeModal;
                            if (overlay) overlay.onclick = closeModal;

                            // Clear secondary message if modal shows
                            msgContainer.textContent = '';

                            // Auto-refresh after 5 seconds
                            setTimeout(function() {
                                window.location.reload();
                            }, 5000);
                        } else {
                            msgContainer.textContent = 'Message sent successfully!';
                            msgContainer.style.color = '#E60000'; // soft gold
                            
                            // Also refresh if no modal for consistency
                            setTimeout(function() {
                                window.location.reload();
                            }, 5000);
                        }
                        
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

    // ===== INTERACTIVE NODE CONNECTIONS =====
    function initInteractiveNodes() {
        const section = document.querySelector('.interactive-node-section');
        const canvas = document.querySelector('.interactive-canvas');
        if (!canvas || !section) return;

        const centralNode = document.getElementById('central-node');
        const satellites = [
            { el: document.getElementById('sat-1'), path: document.getElementById('line-sat-1') },
            { el: document.getElementById('sat-2'), path: document.getElementById('line-sat-2') },
            { el: document.getElementById('sat-3'), path: document.getElementById('line-sat-3') },
            { el: document.getElementById('sat-4'), path: document.getElementById('line-sat-4') }
        ];

        function updateConnections() {
            const canvasRect = canvas.getBoundingClientRect();
            const centralRect = centralNode.getBoundingClientRect();

            const centralX = centralRect.left - canvasRect.left + centralRect.width / 2;
            const centralY = centralRect.top - canvasRect.top + centralRect.height / 2;

            satellites.forEach(sat => {
                if (!sat.el || !sat.path) return;
                const satRect = sat.el.getBoundingClientRect();
                const satX = satRect.left - canvasRect.left + satRect.width / 2;
                const satY = satRect.top - canvasRect.top + satRect.height / 2;

                // Bezier curve logic
                const midX = (centralX + satX) / 2;
                const midY = (centralY + satY) / 2;

                // Control points for dynamic curve
                const cp1X = satX;
                const cp1Y = centralY;

                const pathData = `M ${satX} ${satY} Q ${cp1X} ${cp1Y} ${centralX} ${centralY}`;
                sat.path.setAttribute('d', pathData);
            });
        }

        let isVisible = false;
        const observer = new IntersectionObserver((entries) => {
            isVisible = entries[0].isIntersecting;
            if (isVisible) animLoop();
        }, { threshold: 0.01 });

        observer.observe(section);

        function animLoop() {
            if (!isVisible) return;
            updateConnections();
            requestAnimationFrame(animLoop);
        }
    }

    // ===== SCROLL JOURNEY LINE =====
    function initScrollJourneyLine() {
        const path = document.getElementById('scroll-journey-path');
        const section = document.querySelector('.interactive-node-section');
        if (!path || !section) return;

        // Ensure we have a valid length
        const pathLength = path.getTotalLength();
        
        // Initialize path
        gsap.set(path, {
            strokeDasharray: pathLength,
            strokeDashoffset: pathLength,
            opacity: 1
        });

        gsap.to(path, {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top 70%',
                end: 'bottom 90%',
                scrub: 0.8
            }
        });
    }

    // ===== INITIALIZE =====
    function init() {
        initPreloader();
        initHeroVideo();
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
        initInteractiveNodes();
        initScrollJourneyLine();
        initCardSwap();
        initServicesHub();
        initPillarStack();
        // initWhatsapp();

        document.querySelectorAll('.service-card, .about-stat-card').forEach(function (el) {
            el.classList.add('reveal');
        });

        initScrollReveal();
        initTextAnimations();
        initLazyMotion();
        initStatsAnimation();
        initAboutBackgroundScroll();
        initServicesBackgroundScroll();
        initImpactBackgroundScroll();
        initImmersionBackgroundScroll();
        initHighlightsBackgroundScroll();
        initPartnerBackgroundScroll();
        initBrandsTrail();
        initDigitalWallet();
        
        // Wait for OGL to be ready
        if (window.ogl) {
            initCircularGallery();
        } else {
            const checkOGL = setInterval(() => {
                if (window.ogl) {
                    initCircularGallery();
                    clearInterval(checkOGL);
                }
            }, 100);
        }
    }
    // ===== WHY PARTNER WITH US — WALLET CARD ANIMATION =====
    function initDigitalWallet() {
        const wallet    = document.getElementById('digital-wallet');
        const cardsEls  = Array.from(document.querySelectorAll('.wallet-card'));
        const displayEl = document.getElementById('display-balance');
        const labelEl   = document.getElementById('display-label');
        const walletFront = document.getElementById('wallet-front');
        const walletHint  = document.getElementById('wallet-hint');
        const hintText    = document.getElementById('hint-text');
        const dots        = Array.from(document.querySelectorAll('.wallet-dot'));

        if (!wallet || !cardsEls.length) return;

        // Cards are in DOM order 4→3→2→1 (back to front).
        // Reverse so index 0 = top card (card-1 / Pillar 01).
        const cards = [...cardsEls].reverse(); // [card-1, card-2, card-3, card-4]
        const total = cards.length;

        let activeIdx   = null; // which card is currently popped out (-1 if none)
        let isHovered   = false;

        // ── REST STATE: neat staggered stack ──────────────────────────────
        function restState() {
            cards.forEach((card, i) => {
                const depth = total - 1 - i;          // 0 = front card
                gsap.set(card, {
                    y: depth * 12,
                    scale: 1 - depth * 0.04,
                    filter: `brightness(${1 - depth * 0.18})`,
                    zIndex: 10 + (total - depth),
                    top: -45,
                    xPercent: -50,
                    left: '50%',
                    rotateX: 0
                });
            });
        }
        restState();

        // ── HOVER STATE: cards fan upward sequentially ────────────────────
        function hoverState() {
            if (activeIdx !== null) return;
            cards.forEach((card, i) => {
                // i=0 (front) rises highest, deeper cards rise less
                const riseAmount = 60 + i * 55;
                gsap.to(card, {
                    y: -riseAmount,
                    scale: 1,
                    filter: 'brightness(1)',
                    rotateX: -3,
                    duration: 0.55,
                    delay: i * 0.07,         // sequential: front first
                    ease: 'elastic.out(1, 0.7)',
                    overwrite: 'auto'
                });
            });
            gsap.to(walletFront, { rotateX: 5, y: 6, duration: 0.5, ease: 'power2.out' });
            walletHint.classList.add('active');
            if (hintText) hintText.textContent = 'Click a card to explore';
        }

        // ── RESET TO REST from hover ───────────────────────────────────────
        function collapseState() {
            if (activeIdx !== null) return;
            cards.forEach((card, i) => {
                const depth = total - 1 - i;
                gsap.to(card, {
                    y: depth * 12,
                    scale: 1 - depth * 0.04,
                    filter: `brightness(${1 - depth * 0.18})`,
                    rotateX: 0,
                    duration: 0.5,
                    delay: (total - 1 - i) * 0.04,    // back cards collapse first
                    ease: 'power3.out',
                    overwrite: 'auto'
                });
            });
            gsap.to(walletFront, { rotateX: 0, y: 0, duration: 0.4, ease: 'power2.out' });
            walletHint.classList.remove('active');
            if (hintText) hintText.textContent = 'Hover to peek · Click to open';
        }

        // ── ACTIVE STATE: selected card pops fully out ────────────────────
        function activateCard(idx) {
            activeIdx = idx;

            const title = cards[idx].getAttribute('data-title')  || '';
            const desc  = cards[idx].getAttribute('data-desc')   || '';

            // Update wallet display with slide animation
            gsap.to(displayEl, { opacity: 0, y: 6, duration: 0.18, onComplete: () => {
                if (labelEl) labelEl.textContent = title;
                displayEl.textContent = desc.length > 50 ? desc.substring(0, 48) + '…' : desc;
                gsap.to(displayEl, { opacity: 1, y: 0, duration: 0.28 });
            }});

            // Selected card flies fully upward (above wallet)
            gsap.to(cards[idx], {
                y: -210,
                scale: 1.07,
                zIndex: 50,
                filter: 'brightness(1.1)',
                rotateX: 0,
                duration: 0.75,
                ease: 'elastic.out(1, 0.65)',
                overwrite: 'auto'
            });

            // All other cards collapse back into wallet
            cards.forEach((card, i) => {
                if (i === idx) return;
                const depth = total - 1 - i;
                gsap.to(card, {
                    y: depth * 12,
                    scale: 1 - depth * 0.04,
                    filter: `brightness(${0.35 - depth * 0.05})`,
                    rotateX: 0,
                    duration: 0.5,
                    ease: 'power3.out',
                    overwrite: 'auto'
                });
            });

            gsap.to(walletFront, { rotateX: 5, y: 8, duration: 0.5 });

            // Progress dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === idx);
            });

            if (hintText) hintText.textContent = 'Click background or card to close';
        }

        // ── DEACTIVATE: return to hover state ─────────────────────────────
        function deactivate() {
            activeIdx = null;

            gsap.to(displayEl, { opacity: 0, y: 6, duration: 0.18, onComplete: () => {
                if (labelEl) labelEl.textContent = 'Why Partner With Us?';
                displayEl.textContent = 'Hover to Explore';
                gsap.to(displayEl, { opacity: 1, y: 0, duration: 0.28 });
            }});

            dots.forEach(d => d.classList.remove('active'));

            // Return to hover state (cards fanned) if still hovered, else collapse
            if (isHovered) {
                hoverState();
            } else {
                collapseState();
            }
        }

        // ── EVENT LISTENERS ───────────────────────────────────────────────
        wallet.addEventListener('mouseenter', () => {
            isHovered = true;
            if (activeIdx === null) hoverState();
        });

        wallet.addEventListener('mouseleave', () => {
            isHovered = false;
            if (activeIdx === null) collapseState();
        });

        cards.forEach((card, i) => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activeIdx === i) {
                    deactivate();
                } else {
                    activateCard(i);
                }
            });
        });

        // Dots click
        dots.forEach((dot, i) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                if (activeIdx === i) deactivate();
                else activateCard(i);
            });
        });

        // Click outside to dismiss
        document.addEventListener('click', (e) => {
            if (activeIdx !== null && !wallet.contains(e.target)) {
                deactivate();
            }
        });
    }


    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ===== CARD SWAP ANIMATION =====
    function initCardSwap() {
        const container = document.getElementById('card-swap-wrapper');
        if (!container) return;
        const cards = Array.from(container.querySelectorAll('.cs-card'));
        if (!cards.length) return;

        const cardDistance = 40;
        const verticalDistance = 40;
        const skewAmount = 4;
        const delay = 4000;
        let intervalId;
        let order = cards.map((_, i) => i);
        let tlRef = null;

        const config = {
            ease: 'elastic.out(0.6,0.9)',
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05
        };

        const makeSlot = (i, distX, distY, total) => ({
            x: i * distX,
            y: -i * distY,
            z: -i * distX * 1.5,
            zIndex: total - i
        });

        const placeNow = (el, slot, skew) => {
            gsap.set(el, {
                x: slot.x,
                y: slot.y,
                z: slot.z,
                xPercent: -50,
                yPercent: -50,
                skewY: skew,
                transformOrigin: 'center center',
                zIndex: slot.zIndex,
                force3D: true
            });
        };

        // Initial placement
        cards.forEach((el, i) => {
            placeNow(el, makeSlot(i, cardDistance, verticalDistance, cards.length), skewAmount);
        });

        const swap = () => {
            if (order.length < 2) return;
            const front = order[0];
            const rest = order.slice(1);
            const elFront = cards[front];
            if (!elFront) return;

            const tl = gsap.timeline();
            tlRef = tl;

            tl.to(elFront, {
                y: '+=500',
                duration: config.durDrop,
                ease: config.ease
            });

            tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
            
            rest.forEach((idx, i) => {
                const el = cards[idx];
                if (!el) return;
                const slot = makeSlot(i, cardDistance, verticalDistance, cards.length);
                tl.set(el, { zIndex: slot.zIndex }, 'promote');
                tl.to(el, {
                    x: slot.x,
                    y: slot.y,
                    z: slot.z,
                    duration: config.durMove,
                    ease: config.ease
                }, `promote+=${i * 0.15}`);
            });

            const backSlot = makeSlot(cards.length - 1, cardDistance, verticalDistance, cards.length);
            tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
            tl.call(() => {
                gsap.set(elFront, { zIndex: backSlot.zIndex });
            }, undefined, 'return');

            tl.to(elFront, {
                x: backSlot.x,
                y: backSlot.y,
                z: backSlot.z,
                duration: config.durReturn,
                ease: config.ease
            }, 'return');

            tl.call(() => {
                order = [...rest, front];
            });
        };

        intervalId = setInterval(swap, delay);

        const pause = () => {
            if (tlRef) tlRef.pause();
            clearInterval(intervalId);
        };
        const resume = () => {
            if (tlRef) tlRef.play();
            intervalId = setInterval(swap, delay);
        };

        const section = document.querySelector('.card-swap-container');
        if (section) {
            section.addEventListener('mouseenter', pause);
            section.addEventListener('mouseleave', resume);
        }

        const replayBtn = document.getElementById('card-swap-replay');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                pause();
                swap();
                resume();
            });
        }
    }

    // ===== SERVICES HUB ANIMATION (TECH EDITION) =====
    function initServicesHub() {
        const section = document.querySelector('.services-hub-section');
        if (!section) return;

        // 1. Initial States (Apply immediately to prevent flash)
        gsap.set('.hub-center', { xPercent: -50, yPercent: -50, scale: 0.5, opacity: 0 });
        gsap.set('.hub-node', { xPercent: -50, yPercent: -50, scale: 0.8, opacity: 0 });
        gsap.set('.hub-bg-circle', { scale: 0.2, opacity: 0 });

        // 2. Prepare Path Lengths (Safe handling)
        try {
            const lines = document.querySelectorAll('.hub-line');
            lines.forEach(line => {
                const length = line.getTotalLength() || 1000;
                line.style.strokeDasharray = length;
                line.style.strokeDashoffset = length;
            });
        } catch (e) {
            console.warn("SVG length calc failed", e);
        }

        // 3. Scroll Timeline
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top 90%", // Start earlier
                end: "top 20%",   // End when the top of the section is near the top of the screen
                scrub: 1,
            }
        });

        // 1. Reveal Center Hub
        tl.to('.hub-center', {
            scale: 1,
            opacity: 1,
            duration: 1.5,
            ease: "power2.out"
        })
        
        // 2. Pulse background circles
        .to('.hub-bg-circle', {
            scale: 1,
            opacity: 1,
            stagger: 0.2,
            duration: 1,
            ease: "back.out(1.2)"
        }, "-=1")

        // 3. Draw lines and pop nodes
        .to('.hub-line', {
            strokeDashoffset: 0,
            opacity: 0.6,
            duration: 2,
            stagger: 0.1,
            ease: "none"
        }, "-=0.5")
        
        .to('.hub-node', {
            opacity: 1,
            scale: 1,
            stagger: 0.15,
            duration: 1,
            ease: "back.out(1.7)"
        }, "-=1.5");

        // Subtle floating animation for hub nodes after reveal
        tl.add(() => {
            gsap.to('.hub-node', {
                y: "+=10",
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                stagger: {
                    amount: 1,
                    from: "random"
                }
            });
        });
    }

    // ===== PILLAR STACK (VANILLA PORT OF INTERACTIVE CARD STACK) =====
    function initPillarStack() {
        const container = document.getElementById('interactive-stack');
        if (!container) return;
        const cards = Array.from(container.querySelectorAll('.stack-card'));
        if (!cards.length) return;

        // Initialize stack state
        let stack = cards.map((el, index) => ({
            el,
            id: index,
            randomRot: Math.random() * 10 - 5
        }));

        const sensitivity = 120;
        let isDragging = false;
        let startX, startY;
        let currentX = 0, currentY = 0;

        function updateStack() {
            stack.forEach((item, index) => {
                const depth = stack.length - 1 - index;
                const isTop = index === stack.length - 1;
                
                gsap.to(item.el, {
                    rotateZ: depth * -2 + item.randomRot,
                    scale: 1 - depth * 0.04,
                    y: depth * -8,
                    opacity: 1 - depth * 0.15,
                    zIndex: index,
                    duration: 0.6,
                    ease: "power2.out",
                    overwrite: true
                });

                // Only top card is interactive
                item.el.style.pointerEvents = isTop ? 'auto' : 'none';
            });
        }

        function sendToBack(id) {
            const index = stack.findIndex(item => item.id === id);
            if (index === -1) return;
            
            const [item] = stack.splice(index, 1);
            item.randomRot = Math.random() * 10 - 5;
            stack.unshift(item);
            updateStack();
        }

        // Pointer event handlers for drag
        container.addEventListener('pointerdown', (e) => {
            const topCard = stack[stack.length - 1];
            if (!e.target.closest('.stack-card') || e.target.closest('.stack-card') !== topCard.el) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            topCard.el.setPointerCapture(e.pointerId);
            
            gsap.set(topCard.el, { cursor: 'grabbing' });
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const topCard = stack[stack.length - 1];
            
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;

            gsap.set(topCard.el, {
                x: currentX,
                y: currentY,
                rotateZ: currentX * 0.05 + topCard.randomRot
            });
        });

        window.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            const topCard = stack[stack.length - 1];
            gsap.set(topCard.el, { cursor: 'grab' });
            
            if (Math.abs(currentX) > sensitivity || Math.abs(currentY) > sensitivity) {
                // Fly out and move to back
                gsap.to(topCard.el, {
                    x: currentX * 1.5,
                    y: currentY * 1.5,
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        gsap.set(topCard.el, { x: 0, y: 0 });
                        sendToBack(topCard.id);
                    }
                });
            } else {
                // Snap back
                gsap.to(topCard.el, {
                    x: 0,
                    y: 0,
                    rotateZ: topCard.randomRot,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.5)"
                });
            }
            
            currentX = 0;
            currentY = 0;
        });

        // Simple click to cycle fallback
        container.addEventListener('click', (e) => {
            if (Math.abs(currentX) > 5 || Math.abs(currentY) > 5) return; // Ignore if it was a drag
            const topCard = stack[stack.length - 1];
            if (e.target.closest('.stack-card') === topCard.el) {
                sendToBack(topCard.id);
            }
        });

        // Reset control
        const resetBtn = document.getElementById('reset-stack');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                stack.sort((a, b) => a.id - b.id);
                updateStack();
            });
        }

        updateStack();
    }

    // ===== LAZY MOTION / PARALLAX =====
    function initLazyMotion() {
        const lazyElements = document.querySelectorAll('.lazy-motion');
        if(!lazyElements.length) return;
        
        lazyElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-speed')) || 0.5;
            
            // Speed controls distance. 50px base distance.
            // When element enters viewport, it's pushed down (y: 50 * speed)
            // As user scrolls past it, it moves up (to y: -50 * speed)
            gsap.fromTo(el, {
                y: 50 * speed
            }, {
                y: -50 * speed,
                ease: "none",
                scrollTrigger: {
                    trigger: el.closest('section') || el.parentElement,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });
        });
    }

    // ===== STATS GRID ANIMATION (Z-Axis Warp + Magnetic) =====
    function initStatsAnimation() {
        const grid = document.querySelector('.about-stats-grid');
        const cards = document.querySelectorAll('.about-stat-card');
        
        if (!grid || cards.length === 0) return;

        // 1. Z-Axis "Warp Speed" Entrance (One by One, Slower, Bigger Pop)
        gsap.from(cards, {
            scrollTrigger: {
                trigger: grid,
                start: "top 75%" // Start when it's nicely in view
            },
            opacity: 0,
            scale: 0,
            z: -800, // Starts deep
            rotation: () => Math.random() * 60 - 30, // Dramatic tilt
            duration: 2.5, // Slow pop
            stagger: 0.8, // VERY distinct one-by-one delay
            ease: "back.out(2.5)" // Bigger overshoot/pop
        });

        // 2. Magnetic Physics Hover Effect
        cards.forEach(card => {
            // Apply perspective so 3D rotation looks correct
            gsap.set(card, { transformPerspective: 1000 });
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate tilt based on mouse position relative to center
                const rotateX = ((y - centerY) / centerY) * -25; // max 25 degrees
                const rotateY = ((x - centerX) / centerX) * 25;
                
                gsap.to(card, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    scale: 1.15, // Bigger popup on hover
                    z: 50, // Pushes forward in 3D space
                    ease: "power3.out",
                    duration: 0.8, // Slower hover transition
                    boxShadow: "0 30px 60px rgba(255, 0, 0, 0.25)" // Bigger premium glow
                });
            });

            card.addEventListener('mouseleave', () => {
                // Spring back to resting state (slower)
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    scale: 1,
                    z: 0,
                    ease: "elastic.out(1, 0.5)",
                    duration: 1.8, // Slower return
                    clearProps: "boxShadow" // Remove custom shadow
                });
            });
        });
    }

    function useMobileFriendlyBackgrounds() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    // ===== MULTI-SECTION BACKGROUND SCROLL =====
    function initAboutBackgroundScroll() {
        const bgContainer = document.querySelector('.multi-section-bg');
        if (!bgContainer || useMobileFriendlyBackgrounds()) return;

        gsap.to(bgContainer, {
            backgroundPosition: "50% 80%",
            ease: "none",
            scrollTrigger: {
                trigger: bgContainer,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // ===== SERVICES SECTION BACKGROUND SCROLL =====
    function initServicesBackgroundScroll() {
        const bgContainer = document.querySelector('.services-diff-bg');
        if (!bgContainer || useMobileFriendlyBackgrounds()) return;

        gsap.to(bgContainer, {
            backgroundPosition: "50% 100%",
            ease: "none",
            scrollTrigger: {
                trigger: bgContainer,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // ===== IMPACT & CONTACT SECTION BACKGROUND SCROLL =====
    function initImpactBackgroundScroll() {
        const bgContainer = document.querySelector('.impact-contact-bg');
        if (!bgContainer || useMobileFriendlyBackgrounds()) return;

        gsap.to(bgContainer, {
            backgroundPosition: "50% 100%",
            ease: "none",
            scrollTrigger: {
                trigger: bgContainer,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

    // ===== CHARACTER ANIMATIONS (SPLIT TEXT) =====
    function initTextAnimations() {
        const textElements = document.querySelectorAll('.animate-chars');
        
        textElements.forEach(el => {
            const text = el.textContent.trim();
            el.innerHTML = '';
            el.style.opacity = '1';
            
            [...text].forEach(char => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = char === ' ' ? '\u00A0' : char;
                el.appendChild(span);
            });

            const chars = el.querySelectorAll('.char');
            
            gsap.fromTo(chars, 
                { 
                    opacity: 0, 
                    y: 30,
                    filter: 'blur(12px)'
                },
                {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    duration: 1,
                    stagger: 0.04,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });
    }

    // ===== CIRCULAR SHOWCASE GALLERY (WebGL) =====
    function initCircularGallery() {
        const container = document.getElementById('circular-gallery-container');
        if (!container || !window.ogl) {
            console.warn('Circular Gallery: Container or OGL not found');
            return;
        }

        const { Renderer, Camera, Transform, Plane, Mesh, Program, Texture } = window.ogl;

        function lerp(p1, p2, t) { return p1 + (p2 - p1) * t; }

        class Title {
            constructor({ gl, plane, text, textColor = '#ffffff', font = 'bold 40px Inter' }) {
                this.gl = gl;
                this.plane = plane;
                this.text = text;
                this.textColor = textColor;
                this.font = font;
                this.createMesh();
            }

            createMesh() {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                context.font = this.font;
                const metrics = context.measureText(this.text);
                const textWidth = Math.ceil(metrics.width);
                const textHeight = 50;
                canvas.width = textWidth + 80;
                canvas.height = textHeight + 80;
                
                context.font = this.font;
                context.fillStyle = this.textColor;
                context.textBaseline = 'middle';
                context.textAlign = 'center';
                context.shadowColor = 'rgba(0,0,0,0.5)';
                context.shadowBlur = 10;
                context.fillText(this.text, canvas.width / 2, canvas.height / 2);

                const texture = new Texture(this.gl, { generateMipmaps: false });
                texture.image = canvas;

                const geometry = new Plane(this.gl);
                const program = new Program(this.gl, {
                    vertex: `
                        attribute vec3 position;
                        attribute vec2 uv;
                        uniform mat4 modelViewMatrix;
                        uniform mat4 projectionMatrix;
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragment: `
                        precision highp float;
                        uniform sampler2D tMap;
                        varying vec2 vUv;
                        void main() {
                            vec4 color = texture2D(tMap, vUv);
                            if (color.a < 0.05) discard;
                            gl_FragColor = color;
                        }
                    `,
                    uniforms: { tMap: { value: texture } },
                    transparent: true
                });
                this.mesh = new Mesh(this.gl, { geometry, program });
                const aspect = canvas.width / canvas.height;
                const textHeightScaled = this.plane.scale.y * 0.18;
                this.mesh.scale.set(textHeightScaled * aspect, textHeightScaled, 1);
                this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.15;
                this.mesh.setParent(this.plane);
            }
        }

        class Media {
            constructor({ geometry, gl, image, index, length, scene, screen, text, viewport, bend, textColor }) {
                this.gl = gl;
                this.geometry = geometry;
                this.image = image;
                this.index = index;
                this.length = length;
                this.scene = scene;
                this.screen = screen;
                this.text = text;
                this.viewport = viewport;
                this.bend = bend;
                this.textColor = textColor;
                this.extra = 0;
                this.createShader();
                this.createMesh();
                this.onResize();
            }

            createShader() {
                this.texture = new Texture(this.gl, { generateMipmaps: true });
                this.program = new Program(this.gl, {
                    vertex: `
                        precision highp float;
                        attribute vec3 position;
                        attribute vec2 uv;
                        uniform mat4 modelViewMatrix;
                        uniform mat4 projectionMatrix;
                        uniform float uSpeed;
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            vec3 p = position;
                            p.z = sin(p.x * 2.0) * abs(uSpeed) * 0.2;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                        }
                    `,
                    fragment: `
                        precision highp float;
                        uniform vec2 uImageSizes;
                        uniform vec2 uPlaneSizes;
                        uniform sampler2D tMap;
                        varying vec2 vUv;
                        void main() {
                            vec2 ratio = vec2(
                                min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
                                min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
                            );
                            vec2 uv = vec2(
                                vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
                                vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
                            );
                            gl_FragColor = texture2D(tMap, uv);
                        }
                    `,
                    uniforms: {
                        tMap: { value: this.texture },
                        uPlaneSizes: { value: [0, 0] },
                        uImageSizes: { value: [1, 1] },
                        uSpeed: { value: 0 }
                    }
                });
                const img = new Image();
                img.onload = () => {
                    this.texture.image = img;
                    this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
                };
                img.src = this.image;
            }

            createMesh() {
                this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
                this.plane.setParent(this.scene);
                new Title({ gl: this.gl, plane: this.plane, text: this.text, textColor: this.textColor });
            }

            update(scroll, direction) {
                this.plane.position.x = this.x - scroll.current - this.extra;
                const x = this.plane.position.x;
                const H = this.viewport.width / 2;
                const B_abs = Math.max(0.1, Math.abs(this.bend));
                const R = (H * H + B_abs * B_abs) / (2 * B_abs);
                const effectiveX = Math.min(Math.abs(x), H);
                const arc = R - Math.sqrt(Math.max(0, R * R - effectiveX * effectiveX));
                this.plane.position.y = this.bend > 0 ? -arc : arc;
                this.plane.rotation.z = -Math.sign(x) * Math.asin(Math.min(1, effectiveX / R));

                this.program.uniforms.uSpeed.value = lerp(this.program.uniforms.uSpeed.value, scroll.current - scroll.last, 0.1);

                const widthTotal = this.width * this.length;
                if (direction === 'right' && x + this.plane.scale.x / 2 < -H) this.extra -= widthTotal;
                if (direction === 'left' && x - this.plane.scale.x / 2 > H) this.extra += widthTotal;
            }

            onResize() {
                if (!this.screen || !this.viewport) return;
                this.scale = this.screen.height / 1500;
                this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
                this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
                this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
                this.width = this.plane.scale.x + 2.5;
                this.x = this.width * this.index;
            }
        }

        class Gallery {
            constructor(container) {
                this.container = container;
                this.scroll = { current: 0, target: 0, last: 0, ease: 0.05 };
                this.createRenderer();
                this.createCamera();
                this.createScene();
                this.onResize();
                this.createMedias();
                this.addEvents();
                this.update();
            }

            createRenderer() {
                this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio, 2) });
                this.gl = this.renderer.gl;
                this.gl.clearColor(0, 0, 0, 0);
                this.container.appendChild(this.gl.canvas);
            }

            createCamera() {
                this.camera = new Camera(this.gl);
                this.camera.fov = 45;
                this.camera.position.z = 20;
            }

            createScene() { this.scene = new Transform(); }

            createMedias() {
                const items = [
                    { image: assetUrl('scroller/Google For India (5).jpeg'), text: 'Google For India' },
                    { image: assetUrl('scroller/Google For India (8).jpeg'), text: 'Event Scale' },
                    { image: assetUrl('scroller/WhatsApp Image 2026-04-21 at 5.16.33 PM.jpeg'), text: 'Live Broadcast' },
                    { image: assetUrl('scroller/WhatsApp Image 2026-04-21 at 6.17.01 PM (1).jpeg'), text: 'Production Control' },
                    { image: assetUrl('scroller/download.jfif'), text: 'Visual Tech' }
                ];
                const geometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 });
                this.medias = [...items, ...items].map((item, index) => new Media({
                    geometry, gl: this.gl, image: item.image, index, length: items.length * 2,
                    scene: this.scene, screen: this.screen, text: item.text, viewport: this.viewport,
                    bend: 3, textColor: '#ffffff'
                }));
            }

            onResize() {
                this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
                if (this.screen.width === 0 || this.screen.height === 0) return;
                
                this.renderer.setSize(this.screen.width, this.screen.height);
                this.camera.perspective({ aspect: this.screen.width / this.screen.height });
                const fov = (this.camera.fov * Math.PI) / 180;
                const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
                this.viewport = { width: height * this.camera.aspect, height };
                if (this.medias) this.medias.forEach(m => { m.screen = this.screen; m.viewport = this.viewport; m.onResize(); });
            }

            addEvents() {
                window.addEventListener('resize', this.onResize.bind(this));
                window.addEventListener('wheel', e => { this.scroll.target += e.deltaY * 0.01; }, { passive: true });
                let isDown = false, start = 0;
                this.container.addEventListener('mousedown', e => { isDown = true; start = e.clientX; });
                window.addEventListener('mousemove', e => { if (!isDown) return; this.scroll.target += (start - e.clientX) * 0.01; start = e.clientX; });
                window.addEventListener('mouseup', () => isDown = false);
                
                this.container.addEventListener('touchstart', e => { isDown = true; start = e.touches[0].clientX; }, { passive: true });
                window.addEventListener('touchmove', e => { if (!isDown) return; this.scroll.target += (start - e.touches[0].clientX) * 0.01; start = e.touches[0].clientX; }, { passive: true });
                window.addEventListener('touchend', () => isDown = false);
            }

            update() {
                this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
                const dir = this.scroll.current > this.scroll.last ? 'right' : 'left';
                if (this.medias) this.medias.forEach(m => m.update(this.scroll, dir));
                this.renderer.render({ scene: this.scene, camera: this.camera });
                this.scroll.last = this.scroll.current;
                requestAnimationFrame(this.update.bind(this));
            }
        }

        new Gallery(container);
    }

    // ===== TRUSTED BY BRANDS IMAGE TRAIL =====
    function initBrandsTrail() {
        const container = document.getElementById('image-trail-container');
        if (!container) return;

        const items = [
            { url: assetUrl('logos/google.svg'), type: 'logo' },
            { url: assetUrl('scroller/Google For India (5).jpeg'), type: 'project' },
            { url: assetUrl('logos/amazon.svg'), type: 'logo' },
            { url: assetUrl('scroller/Google For India (8).jpeg'), type: 'project' },
            { url: assetUrl('logos/meta.svg'), type: 'logo' },
            { url: assetUrl('scroller/WhatsApp Image 2026-04-21 at 5.16.33 PM.jpeg'), type: 'project' },
            { url: assetUrl('logos/vw.svg'), type: 'logo' },
            { url: assetUrl('scroller/WhatsApp Image 2026-04-21 at 6.17.01 PM (1).jpeg'), type: 'project' }
        ];

        let imagesTotal = items.length;
        let imgPosition = 0;
        let zIndexVal = 1;
        let mousePos = { x: 0, y: 0 };
        let lastMousePos = { x: 0, y: 0 };
        let cacheMousePos = { x: 0, y: 0 };
        let threshold = 80;

        items.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = `trail-img ${item.type === 'project' ? 'project-shot' : ''}`;
            const inner = document.createElement('div');
            inner.className = 'trail-img-inner';
            inner.style.backgroundImage = `url('${item.url}')`;
            div.appendChild(inner);
            container.appendChild(div);
        });

        const trailImages = container.querySelectorAll('.trail-img');
        const getMouseDistance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

        const showNextImage = () => {
            ++zIndexVal;
            imgPosition = imgPosition < imagesTotal - 1 ? imgPosition + 1 : 0;
            const img = trailImages[imgPosition];
            const inner = img.querySelector('.trail-img-inner');
            const rect = img.getBoundingClientRect();

            gsap.killTweensOf(img);
            gsap.killTweensOf(inner);

            gsap.timeline()
                .fromTo(img, {
                    opacity: 1, scale: 0, zIndex: zIndexVal,
                    x: cacheMousePos.x - rect.width / 2,
                    y: cacheMousePos.y - rect.height / 2
                }, {
                    duration: 0.5, ease: 'power1.out', scale: 1,
                    x: mousePos.x - rect.width / 2,
                    y: mousePos.y - rect.height / 2
                }, 0)
                .fromTo(inner, {
                    scale: 2.5, filter: 'brightness(200%) blur(10px)'
                }, {
                    duration: 0.5, ease: 'power1.out', 
                    scale: items[imgPosition].type === 'logo' ? 0.7 : 1,
                    filter: 'brightness(100%) blur(0px)'
                }, 0)
                .to(img, {
                    duration: 0.6, ease: 'power2.in', opacity: 0, scale: 0.1, y: '+=50'
                }, 0.5);
        };

        const render = () => {
            const distance = getMouseDistance(mousePos, lastMousePos);
            cacheMousePos.x = gsap.utils.interpolate(cacheMousePos.x, mousePos.x, 0.1);
            cacheMousePos.y = gsap.utils.interpolate(cacheMousePos.y, mousePos.y, 0.1);
            if (distance > threshold) {
                showNextImage();
                lastMousePos = { ...mousePos };
            }
            requestAnimationFrame(render);
        };

        container.addEventListener('mousemove', (ev) => {
            const rect = container.getBoundingClientRect();
            mousePos.x = ev.clientX - rect.left;
            mousePos.y = ev.clientY - rect.top;
        });

        requestAnimationFrame(render);
    }
    
    function initImmersionBackgroundScroll() {
        const bg = document.querySelector('.immersion-brands-bg');
        if (!bg || useMobileFriendlyBackgrounds()) return;

        gsap.to(bg, {
            backgroundPositionY: "30%",
            ease: "none",
            scrollTrigger: {
                trigger: bg,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

    function initHighlightsBackgroundScroll() {
        const bg = document.querySelector('.highlights-bg');
        if (!bg || useMobileFriendlyBackgrounds()) return;

        gsap.to(bg, {
            backgroundPositionY: "35%",
            ease: "none",
            scrollTrigger: {
                trigger: bg,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

    function initPartnerBackgroundScroll() {
        const bg = document.querySelector('.partner-bg');
        if (!bg || useMobileFriendlyBackgrounds()) return;

        gsap.to(bg, {
            backgroundPositionY: "40%",
            ease: "none",
            scrollTrigger: {
                trigger: bg,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }

})();
