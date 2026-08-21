/**
 * DUMRAAZ — High Performance Cinematic Scroll & Motion Animation Engine (v6.2 Final Production Pass)
 * 1. Ultra-Smooth, Zero-Glitch 270-Frame Sequencer with Unified Master Render Loop.
 * 2. Instant Homepage Typography Opening with Smooth Ambient Scrim Reveal.
 * 3. Seamless Handover between Cinematic Ambient Autoplay and Scroll Tracking.
 * 4. Zero-Toggle Browser-Compliant Ambient Audio Engine with Dynamic Climax Swell.
 * 5. Multi-Tier Predictive Preloading with Radiating Nearest-Frame Fallback.
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 270;
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.jpg';

  function formatFrameNumber(num) {
    return String(num).padStart(3, '0');
  }

  // Hero DOM Elements
  const canvas = document.getElementById('frameCanvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const heroAtmosphereCanvas = document.getElementById('heroAtmosphereCanvas');
  const heroAtmoCtx = heroAtmosphereCanvas ? heroAtmosphereCanvas.getContext('2d') : null;
  const canvasStageWrapper = document.getElementById('canvasStageWrapper');
  const impactFlash = document.getElementById('impactFlash');
  const openingScrim = document.getElementById('openingScrim');

  const scrollHero = document.getElementById('scrollHero');
  const mainHeader = document.getElementById('mainHeader');
  const pageProgressBar = document.getElementById('pageProgressBar');

  // Story Beats Elements
  const beat1 = document.getElementById('storyBeat1');
  const beat2 = document.getElementById('storyBeat2');
  const beat3 = document.getElementById('storyBeat3');
  const beat4 = document.getElementById('storyBeat4');
  const beat5 = document.getElementById('storyBeat5');
  const beat6 = document.getElementById('storyBeat6');

  // Signature Section Steam Canvas
  const steamCanvas = document.getElementById('steamCanvas');
  const steamCtx = steamCanvas ? steamCanvas.getContext('2d') : null;

  if (!canvas || !ctx || !scrollHero) return;

  // Frame Cache & State Management
  const frames = new Array(TOTAL_FRAMES);
  const frameReady = new Array(TOTAL_FRAMES).fill(false);
  let currentRenderedIndex = -1;
  let currentFrameIndex = 0.0; // Smooth continuous floating index
  let targetFrameIndex = 0.0;  // Target index from scroll or ambient autoplay
  let rawScrollProgress = 0.0;
  let needsCanvasRedraw = true;
  let hasTriggeredImpact = false;

  // Ambient Motion State
  let isUserScrolling = false;
  let scrollIdleTimer = null;
  let autoplayTime = 0.0;

  // Viewport Dimensions
  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;
  let dpr = 1;

  /* ==========================================================================
     Nearest Loaded Frame Fallback (Zero Flickering, Forward & Backward Safe)
     ========================================================================== */
  function getNearestLoadedIndex(targetIdx) {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(targetIdx)));
    if (frameReady[clamped]) return clamped;

    // Radiating outward search for the closest ready frame
    let left = clamped - 1;
    let right = clamped + 1;
    while (left >= 0 || right < TOTAL_FRAMES) {
      if (left >= 0 && frameReady[left]) return left;
      if (right < TOTAL_FRAMES && frameReady[right]) return right;
      left--;
      right++;
    }
    return 0; // Fallback to initial frame
  }

  /* ==========================================================================
     Multi-Tier Predictive Frame Preloader
     ========================================================================== */
  function initFrames() {
    // 1. Instant Tier 1: Frame 1 (Zero-latency first paint)
    const firstImg = new Image();
    firstImg.src = `${FRAME_PREFIX}001${FRAME_EXT}`;
    firstImg.onload = () => {
      frameReady[0] = true;
      needsCanvasRedraw = true;
      drawHeroCanvas();
    };
    if (firstImg.decode) {
      firstImg.decode().then(() => {
        frameReady[0] = true;
        needsCanvasRedraw = true;
        drawHeroCanvas();
      }).catch(() => {});
    }
    frames[0] = firstImg;

    // 2. Tier 2: Priority burst (Frames 2 through 30)
    for (let i = 2; i <= 30; i++) {
      loadSingleFrame(i);
    }

    // 3. Tier 3: Concurrent preloading for all remaining frames (31 through 270)
    setTimeout(() => {
      for (let i = 31; i <= TOTAL_FRAMES; i++) {
        loadSingleFrame(i);
      }
    }, 30);
  }

  function loadSingleFrame(frameNum) {
    const idx = frameNum - 1;
    if (frames[idx]) return;

    const img = new Image();
    img.src = `${FRAME_PREFIX}${formatFrameNumber(frameNum)}${FRAME_EXT}`;

    img.onload = () => {
      frameReady[idx] = true;
      const currentTarget = Math.round(currentFrameIndex);
      if (idx === currentTarget || Math.abs(idx - currentTarget) < Math.abs(currentRenderedIndex - currentTarget)) {
        needsCanvasRedraw = true;
      }
    };

    if (img.decode) {
      img.decode().then(() => {
        frameReady[idx] = true;
      }).catch(() => {});
    }

    frames[idx] = img;
  }

  /* ==========================================================================
     High-Precision Canvas Drawing (Aspect-Ratio Cover & Seamless Fill)
     ========================================================================== */
  function drawHeroCanvas() {
    if (!ctx || !canvas) return;

    const targetIdx = Math.round(currentFrameIndex);
    const bestIdx = getNearestLoadedIndex(targetIdx);

    const img = frames[bestIdx];
    if (!img || !img.naturalWidth) return;

    if (bestIdx === currentRenderedIndex && !needsCanvasRedraw) return;
    currentRenderedIndex = bestIdx;
    needsCanvasRedraw = false;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Exact Aspect-Ratio Cover Dimensions
    const scale = Math.max(cw / iw, ch / ih);
    const dw = Math.ceil(iw * scale);
    const dh = Math.ceil(ih * scale);
    const dx = Math.floor((cw - dw) * 0.5);
    const dy = Math.floor((ch - dh) * 0.5);

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  /* ==========================================================================
     Responsive Sizing
     ========================================================================== */
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;

    const pixelW = Math.round(canvasWidth * dpr);
    const pixelH = Math.round(canvasHeight * dpr);

    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW;
      canvas.height = pixelH;
      canvas.style.width = canvasWidth + 'px';
      canvas.style.height = canvasHeight + 'px';
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (heroAtmosphereCanvas && heroAtmoCtx) {
      if (heroAtmosphereCanvas.width !== pixelW || heroAtmosphereCanvas.height !== pixelH) {
        heroAtmosphereCanvas.width = pixelW;
        heroAtmosphereCanvas.height = pixelH;
        heroAtmosphereCanvas.style.width = canvasWidth + 'px';
        heroAtmosphereCanvas.style.height = canvasHeight + 'px';
      }
      heroAtmoCtx.imageSmoothingEnabled = true;
    }

    if (steamCanvas && steamCtx) {
      const rect = steamCanvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const steamW = Math.round(rect.width * dpr);
        const steamH = Math.round(rect.height * dpr);
        if (steamCanvas.width !== steamW || steamCanvas.height !== steamH) {
          steamCanvas.width = steamW;
          steamCanvas.height = steamH;
        }
      }
    }

    needsCanvasRedraw = true;
    drawHeroCanvas();
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('orientationchange', resizeCanvas, { passive: true });

  /* ==========================================================================
     Single Scroll Listener & Continuous Mapping
     ========================================================================== */
  let lastScrollY = -1;

  function updateScroll() {
    const scrollY = window.scrollY;
    if (scrollY === lastScrollY) return;
    lastScrollY = scrollY;

    isUserScrolling = true;
    if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(() => {
      isUserScrolling = false;
    }, 1000);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Top progress bar
    if (pageProgressBar && docHeight > 0) {
      const totalProgress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      pageProgressBar.style.width = `${totalProgress}%`;
    }

    const trackTop = scrollHero.offsetTop;
    const trackHeight = scrollHero.offsetHeight - window.innerHeight;

    if (trackHeight > 0) {
      const currentScroll = scrollY - trackTop;
      rawScrollProgress = Math.max(0, Math.min(1, currentScroll / trackHeight));

      // Direct scroll-to-frame mapping
      targetFrameIndex = rawScrollProgress * (TOTAL_FRAMES - 1);

      // Smart Header Transition
      if (mainHeader) {
        if (rawScrollProgress > 0.70 || scrollY > trackTop + trackHeight) {
          mainHeader.classList.add('nav-scrolled');
        } else {
          mainHeader.classList.remove('nav-scrolled');
        }
      }

      // Choreographed Story Beats & Opening Scrim Fade
      updateStoryChoreography(rawScrollProgress);

      // Smooth Audio Volume Modulation
      updateAudioVolume(rawScrollProgress);
    }
  }

  window.addEventListener('scroll', updateScroll, { passive: true });

  /* ==========================================================================
     Cinematic Story Choreography & Homepage Opening Scrim
     ========================================================================== */
  function calcOpacity(progress, start, peakIn, peakOut, end) {
    if (progress < start || progress > end) return 0;
    if (progress >= peakIn && progress <= peakOut) return 1;
    if (progress < peakIn) {
      return (progress - start) / (peakIn - start);
    }
    return 1 - ((progress - peakOut) / (end - peakOut));
  }

  function updateStoryChoreography(progress) {
    // Opening Scrim: Dark contrast highlights typography at opening, fades gracefully on first scroll
    if (openingScrim) {
      const scrimOp = Math.max(0, 0.88 * (1 - (progress / 0.14)));
      openingScrim.style.opacity = scrimOp.toFixed(3);
    }

    // Beat 1: 0.00 - 0.15 (Visible on opening, fades as scroll continues)
    let op1 = 1.0;
    if (progress > 0.09) {
      op1 = Math.max(0, 1 - ((progress - 0.09) / 0.06));
    }
    setCardState(beat1, op1);

    // Beat 2: 0.17 - 0.31 ("SEALED.")
    const op2 = calcOpacity(progress, 0.17, 0.20, 0.28, 0.31);
    setCardState(beat2, op2);

    // Beat 3: 0.33 - 0.47 ("SLOW DUM.")
    const op3 = calcOpacity(progress, 0.33, 0.36, 0.44, 0.47);
    setCardState(beat3, op3);

    // Beat 4: 0.49 - 0.65 ("90 MINUTES. ZERO SHORTCUTS.")
    const op4 = calcOpacity(progress, 0.49, 0.52, 0.62, 0.65);
    setCardState(beat4, op4);

    // Beat 5: 0.67 - 0.81 ("THE AROMA HAS ARRIVED.")
    const op5 = calcOpacity(progress, 0.67, 0.70, 0.78, 0.81);
    setCardState(beat5, op5);

    // Beat 6: 0.83 - 0.97 ("DUM. DONE." Climax Impact Moment)
    const op6 = calcOpacity(progress, 0.83, 0.87, 0.93, 0.97);
    setCardState(beat6, op6, true);

    // Trigger Impact Moment Screen Shake & Flash when entering Beat 6
    if (progress >= 0.83 && progress <= 0.95) {
      if (!hasTriggeredImpact) {
        hasTriggeredImpact = true;
        triggerCinematicImpact();
      }
    } else {
      hasTriggeredImpact = false;
    }
  }

  function setCardState(el, opacity, isCenter) {
    if (!el) return;
    el.style.opacity = opacity.toFixed(3);
    const translateY = ((1 - opacity) * 18).toFixed(1);

    if (isCenter) {
      el.style.transform = `translate(-50%, ${translateY}px)`;
    } else {
      el.style.transform = `translateY(${translateY}px)`;
    }

    if (opacity > 0.05) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  }

  function triggerCinematicImpact() {
    if (canvasStageWrapper) {
      canvasStageWrapper.classList.remove('micro-shake');
      void canvasStageWrapper.offsetWidth; // Force reflow
      canvasStageWrapper.classList.add('micro-shake');
    }
    if (impactFlash) {
      impactFlash.classList.add('active');
      setTimeout(() => {
        impactFlash.classList.remove('active');
      }, 350);
    }
  }

  /* ==========================================================================
     Hero Atmosphere (Saffron & Vapor Overlay)
     ========================================================================== */
  const heroParticles = [];
  const HERO_PARTICLE_COUNT = 24;

  function initHeroAtmosphere() {
    if (!heroAtmosphereCanvas || !heroAtmoCtx) return;
    const w = heroAtmosphereCanvas.width || window.innerWidth;
    const h = heroAtmosphereCanvas.height || window.innerHeight;

    heroParticles.length = 0;
    for (let i = 0; i < HERO_PARTICLE_COUNT; i++) {
      heroParticles.push({
        x: w * (0.3 + Math.random() * 0.4),
        y: h * (0.35 + Math.random() * 0.45),
        radius: (20 + Math.random() * 45) * dpr,
        vx: (Math.random() - 0.48) * 0.5 * dpr,
        vy: -(0.5 + Math.random() * 0.8) * dpr,
        maxAlpha: 0.05 + Math.random() * 0.06,
        life: Math.random() * 200,
        maxLife: 180 + Math.random() * 100,
        isSaffron: Math.random() < 0.3
      });
    }
  }

  function drawHeroAtmosphere() {
    if (!heroAtmosphereCanvas || !heroAtmoCtx) return;
    const w = heroAtmosphereCanvas.width;
    const h = heroAtmosphereCanvas.height;
    if (w === 0 || h === 0) return;

    heroAtmoCtx.clearRect(0, 0, w, h);

    for (let i = 0; i < heroParticles.length; i++) {
      const p = heroParticles[i];
      p.life++;
      p.x += p.vx + Math.sin(p.life * 0.03) * 0.4 * dpr;
      p.y += p.vy;
      p.radius += 0.15 * dpr;

      const prog = p.life / p.maxLife;
      let alpha = 0;
      if (prog < 0.3) {
        alpha = (prog / 0.3) * p.maxAlpha;
      } else {
        alpha = (1 - ((prog - 0.3) / 0.7)) * p.maxAlpha;
      }

      if (p.isSaffron) {
        heroAtmoCtx.fillStyle = `rgba(229, 169, 82, ${Math.max(0, alpha * 1.8)})`;
        heroAtmoCtx.beginPath();
        heroAtmoCtx.arc(p.x, p.y, (1.2 + Math.random() * 0.8) * dpr, 0, Math.PI * 2);
        heroAtmoCtx.fill();
      } else {
        const grad = heroAtmoCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(255, 245, 235, ${Math.max(0, alpha)})`);
        grad.addColorStop(0.6, `rgba(240, 220, 200, ${Math.max(0, alpha * 0.4)})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        heroAtmoCtx.fillStyle = grad;
        heroAtmoCtx.beginPath();
        heroAtmoCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        heroAtmoCtx.fill();
      }

      if (p.life >= p.maxLife || p.y < -40 * dpr) {
        p.x = w * (0.3 + Math.random() * 0.4);
        p.y = h * (0.45 + Math.random() * 0.35);
        p.radius = (15 + Math.random() * 30) * dpr;
        p.life = 0;
      }
    }
  }

  /* ==========================================================================
     About Section Steam Particles
     ========================================================================== */
  const steamParticles = [];
  const STEAM_COUNT = 28;

  function initSteamParticles() {
    if (!steamCanvas || !steamCtx) return;
    const w = steamCanvas.width || 300;
    const h = steamCanvas.height || 400;

    steamParticles.length = 0;
    for (let i = 0; i < STEAM_COUNT; i++) {
      steamParticles.push({
        x: w * (0.35 + Math.random() * 0.35),
        y: h * (0.45 + Math.random() * 0.4),
        radius: (12 + Math.random() * 24) * dpr,
        vx: (Math.random() - 0.48) * 0.6 * dpr,
        vy: -(0.8 + Math.random() * 1.2) * dpr,
        alpha: 0.05 + Math.random() * 0.2,
        maxAlpha: 0.18 + Math.random() * 0.18,
        life: Math.random() * 180,
        maxLife: 140 + Math.random() * 100,
        isSaffron: Math.random() < 0.25
      });
    }
  }

  function drawSteamParticles() {
    if (!steamCanvas || !steamCtx) return;
    const w = steamCanvas.width;
    const h = steamCanvas.height;
    if (w === 0 || h === 0) return;

    steamCtx.clearRect(0, 0, w, h);

    for (let i = 0; i < steamParticles.length; i++) {
      const p = steamParticles[i];
      p.life++;
      p.x += p.vx + Math.sin(p.life * 0.05) * 0.3 * dpr;
      p.y += p.vy;
      p.radius += 0.25 * dpr;

      const progress = p.life / p.maxLife;
      let currentAlpha = 0;

      if (progress < 0.3) {
        currentAlpha = (progress / 0.3) * p.maxAlpha;
      } else {
        currentAlpha = (1 - ((progress - 0.3) / 0.7)) * p.maxAlpha;
      }

      if (p.isSaffron) {
        steamCtx.fillStyle = `rgba(229, 169, 82, ${Math.max(0, currentAlpha * 1.5)})`;
        steamCtx.beginPath();
        steamCtx.arc(p.x, p.y, (1.5 + Math.random() * 1.2) * dpr, 0, Math.PI * 2);
        steamCtx.fill();
      } else {
        const gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, `rgba(255, 245, 235, ${Math.max(0, currentAlpha)})`);
        gradient.addColorStop(0.5, `rgba(240, 220, 200, ${Math.max(0, currentAlpha * 0.5)})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        steamCtx.fillStyle = gradient;
        steamCtx.beginPath();
        steamCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        steamCtx.fill();
      }

      if (p.life >= p.maxLife || p.y < -30 * dpr) {
        p.x = w * (0.35 + Math.random() * 0.35);
        p.y = h * (0.55 + Math.random() * 0.35);
        p.radius = (10 + Math.random() * 18) * dpr;
        p.life = 0;
      }
    }
  }

  /* ==========================================================================
     CINEMATIC AUDIO ENGINE (Universal Browser Autoplay / Zero Toggles)
     ========================================================================== */
  let audioCtx = null;
  let masterGain = null;
  let isAudioActive = false;

  function initCinematicAudio() {
    if (audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();

      // Master Gain Node for smooth fade-in
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      // Warm charcoal simmer buffer
      const bufferSize = audioCtx.sampleRate * 4;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        if (Math.random() < 0.005) {
          output[i] += (Math.random() * 0.3 - 0.15); // Delicate saffron crackle
        }
      }

      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      filter.Q.value = 1.2;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.value = 0.22;

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseNode.start(0);

      // Sub-bass warm palace drone (55Hz)
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, audioCtx.currentTime);
      oscGain.gain.value = 0.08;
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(0);

      if (audioCtx.state === 'running') {
        isAudioActive = true;
        masterGain.gain.setTargetAtTime(0.16, audioCtx.currentTime, 1.2);
      }
    } catch (e) {}
  }

  function unlockAudioOnInteraction() {
    if (!audioCtx) {
      initCinematicAudio();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        isAudioActive = true;
        if (masterGain) {
          masterGain.gain.setTargetAtTime(0.16, audioCtx.currentTime, 1.2);
        }
      }).catch(() => {});
    }
  }

  // Non-intrusive first interaction unlock (Zero toggles, zero UI prompts)
  const interactionEvents = ['scroll', 'wheel', 'touchstart', 'touchend', 'pointerdown', 'mousedown', 'mousemove', 'keydown'];
  interactionEvents.forEach(evt => {
    window.addEventListener(evt, unlockAudioOnInteraction, { once: true, passive: true });
  });

  // Attempt automatic startup immediately
  try {
    initCinematicAudio();
  } catch (e) {}

  function updateAudioVolume(progress) {
    if (!audioCtx || !masterGain || audioCtx.state !== 'running') return;
    try {
      let targetVol = 0.16;
      if (progress >= 0.75 && progress <= 0.98) {
        targetVol = 0.32; // Swell warmth during climax "DUM. DONE."
      } else if (progress > 0.98) {
        targetVol = 0.14; // Settle naturally into menu/about sections
      }
      masterGain.gain.setTargetAtTime(targetVol, audioCtx.currentTime, 0.3);
    } catch (e) {}
  }

  /* ==========================================================================
     Single Master Render Loop (Single requestAnimationFrame)
     ========================================================================== */
  let lastTimestamp = 0;

  function masterRenderLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
    lastTimestamp = timestamp;
    autoplayTime += dt;

    // 1. Ambient Cinematic Autoplay / Idle Motion
    if (!isUserScrolling) {
      if (rawScrollProgress < 0.04) {
        // Gentle cinematic slow-motion loop at top
        const topFrame = (Math.sin(autoplayTime * 0.8) * 0.5 + 0.5) * 35;
        targetFrameIndex = topFrame;
      } else if (rawScrollProgress <= 0.98) {
        // Subtle ambient breathing oscillation around current scroll anchor
        const scrollTarget = rawScrollProgress * (TOTAL_FRAMES - 1);
        targetFrameIndex = scrollTarget + Math.sin(autoplayTime * 1.6) * 1.2;
      }
    }

    // 2. Smooth Continuous Exponential Decay Interpolation
    const diff = targetFrameIndex - currentFrameIndex;
    if (Math.abs(diff) > 0.001) {
      const lerpFactor = 1 - Math.exp(-24 * dt);
      currentFrameIndex += diff * lerpFactor;

      if (Math.abs(targetFrameIndex - currentFrameIndex) < 0.005) {
        currentFrameIndex = targetFrameIndex;
      }
      needsCanvasRedraw = true;
    }

    // 3. Draw Hero Canvas Frame
    drawHeroCanvas();

    // 4. Draw Hero Atmosphere Particles
    drawHeroAtmosphere();

    // 5. Draw Signature Steam Particles
    drawSteamParticles();

    requestAnimationFrame(masterRenderLoop);
  }

  // Initialize Engine
  resizeCanvas();
  initFrames();
  initHeroAtmosphere();
  initSteamParticles();
  updateScroll();
  requestAnimationFrame(masterRenderLoop);

})();
