(() => {
  'use strict';

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(pointer: fine)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  const header = document.getElementById('siteHeader');
  const progressBar = document.getElementById('scrollProgress');
  const heroScene = document.querySelector('[data-hero-scene]');
  const heroSticky = heroScene?.querySelector('.hero-sticky');
  const heroVisual = heroScene?.querySelector('.hero-visual');
  const heroSigil = heroScene?.querySelector('[data-tilt-surface]');
  const scrollAnchors = [...document.querySelectorAll('[data-scroll-card]')];
  const motionScenes = [...document.querySelectorAll('[data-motion-scene]')];
  const tiltCards = [...document.querySelectorAll('[data-tilt-card]')];
  const navLinks = [...document.querySelectorAll('.site-nav a')];
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  let frameRequested = false;
  let pointerFrameRequested = false;
  let pendingPointer = null;

  function motionScale() {
    if (window.innerWidth <= 700) return 0.34;
    if (window.innerWidth <= 960) return 0.62;
    return 1;
  }

  function setHeroProgress(progress) {
    if (!heroSticky || !heroVisual || reduceMotionQuery.matches) return;

    const eased = progress * progress * (3 - 2 * progress);
    const scale = motionScale();
    const copyOpacity = clamp((0.72 - progress) / 0.42, 0, 1);

    heroSticky.style.setProperty('--hero-bg-y', `${(eased * 22 * scale).toFixed(2)}px`);
    heroSticky.style.setProperty('--hero-copy-y', `${(-eased * 52 * scale).toFixed(2)}px`);
    heroSticky.style.setProperty('--hero-copy-opacity', copyOpacity.toFixed(3));
    heroSticky.style.setProperty('--cue-opacity', clamp(1 - progress * 3, 0, 1).toFixed(3));

    heroVisual.style.setProperty('--hero-camera-y', `${(-eased * 18 * scale).toFixed(2)}px`);
    heroVisual.style.setProperty('--hero-camera-scale', (1 + eased * 0.055 * scale).toFixed(3));
    heroVisual.style.setProperty('--hero-x', `${(-8 + eased * 18 * scale).toFixed(2)}px`);
    heroVisual.style.setProperty('--hero-y', `${(12 - eased * 40 * scale).toFixed(2)}px`);
    heroVisual.style.setProperty('--hero-z', `${(-10 + eased * 46 * scale).toFixed(2)}px`);
    heroVisual.style.setProperty('--hero-rx', `${(6 - eased * 8 * scale).toFixed(2)}deg`);
    heroVisual.style.setProperty('--hero-ry', `${(-10 + eased * 18 * scale).toFixed(2)}deg`);
    heroVisual.style.setProperty('--hero-rz', `${(-2 + eased * 3 * scale).toFixed(2)}deg`);
    heroVisual.style.setProperty('--hero-scale', (0.95 + eased * 0.075 * scale).toFixed(3));
    heroVisual.style.setProperty('--number-y', `${(-eased * 54 * scale).toFixed(2)}px`);
    heroVisual.style.setProperty('--number-z', `${(-320 + eased * 18 * scale).toFixed(2)}px`);
    heroVisual.style.setProperty('--number-ry', `${(6 + eased * 5 * scale).toFixed(2)}deg`);
    heroVisual.style.setProperty('--ring-rotation', `${(10 + eased * 38 * scale).toFixed(2)}deg`);
    heroVisual.style.setProperty('--ring-rotation-reverse', `${(-10 - eased * 32 * scale).toFixed(2)}deg`);
    heroVisual.style.setProperty('--halo-scale', (1 + eased * 0.14 * scale).toFixed(3));
  }

  function writeCardMotion(measurement, viewportHeight) {
    if (reduceMotionQuery.matches) return;

    const { anchor, motion, rect, index } = measurement;
    if (!motion) return;

    const scale = motionScale();
    const cardCenter = rect.top + rect.height / 2;
    const travel = viewportHeight / 2 + rect.height / 2;
    const distance = clamp((cardCenter - viewportHeight / 2) / travel, -1, 1);
    const near = rect.bottom > -viewportHeight * 0.55 && rect.top < viewportHeight * 1.55;
    const depth = -Math.abs(distance) * 48 * scale;
    const vertical = distance >= 0 ? distance * 58 * scale : distance * 18 * scale;
    const rotateX = distance * 2.8 * scale;
    const rotateY = distance * (index % 2 === 0 ? -0.8 : 0.8) * scale;
    const media = anchor.querySelector('.project-screen img');
    const copy = anchor.querySelector('.project-copy');

    anchor.classList.toggle('is-motion-near', near);
    motion.style.setProperty('--card-y', `${vertical.toFixed(2)}px`);
    motion.style.setProperty('--card-z', `${depth.toFixed(2)}px`);
    motion.style.setProperty('--card-rx', `${rotateX.toFixed(2)}deg`);
    motion.style.setProperty('--card-ry', `${rotateY.toFixed(2)}deg`);

    if (media) media.style.setProperty('--media-y', `${(-distance * 14 * scale).toFixed(2)}px`);
    if (copy) copy.style.setProperty('--copy-y', `${(distance * 8 * scale).toFixed(2)}px`);
  }

  function writeSceneMotion(measurement, viewportHeight) {
    if (reduceMotionQuery.matches) return;

    const { scene, rect } = measurement;
    const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
    const centered = (progress - 0.5) * 2;
    const scale = motionScale();
    const planes = [...scene.querySelectorAll('[data-depth-plane]')];

    planes.forEach((plane, index) => {
      const depth = Number.parseFloat(plane.dataset.depthPlane || '1');
      const direction = index % 2 === 0 ? 1 : -1;
      const y = -centered * 18 * depth * scale;
      const z = (12 - Math.abs(centered) * 20) * depth * scale;
      const rotateX = centered * -2.2 * depth * scale;
      const rotateY = centered * direction * 2.6 * depth * scale;
      plane.style.setProperty('--plane-y', `${y.toFixed(2)}px`);
      plane.style.setProperty('--plane-z', `${z.toFixed(2)}px`);
      plane.style.setProperty('--plane-rx', `${rotateX.toFixed(2)}deg`);
      plane.style.setProperty('--plane-ry', `${rotateY.toFixed(2)}deg`);
    });

    const contactBackground = scene.querySelector('.contact-background');
    if (contactBackground) {
      contactBackground.style.setProperty('--contact-bg-y', `${(centered * 18 * scale).toFixed(2)}px`);
    }
  }

  function updateScrollEffects() {
    frameRequested = false;

    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollRange = Math.max(document.documentElement.scrollHeight - viewportHeight, 1);

    // Read phase: every layout measurement is collected before any style write.
    const heroRect = heroScene?.getBoundingClientRect();
    const cardMeasurements = scrollAnchors.map((anchor, index) => ({
      anchor,
      index,
      motion: anchor.querySelector('.card-motion'),
      rect: anchor.getBoundingClientRect(),
    }));
    const sceneMeasurements = motionScenes.map((scene) => ({
      scene,
      rect: scene.getBoundingClientRect(),
    }));
    const navigationMeasurements = navSections.map((section) => ({
      section,
      rect: section.getBoundingClientRect(),
    }));

    // Write phase.
    header?.classList.toggle('is-scrolled', scrollTop > 24);
    progressBar?.style.setProperty('transform', `scaleX(${clamp(scrollTop / scrollRange).toFixed(5)})`);

    const navigationProbe = viewportHeight * 0.42;
    const activeSection = navigationMeasurements.find(({ rect }) => (
      rect.top <= navigationProbe && rect.bottom > navigationProbe
    ))?.section;

    navLinks.forEach((link) => {
      const isActive = Boolean(activeSection) && link.getAttribute('href') === `#${activeSection.id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (heroRect && heroScene && !reduceMotionQuery.matches) {
      const sceneRange = Math.max(heroRect.height - viewportHeight, 1);
      setHeroProgress(clamp(-heroRect.top / sceneRange));
    }

    cardMeasurements.forEach((measurement) => writeCardMotion(measurement, viewportHeight));
    sceneMeasurements.forEach((measurement) => writeSceneMotion(measurement, viewportHeight));
  }

  function requestScrollUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    window.requestAnimationFrame(updateScrollEffects);
  }

  function setupReveal() {
    const items = [...document.querySelectorAll('.reveal-item')];

    if (reduceMotionQuery.matches || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    document.querySelectorAll('section').forEach((section) => {
      [...section.querySelectorAll('.reveal-item')].forEach((item, index) => {
        item.classList.add('reveal-pending');
        item.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 45}ms`);
      });
    });

    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -6% 0px',
    });

    items.forEach((item) => observer.observe(item));
  }

  function writePointerTilt() {
    pointerFrameRequested = false;
    if (!pendingPointer || reduceMotionQuery.matches || !finePointerQuery.matches) return;

    const { target, clientX, clientY, amplitude } = pendingPointer;
    pendingPointer = null;
    const rect = target.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    target.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`);
    target.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`);
    target.style.setProperty('--pointer-rx', `${((0.5 - y) * amplitude).toFixed(2)}deg`);
    target.style.setProperty('--pointer-ry', `${((x - 0.5) * amplitude).toFixed(2)}deg`);
  }

  function queuePointerTilt(target, event, amplitude) {
    pendingPointer = { target, clientX: event.clientX, clientY: event.clientY, amplitude };
    if (pointerFrameRequested) return;
    pointerFrameRequested = true;
    window.requestAnimationFrame(writePointerTilt);
  }

  function resetTilt(target) {
    target.style.setProperty('--pointer-rx', '0deg');
    target.style.setProperty('--pointer-ry', '0deg');
    target.style.setProperty('--pointer-x', '50%');
    target.style.setProperty('--pointer-y', '50%');
  }

  function setupPointerTilt() {
    if (heroVisual && heroSigil) {
      heroVisual.addEventListener('pointermove', (event) => {
        if (reduceMotionQuery.matches || !finePointerQuery.matches) return;
        const rect = heroVisual.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5;
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5;
        heroVisual.style.setProperty('--tilt-rx', `${(-y * 3.5).toFixed(2)}deg`);
        heroVisual.style.setProperty('--tilt-ry', `${(x * 4.2).toFixed(2)}deg`);
      }, { passive: true });

      heroVisual.addEventListener('pointerleave', () => {
        heroVisual.style.setProperty('--tilt-rx', '0deg');
        heroVisual.style.setProperty('--tilt-ry', '0deg');
      });
    }

    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (event) => queuePointerTilt(card, event, 4.2), { passive: true });
      card.addEventListener('pointerleave', () => resetTilt(card));
    });
  }

  function resetMotion() {
    scrollAnchors.forEach((anchor) => {
      anchor.classList.remove('is-motion-near');
      const motion = anchor.querySelector('.card-motion');
      if (!motion) return;
      motion.style.setProperty('--card-y', '0px');
      motion.style.setProperty('--card-z', '0px');
      motion.style.setProperty('--card-rx', '0deg');
      motion.style.setProperty('--card-ry', '0deg');
    });
    document.querySelectorAll('[data-depth-plane]').forEach((plane) => {
      plane.style.setProperty('--plane-y', '0px');
      plane.style.setProperty('--plane-z', '0px');
      plane.style.setProperty('--plane-rx', '0deg');
      plane.style.setProperty('--plane-ry', '0deg');
    });
    tiltCards.forEach(resetTilt);
  }

  setupReveal();
  setupPointerTilt();
  updateScrollEffects();

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  window.addEventListener('pageshow', requestScrollUpdate, { passive: true });
  reduceMotionQuery.addEventListener?.('change', () => {
    if (reduceMotionQuery.matches) resetMotion();
    else requestScrollUpdate();
  });
})();
