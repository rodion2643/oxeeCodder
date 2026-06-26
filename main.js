(() => {
  'use strict';

  /* ===== THEME ===== */
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('oxe-theme') || 'ocean';
  html.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'ocean' ? 'void' : 'ocean';
    html.setAttribute('data-theme', next);
    localStorage.setItem('oxe-theme', next);
    flashTheme();
  });

  function flashTheme() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position:fixed;inset:0;z-index:9998;pointer-events:none;
      background:var(--accent);opacity:0.15;
      animation:themeFlash 0.5s ease forwards;
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes themeFlash{0%{opacity:0.2}100%{opacity:0}}';
    document.head.appendChild(style);
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  /* ===== INTERACTIVE GRID CANVAS ===== */
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');
  let mouse = { x: -9999, y: -9999 };
  let smoothMouse = { x: -9999, y: -9999 };
  const GRID = 48;
  const INFLUENCE = 120;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function getGridColor() {
    return getComputedStyle(html).getPropertyValue('--grid-color').trim();
  }

  function getAccentGlow() {
    return getComputedStyle(html).getPropertyValue('--grid-glow').trim();
  }

  function drawGrid() {
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cols = Math.ceil(canvas.width / GRID) + 1;
    const rows = Math.ceil(canvas.height / GRID) + 1;

    ctx.strokeStyle = getGridColor();
    ctx.lineWidth = 1;

    for (let i = 0; i <= cols; i++) {
      for (let j = 0; j <= rows; j++) {
        const bx = i * GRID;
        const by = j * GRID;
        const dx = smoothMouse.x - bx;
        const dy = smoothMouse.y - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let ox = 0, oy = 0;
        if (dist < INFLUENCE) {
          const force = (1 - dist / INFLUENCE) * 18;
          ox = (dx / dist) * force;
          oy = (dy / dist) * force;
        }
        const x = bx + ox;
        const y = by + oy;

        if (dist < INFLUENCE * 0.6) {
          ctx.beginPath();
          ctx.arc(x, y, 2 + (1 - dist / (INFLUENCE * 0.6)) * 3, 0, Math.PI * 2);
          ctx.fillStyle = getAccentGlow();
          ctx.fill();
        }
      }
    }

    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      for (let j = 0; j <= rows; j++) {
        const bx = i * GRID;
        const by = j * GRID;
        const dx = smoothMouse.x - bx;
        const dy = smoothMouse.y - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let ox = 0, oy = 0;
        if (dist < INFLUENCE) {
          const force = (1 - dist / INFLUENCE) * 18;
          ox = (dx / dist) * force;
          oy = (dy / dist) * force;
        }
        const x = bx + ox;
        const y = by + oy;
        j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (let j = 0; j <= rows; j++) {
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) {
        const bx = i * GRID;
        const by = j * GRID;
        const dx = smoothMouse.x - bx;
        const dy = smoothMouse.y - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let ox = 0, oy = 0;
        if (dist < INFLUENCE) {
          const force = (1 - dist / INFLUENCE) * 18;
          ox = (dx / dist) * force;
          oy = (dy / dist) * force;
        }
        const x = bx + ox;
        const y = by + oy;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    requestAnimationFrame(drawGrid);
  }
  drawGrid();

  /* ===== CUSTOM CURSOR ===== */
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  let cursorX = 0, cursorY = 0, ringX = 0, ringY = 0;

  if (window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      dot.style.left = cursorX + 'px';
      dot.style.top = cursorY + 'px';
    });

    function animateCursor() {
      ringX += (cursorX - ringX) * 0.12;
      ringY += (cursorY - ringY) * 0.12;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.querySelectorAll('a, button, [data-magnetic]').forEach((el) => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ===== MAGNETIC ELEMENTS ===== */
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  /* ===== 3D TILT ===== */
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });

  /* ===== TYPEWRITER ===== */
  const lines = [
    '> создаю лендинги...',
    '> правлю чужой код...',
    '> делаю формы заявок...',
    '> деплою на GitHub Pages...',
    '> готов к новому проекту ✓',
  ];
  const tw = document.getElementById('typewriter');
  let lineIdx = 0, charIdx = 0, deleting = false;

  function typeLoop() {
    const current = lines[lineIdx];
    if (!deleting) {
      tw.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) {
        deleting = true;
        setTimeout(typeLoop, 2000);
        return;
      }
    } else {
      tw.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        lineIdx = (lineIdx + 1) % lines.length;
      }
    }
    setTimeout(typeLoop, deleting ? 30 : 60);
  }
  typeLoop();

  /* ===== SCROLL REVEAL ===== */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));

  /* ===== COUNTER ANIMATION ===== */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let current = 0;
      const step = Math.ceil(target / 40);
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current;
      }, 30);
      obs.unobserve(el);
    }, { threshold: 0.5 });
    obs.observe(el);
  });

  /* ===== MODAL / REQUEST FORM ===== */
  const modal = document.getElementById('request-modal');
  const form = document.getElementById('request-form');
  const success = document.getElementById('form-success');
  const openBtns = [
    document.getElementById('fab-request'),
    document.getElementById('hero-request'),
    document.getElementById('pricing-request'),
  ];

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    form.hidden = false;
    success.hidden = true;
    form.reset();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtns.forEach((btn) => btn?.addEventListener('click', openModal));
  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.classList.add('loading');

    const data = Object.fromEntries(new FormData(form));
    const requests = JSON.parse(localStorage.getItem('oxe-requests') || '[]');
    requests.push({ ...data, date: new Date().toISOString() });
    localStorage.setItem('oxe-requests', JSON.stringify(requests));

    const text = [
      '🆕 Новая заявка с сайта',
      '',
      `👤 Имя: ${data.name}`,
      `📱 Telegram: ${data.telegram}`,
      `📋 Задача: ${data.task}`,
      data.budget ? `💰 Бюджет: ${data.budget}` : '',
    ].filter(Boolean).join('\n');

    const tgUrl = `https://t.me/oxe000?text=${encodeURIComponent(text)}`;

    await new Promise((r) => setTimeout(r, 800));
    btn.classList.remove('loading');

    form.hidden = true;
    success.hidden = false;

    setTimeout(() => {
      window.open(tgUrl, '_blank');
    }, 600);
  });

  /* ===== KONAMI EASTER EGG — neon rain ===== */
  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let konamiIdx = 0;

  document.addEventListener('keydown', (e) => {
    if (e.key === konami[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === konami.length) {
        konamiIdx = 0;
        neonRain();
      }
    } else {
      konamiIdx = 0;
    }
  });

  function neonRain() {
    const chars = '01<>{}[]/\\oxe';
    for (let i = 0; i < 40; i++) {
      const span = document.createElement('span');
      span.textContent = chars[Math.floor(Math.random() * chars.length)];
      span.style.cssText = `
        position:fixed;top:-20px;z-index:9997;pointer-events:none;
        font-family:'JetBrains Mono',monospace;font-size:${10 + Math.random() * 14}px;
        color:var(--accent);opacity:${0.4 + Math.random() * 0.6};
        left:${Math.random() * 100}vw;
        animation:rain ${2 + Math.random() * 3}s linear forwards;
        text-shadow:0 0 10px var(--accent-glow);
      `;
      document.body.appendChild(span);
      setTimeout(() => span.remove(), 5000);
    }
    if (!document.getElementById('rain-style')) {
      const s = document.createElement('style');
      s.id = 'rain-style';
      s.textContent = '@keyframes rain{to{transform:translateY(110vh) rotate(360deg);opacity:0}}';
      document.head.appendChild(s);
    }
  }
})();
