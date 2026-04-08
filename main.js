/* ═══════════════════════════════════════════════════════════
   FINCA MANZALA · main.js
   Developed by Zavage Studio · zavage.studio
   ═══════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── DOM REFS ─────────────────────────────────────────── */
  const progressBar  = document.getElementById('progress-bar');
  const header       = document.getElementById('site-header');
  const heroBg       = document.getElementById('hero-bg');
  const heroContent  = document.getElementById('hero-content');
  const scrollHint   = document.getElementById('scroll-hint');
  const pkgScroll    = document.getElementById('paquetes-scroll');
  const dots         = document.querySelectorAll('#paquetes-dots .dot');
  const form         = document.getElementById('cotizar-form');
  const submitBtn    = document.getElementById('submit-btn');


  /* ══════════════════════════════════════════════════════════
     1. SCROLL LISTENER — progress, header, parallax, hint
     ══════════════════════════════════════════════════════════ */
  let rafPending = false;

  function handleScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY;
      const docH     = document.documentElement.scrollHeight - window.innerHeight;

      /* Progress bar */
      progressBar.style.width = (docH > 0 ? scrolled / docH * 100 : 0) + '%';

      /* Header shrink */
      header.classList.toggle('scrolled', scrolled > 60);

      /* Hero parallax — only while hero visible */
      const heroH = heroContent ? heroContent.closest('section').offsetHeight : window.innerHeight;
      if (scrolled < heroH * 1.2) {
        if (heroBg)      heroBg.style.transform      = `translateY(${scrolled * 0.25}px)`;
        if (heroContent) heroContent.style.transform  = `translateY(${scrolled * 0.12}px)`;
        if (scrollHint)  scrollHint.style.opacity     = Math.max(0, 1 - scrolled / 200);
      }

      rafPending = false;
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load


  /* ══════════════════════════════════════════════════════════
     2. HERO STAGGER REVEAL
     ══════════════════════════════════════════════════════════ */
  if (heroContent) {
    const children = Array.from(heroContent.children);
    const delays   = [0, 160, 310, 470, 630, 790];
    children.forEach((el, i) => {
      setTimeout(() => el.classList.add('hero-visible'), delays[i] ?? 0);
    });
  }


  /* ══════════════════════════════════════════════════════════
     3. SCROLL REVEAL — IntersectionObserver
     ══════════════════════════════════════════════════════════ */
  const revealEls = document.querySelectorAll('.reveal-up');

  // Apply per-element delay from data-delay attribute
  revealEls.forEach(el => {
    const delay = parseInt(el.dataset.delay, 10) || 0;
    if (delay > 0) el.style.transitionDelay = delay + 'ms';
  });

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

  revealEls.forEach(el => revealObs.observe(el));


  /* ══════════════════════════════════════════════════════════
     4. ANIMATED COUNTERS — cubic ease-out via rAF
     ══════════════════════════════════════════════════════════ */
  function runCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1700;
    const startTs  = performance.now();

    function tick(now) {
      const elapsed  = now - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(tick);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.55 });

  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    counterObs.observe(el);
  });


  /* ══════════════════════════════════════════════════════════
     5. RIPPLE EFFECT — all .btn elements
     ══════════════════════════════════════════════════════════ */
  function spawnRipple(e) {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const x    = e.clientX - rect.left  - size / 2;
    const y    = e.clientY - rect.top   - size / 2;

    const el   = document.createElement('span');
    el.className = 'ripple';
    el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
    btn.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', spawnRipple);
  });


  /* ══════════════════════════════════════════════════════════
     6. PACKAGE DOTS — scroll detection + click navigation
     ══════════════════════════════════════════════════════════ */
  if (pkgScroll && dots.length) {

    function refreshDots() {
      // Skip on desktop where packages are in a grid
      if (window.innerWidth >= 900) return;

      const cards       = pkgScroll.querySelectorAll('.paquete-card');
      const ctrScroll   = pkgScroll.scrollLeft + pkgScroll.offsetWidth / 2;
      let closest = 0, minDist = Infinity;

      cards.forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - ctrScroll);
        if (dist < minDist) { minDist = dist; closest = i; }
      });

      dots.forEach((d, i) => d.classList.toggle('dot-active', i === closest));
    }

    pkgScroll.addEventListener('scroll', refreshDots, { passive: true });
    refreshDots();

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx   = parseInt(dot.dataset.index, 10);
        const cards = pkgScroll.querySelectorAll('.paquete-card');
        if (cards[idx]) {
          cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    });
  }


  /* ══════════════════════════════════════════════════════════
     7. FORM VALIDATION — shake on error, morph on success
     ══════════════════════════════════════════════════════════ */
  if (form && submitBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const required = form.querySelectorAll('[required]');
      let valid = true;

      required.forEach(field => {
        const group = field.closest('.form-group');
        if (!field.value.trim()) {
          valid = false;
          group.classList.remove('error');
          void group.offsetWidth;           // force reflow to restart animation
          group.classList.add('error');
          setTimeout(() => group.classList.remove('error'), 500);
        }
      });

      if (valid) {
        submitBtn.textContent = '✓ ¡Enviando a WhatsApp!';
        submitBtn.classList.add('is-sent');
        submitBtn.disabled = true;

        // Build WhatsApp message from form data
        const data   = new FormData(form);
        const fields = [
          ['Nombre',    data.get('nombre')],
          ['Teléfono',  data.get('telefono')],
          ['Evento',    data.get('tipo')],
          ['Invitados', data.get('invitados')],
          ['Fecha',     data.get('fecha')],
          ['Paquete',   data.get('paquete')],
          ['Mensaje',   data.get('mensaje')],
        ];
        const lines = [
          '🌿 *Solicitud de cotización — Finca Manzala*',
          '',
          ...fields
            .filter(([, v]) => v && v.trim())
            .map(([k, v]) => `*${k}:* ${v}`),
        ];
        const waNumber = '522227543116';
        const waText   = encodeURIComponent(lines.join('\n'));

        setTimeout(() => {
          window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank');
        }, 900);
      }
    });
  }


  /* ══════════════════════════════════════════════════════════
     8. INPUT LIFT — subtle translateY on focus (CSS handles it)
        We toggle a class so the parent <div> can also react.
     ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea')
    .forEach(field => {
      field.addEventListener('focus', () => field.closest('.form-group').classList.add('is-focused'));
      field.addEventListener('blur',  () => field.closest('.form-group').classList.remove('is-focused'));
    });


  /* ══════════════════════════════════════════════════════════
     9. CARD 3D TILT — desktop only (min-width 900px)
     ══════════════════════════════════════════════════════════ */
  function applyTilt() {
    if (window.innerWidth < 900) return;

    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect  = card.getBoundingClientRect();
        const normX = (e.clientX - rect.left)  / rect.width  - 0.5;
        const normY = (e.clientY - rect.top)   / rect.height - 0.5;
        card.style.transition = 'transform .1s ease, box-shadow .1s ease';
        card.style.transform  = `perspective(900px) rotateX(${-normY * 8}deg) rotateY(${normX * 8}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform .6s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow .35s ease';
        card.style.transform  = '';
      });
    });
  }

  applyTilt();
  // Re-apply after window resize crosses the breakpoint
  let prevW = window.innerWidth;
  window.addEventListener('resize', () => {
    if ((prevW < 900) !== (window.innerWidth < 900)) applyTilt();
    prevW = window.innerWidth;
  });


  /* ══════════════════════════════════════════════════════════
     10. SMOOTH ANCHOR SCROLL — offset for fixed header
     ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 18;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ══════════════════════════════════════════════════════════
     11. GALLERY CURSOR — ensure zoom-in cursor via JS as well
     ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.style.cursor = 'zoom-in';
  });


  /* ══════════════════════════════════════════════════════════
     12. LOGO HOVER SPRING — handled purely via CSS
         (.logo-sm:hover { transform: scale(1.07) rotate(-3deg) })
         Nothing needed in JS.
     ══════════════════════════════════════════════════════════ */

});
