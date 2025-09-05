/* ==========================================================================
   Bauen-like JS autoral — sem dependências
   ========================================================================== */
(function () {
  "use strict";

  const $  = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const throttle = (fn, wait = 100) => { let t = 0; return (...a) => { const n = performance.now(); if (n - t >= wait) { t = n; fn(...a); } }; };

  /* ---------- Preloader ---------- */
  function preloader() {
    const done = () => {
      $("#preloader")?.classList.add("isdone");
      $(".loading-text")?.classList.add("isdone");
      $(".loader-wrapper") && ($(".loader-wrapper").style.display = "none");
    };
    if (document.readyState === "complete") return done();
    window.addEventListener("load", done, { once: true });
    setTimeout(done, 1500);
  }

  /* ---------- Navbar: sticky + scrollspy ---------- */
  function navbar() {
    const nav = $(".navbar"); if (!nav) return;
    const links = $$(".main-menu a");
    const onScroll = throttle(() => {
      const y = window.scrollY;
      nav.classList.toggle("is-solid", y > 20);
      // scrollspy
      let current = null;
      document.querySelectorAll("section[id]").forEach((sec) => {
        const top = sec.offsetTop - (nav.offsetHeight || 0) - 12;
        if (y >= top) current = sec.id;
      });
      links.forEach((a) => a.classList.toggle("active", a.hash === "#" + current));
    }, 80);
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  function mobileMenu() {
    const toggle = $(".menu__toggle");
    const list = $("#menu-list");
    if (!toggle || !list) return;
    toggle.addEventListener("click", () => {
      const open = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- Slider clássico ---------- */
  function classicSlider() {
    const root = document.querySelector('[data-slider="classic"]');
    if (!root) return;
    const slides = $$(".slide", root);
    if (slides.length <= 1) return;

    let idx = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
    if (idx < 0) idx = 0;

    // dots
    let dots = $(".dots", root);
    if (!dots) { dots = document.createElement("div"); dots.className = "dots"; root.appendChild(dots); }
    dots.innerHTML = slides.map((_, i) => `<button aria-label="Slide ${i+1}" ${i===idx?"class='active'":""}></button>`).join("");
    const dotBtns = $$("button", dots);

    const show = (i) => {
      if (i === idx) return;
      slides[idx].classList.remove("is-active");
      idx = (i + slides.length) % slides.length;
      slides[idx].classList.add("is-active");
      dotBtns.forEach((b) => b.classList.remove("active"));
      dotBtns[idx].classList.add("active");
    };

    // autoplay
    const interval = parseInt(root.dataset.interval || "6000", 10);
    let timer = null;
    const play = () => { stop(); timer = setInterval(() => show(idx + 1), interval); };
    const stop = () => timer && (clearInterval(timer), (timer = null));
    play(); root.addEventListener("mouseenter", stop); root.addEventListener("mouseleave", play);

    // controls
    dotBtns.forEach((b, i) => b.addEventListener("click", () => { show(i); play(); }));
    $(".nav-prev")?.addEventListener("click", () => { show(idx - 1); play(); });
    $(".nav-next")?.addEventListener("click", () => { show(idx + 1); play(); });

    // teclado
    root.tabIndex = 0;
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft")  { show(idx - 1); play(); }
      if (e.key === "ArrowRight") { show(idx + 1); play(); }
    });

    // swipe
    let x0 = 0, y0 = 0, sw = false;
    root.addEventListener("touchstart", (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; sw = true; }, { passive:true });
    root.addEventListener("touchmove",  (e) => {
      if (!sw) return;
      const t = e.touches[0]; const dx = t.clientX - x0, dy = t.clientY - y0;
      if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) { sw = false; if (dx < 0) show(idx + 1); else show(idx - 1); play(); }
    }, { passive:true });
  }

  /* ---------- Lightbox (dialog nativo c/ iframe/img/video) ---------- */
  function lightbox() {
    const triggers = $$('a.lightbox, a.mfp-image, a.mfp-iframe, [data-lightbox]');
    if (!triggers.length) return;

    let dlg = $("#lightbox-dialog");
    if (!dlg) {
      dlg = document.createElement("dialog");
      dlg.id = "lightbox-dialog";
      dlg.innerHTML = `
        <div class="lb-wrap">
          <button class="lb-close" aria-label="Fechar">×</button>
          <div class="lb-content" role="document"></div>
          <button class="lb-prev" aria-label="Anterior">‹</button>
          <button class="lb-next" aria-label="Próximo">›</button>
        </div>`;
      document.body.appendChild(dlg);
    }
    const content = dlg.querySelector(".lb-content");
    const btnClose = dlg.querySelector(".lb-close");
    const btnPrev  = dlg.querySelector(".lb-prev");
    const btnNext  = dlg.querySelector(".lb-next");

    const items = triggers.map((a) => ({
      el: a,
      href: a.getAttribute("href") || a.dataset.src,
      type: a.classList.contains("mfp-iframe") ? "iframe" :
            (/\.(mp4|webm|ogg)$/i.test(a.href) ? "video" : "image")
    }));
    let idx = 0;

    const render = () => {
      content.innerHTML = "";
      const it = items[idx]; let node;
      if (it.type === "iframe") {
        node = document.createElement("iframe");
        node.src = it.href; node.width = "1280"; node.height = "720";
        node.allow = "autoplay; picture-in-picture; fullscreen";
      } else if (it.type === "video") {
        node = document.createElement("video"); node.src = it.href; node.controls = true; node.autoplay = true;
      } else {
        node = document.createElement("img"); node.src = it.href; node.alt = "";
      }
      content.appendChild(node);
    };
    const open  = (i) => { idx = i; !dlg.open && dlg.showModal(); render(); };
    const close = () => dlg.open && dlg.close();
    const next  = () => { idx = (idx + 1) % items.length; render(); };
    const prev  = () => { idx = (idx - 1 + items.length) % items.length; render(); };

    triggers.forEach((a, i) => a.addEventListener("click", (e) => { e.preventDefault(); open(i); }));
    btnClose.addEventListener("click", close); btnNext.addEventListener("click", next); btnPrev.addEventListener("click", prev);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
    window.addEventListener("keydown", (e) => { if (!dlg.open) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); });
  }

  /* ---------- Masonry + filtros ---------- */
  function masonryAndFilters() {
    const grid = $(".masonry, [data-grid]");
    if (!grid) return;
    const items = $$(".thum", grid);
    const filters = $$("[data-filter]");
    const apply = (f) => items.forEach((it) => {
      const cats = (it.dataset.cat || it.className).toLowerCase();
      it.style.display = (f === "all" || cats.includes(f)) ? "" : "none";
    });
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active"); apply((btn.dataset.filter || "all").toLowerCase());
      });
    });
  }

  /* ---------- Contadores ---------- */
  function counters() {
    const els = $$("[data-count]"); if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, to = parseFloat(el.dataset.count || "0"), dur = parseInt(el.dataset.duration || "1200", 10);
        const start = performance.now(); const from = parseFloat(el.dataset.from || "0"); const fmt = el.dataset.format || "int";
        const step = (t) => {
          const p = Math.max(0, Math.min(1, (t - start) / dur));
          const v = from + (to - from) * p;
          el.textContent = fmt === "float" ? v.toFixed(1) : Math.round(v).toString();
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step); obs.unobserve(el);
      });
    }, { threshold: .3 });
    els.forEach((el) => obs.observe(el));
  }

  /* ---------- Back-to-top com progresso ---------- */
  function backToTop() {
    const btn = $(".progress-wrap"); if (!btn) return;
    const update = throttle(() => {
      const h = document.documentElement;
      const scrolled = h.scrollTop || document.body.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      const p = Math.max(0, Math.min(1, scrolled / Math.max(1, height)));
      btn.style.background = `conic-gradient(var(--gold) ${p*360}deg, #121214 0)`;
      btn.style.opacity = scrolled > 200 ? "1" : "0";
      btn.style.pointerEvents = scrolled > 200 ? "auto" : "none";
    }, 40);
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    document.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Lazy-load ---------- */
  function lazy() {
    const imgs = $$("img[data-src], source[data-srcset]"); if (!imgs.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        if (el.tagName === "IMG" && el.dataset.src) { el.src = el.dataset.src; el.removeAttribute("data-src"); }
        else if (el.tagName === "SOURCE" && el.dataset.srcset) { el.srcset = el.dataset.srcset; el.removeAttribute("data-srcset"); }
        io.unobserve(el);
      });
    }, { rootMargin: "200px 0px" });
    imgs.forEach((el) => io.observe(el));
  }

  /* ---------- Forms (mock) ---------- */
  function ajaxForms() {
    $$("form[data-ajax], form.ajax").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = form.querySelector(".form__msg") || document.createElement("p");
        msg.classList.add("form__msg"); if (!msg.parentNode) form.appendChild(msg);
        msg.textContent = "Enviando…"; await new Promise((r) => setTimeout(r, 600));
        msg.textContent = "Mensagem enviada (demo). Conecte seu endpoint real."; form.reset();
      });
    });
  }

  function init(){
    preloader(); navbar(); mobileMenu();
    classicSlider(); lightbox(); masonryAndFilters();
    counters(); backToTop(); lazy();
    const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init, { once:true }) : init();
})();


/* ===== Navbar dropdowns + mobile toggle ===== */
(function(){
  const nav    = document.querySelector('.bn-navbar');
  if (!nav) return;

  const toggle = nav.querySelector('.bn-toggle');
  const menu   = nav.querySelector('#bn-menu');

  // Abre/fecha menu mobile
  if (toggle && menu){
    toggle.addEventListener('click', ()=>{
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Dropdowns: clique no mobile; desktop já abre no hover via CSS
  const items = nav.querySelectorAll('.has-drop');
  items.forEach(li=>{
    const btn = li.querySelector('.bn-drop__btn');
    if (!btn) return;

    btn.addEventListener('click', (e)=>{
      const isMobile = getComputedStyle(toggle).display !== 'none';
      if (!isMobile) return; // no desktop, hover já resolve
      e.preventDefault();
      const open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
})();


/* ===== NAVBAR – toggle mobile, dropdowns e sticky suave ===== */
(function(){
  const nav   = document.querySelector('.nav-bauen');
  if(!nav) return;

  const toggle = nav.querySelector('.nav-toggle');
  const menu   = nav.querySelector('#nav-menu');

  // Abre/fecha menu mobile
  toggle?.addEventListener('click', ()=>{
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Dropdowns no mobile (no desktop abre por :hover)
  nav.querySelectorAll('.has-drop').forEach(li=>{
    const btn = li.querySelector('.drop__btn');
    if(!btn) return;
    btn.addEventListener('click', (e)=>{
      const isMobile = getComputedStyle(toggle).display !== 'none';
      if(!isMobile) return;  // desktop deixa com hover via CSS
      e.preventDefault();
      const open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // Sticky: quando rolar, vira faixa sólida com transição suave
  const onScroll = () => {
    nav.classList.toggle('is-sticky', window.scrollY > 16);
  };
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();


