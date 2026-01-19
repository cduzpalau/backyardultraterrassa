// Main client script for BYUT
// - Nav active state and smart header
// - i18n loading + application
// - Hash navigation and back-to-top button

(function () {
  // Safe init after DOM is parsed
  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  ready(async () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let newsPulseTimer = null;

    // ===== Nav highlight on scroll =====
    const nav = document.querySelector(".nav");
    const navLinks = Array.from(document.querySelectorAll(".nav a"));
    const sections = navLinks
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = "#" + entry.target.id;
          const link = navLinks.find((a) => a.getAttribute("href") === id);
          if (link) {
            if (entry.isIntersecting) {
              navLinks.forEach((l) => l.classList.remove("active"));
              link.classList.add("active");
            }
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 },
    );
    sections.forEach((sec) => observer.observe(sec));

    // ===== Smart header hide/show on scroll =====
    let lastY = window.scrollY;
    let ticking = false;
    const hideThreshold = 10;
    const minY = 150;
    function onScrollSmart() {
      const y = window.scrollY;
      const diff = y - lastY;
      if (Math.abs(diff) > hideThreshold) {
        if (diff > 0 && y > minY) nav.classList.add("nav--hidden");
        else nav.classList.remove("nav--hidden");
        lastY = y;
        try {
          positionLangSwitcher();
        } catch (_) {}
      }
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(onScrollSmart);
          ticking = true;
        }
      },
      { passive: true },
    );

    // ===== i18n support =====
    const I18N_KEY = "byut_lang";
    const langSelect = document.getElementById("lang-select");
    const langSwitcher = document.querySelector(".lang-switcher");
    let currentLang = localStorage.getItem(I18N_KEY) || "ca";
    let i18n = {};

    async function loadTranslations() {
      try {
        const resp = await fetch("assets/i18n.json", { cache: "no-cache" });
        if (!resp.ok) throw new Error("i18n fetch failed");
        i18n = await resp.json();
      } catch (e) {
        console.error("Failed to load translations:", e);
        i18n = { ca: {}, es: {}, en: {} };
      }
    }

    function t(path) {
      const parts = path.split(".");
      let obj = (i18n && i18n[currentLang]) || (i18n && i18n.ca) || {};
      for (const p of parts) {
        obj = obj?.[p];
        if (obj === undefined) return path;
      }
      return obj;
    }

    function applyI18n() {
      const points = i18n[currentLang]?.format?.points || [];
      document.getElementById("nav-home").textContent = t("nav.home");
      document.getElementById("nav-format").textContent = t("nav.format");
      document.getElementById("nav-course").textContent = t("nav.course");
      document.getElementById("nav-location").textContent = t("nav.location");
      document.getElementById("nav-faq").textContent = t("nav.faq");
      document.getElementById("nav-preregister").textContent =
        t("nav.preregister");
      document.getElementById("about-title").textContent = t("about.title");
      document.getElementById("about-text").textContent = t("about.text");
      document.getElementById("about-link-prefix").textContent =
        t("about.linkPrefix");
      document.getElementById("about-link").textContent = t("about.linkText");
      document.getElementById("format-title").textContent = t("format.title");
      const fl = document.getElementById("format-list");
      fl.innerHTML = points.map((p) => `<li>${p}</li>`).join("");
      document.getElementById("course-title").textContent = t("course.title");
      document.getElementById("course-stats").innerHTML =
        `${t("course.distance")}: <strong>6.7 km</strong> · ${t("course.elevation")}: <strong>103 m D+</strong>`;
      document.getElementById("course-links").innerHTML =
        `${t("course.downloadGpx")}: <a href="assets/BYUT2026.gpx" download>BYUT2026.gpx</a> · ${t("course.viewOnStrava")}: <a href="https://www.strava.com/routes/3421071549788322054" target="_blank" rel="noopener">${t("course.route")}</a>`;
      document.getElementById("location-title").textContent =
        t("location.title");
      document.getElementById("location-text").textContent = t("location.text");
      document.getElementById("faq-title").textContent = t("faq.title");
      document.getElementById("faq-text").innerHTML = `${t(
        "faq.textPrefix",
      )} <a href="https://www.instagram.com/backyardultraterrassa/" target="_blank" rel="noopener">${t(
        "faq.instagram",
      )}</a>.`;
      // News banner
      const newsEl = document.querySelector(".news-message");
      if (newsEl) {
        newsEl.innerHTML = `${t("news.message")}<br><a href="#" id="news-link" style="color: #ffd260; text-decoration: underline; font-weight: bold;">${t("news.link")}</a>`;
        attachModalEvents(); // Re-attach event because innerHTML replaced the element
      }
      document.getElementById("prereg-title").textContent = t("form.title");
      document.getElementById("form-subtle").textContent = t("form.subtle");
      document.getElementById("tooltip-text").textContent = t("tooltip.text");
      const registerBtn = document.getElementById("register-btn");
      if (registerBtn) {
        const ctaText = t("form.cta");
        registerBtn.textContent = ctaText;
        registerBtn.setAttribute("aria-label", ctaText);
        registerBtn.setAttribute("title", t("tooltip.text"));
      }
      // Modal content update
      document.getElementById("modal-title").textContent = t(
        "communication.title",
      );
      document.getElementById("modal-content").innerHTML =
        t("communication.body");
      document
        .getElementById("modal-close")
        .setAttribute("aria-label", t("communication.close"));
    }

    function syncLangUI() {
      if (langSelect && langSelect.value !== currentLang) {
        langSelect.value = currentLang;
      }
    }

    langSelect?.addEventListener("change", () => {
      const lang = langSelect.value;
      if (!lang || lang === currentLang) return;
      currentLang = lang;
      try {
        localStorage.setItem(I18N_KEY, currentLang);
      } catch (_) {}
      syncLangUI();
      applyI18n();
    });

    // Load translations then apply
    await loadTranslations();
    syncLangUI();
    applyI18n();

    // ===== Modal Logic =====
    const modalOverlay = document.getElementById("modal-overlay");
    const modalCloseBtn = document.getElementById("modal-close");

    function openModal(e) {
      if (e) e.preventDefault();
      modalOverlay.classList.add("open");
      modalOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    function closeModal() {
      modalOverlay.classList.remove("open");
      modalOverlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function attachModalEvents() {
      const newsLink = document.getElementById("news-link");
      if (newsLink) {
        newsLink.addEventListener("click", openModal);
      }
    }

    modalCloseBtn?.addEventListener("click", closeModal);
    modalOverlay?.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalOverlay.classList.contains("open")) {
        closeModal();
      }
    });

    // Blink/highlight the news banner at regular intervals
    function manageNewsPulse() {
      const messageEl = document.querySelector(".news-message");
      const bannerEl = document.querySelector(".news-banner");
      const navRegister = document.getElementById("nav-preregister");
      if (!messageEl) return;
      if (prefersReducedMotion.matches) {
        if (newsPulseTimer) {
          clearInterval(newsPulseTimer);
          newsPulseTimer = null;
        }
        messageEl.classList.remove("news-flash");
        bannerEl?.classList.remove("news-flash");
        navRegister?.classList.remove("nav-flash");
        return;
      }
      if (newsPulseTimer) return;
      newsPulseTimer = window.setInterval(() => {
        messageEl.classList.toggle("news-flash");
        bannerEl?.classList.toggle("news-flash");
        navRegister?.classList.toggle("nav-flash");
      }, 1100);
    }
    manageNewsPulse();
    prefersReducedMotion.addEventListener("change", () => {
      if (newsPulseTimer) {
        clearInterval(newsPulseTimer);
        newsPulseTimer = null;
      }
      manageNewsPulse();
    });

    // Position language switcher just below the nav
    function positionLangSwitcher() {
      if (!langSwitcher || !nav) return;
      const hidden = nav.classList.contains("nav--hidden");
      const top = hidden ? 8 : (nav.offsetHeight || 48) + 8;
      langSwitcher.style.top = `${top}px`;
      // Mirror nav hide/show animation
      langSwitcher.classList.toggle("nav--hidden", hidden);
    }
    positionLangSwitcher();

    // Preregistration form logic removed

    // ===== Hash navigation (smooth on older browsers) =====
    window.addEventListener("hashchange", () => {
      const target = document.querySelector(location.hash || "#home");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ===== Back-to-top button =====
    const toTopBtn = document.getElementById("to-top");
    const showAt = 120;
    const toggleTop = () => {
      if (window.scrollY > showAt) toTopBtn.classList.add("show");
      else toTopBtn.classList.remove("show");
    };
    window.addEventListener("scroll", toggleTop, { passive: true });
    window.addEventListener("load", () => {
      toggleTop();
      positionLangSwitcher();
    });
    window.addEventListener(
      "resize",
      () => {
        try {
          positionLangSwitcher();
        } catch (_) {}
      },
      { passive: true },
    );
    toTopBtn?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }),
    );
  });
})();
