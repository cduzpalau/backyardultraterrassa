// Main client script for BYUT
// - Nav active state and smart header
// - i18n loading + application
// - Preregistration form submission
// - Hash navigation and back-to-top button

(function () {
  // Safe init after DOM is parsed
  const ready = (fn) =>
    document.readyState !== "loading"
      ? fn()
      : document.addEventListener("DOMContentLoaded", fn);

  ready(async () => {
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
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
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
        try { positionLangSwitcher(); } catch (_) {}
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
      { passive: true }
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
      document.getElementById("status-text").textContent = t("wip");
      document.getElementById("std-text").textContent = t("saveDate");
      document.getElementById("nav-home").textContent = t("nav.home");
      document.getElementById("nav-format").textContent = t("nav.format");
      document.getElementById("nav-course").textContent = t("nav.course");
      document.getElementById("nav-location").textContent = t("nav.location");
      document.getElementById("nav-faq").textContent = t("nav.faq");
      document.getElementById("nav-preregister").textContent = t(
        "nav.preregister"
      );
      document.getElementById("about-title").textContent = t("about.title");
      document.getElementById("about-text").textContent = t("about.text");
      document.getElementById("about-link-prefix").textContent = t(
        "about.linkPrefix"
      );
      document.getElementById("about-link").textContent = t("about.linkText");
      document.getElementById("format-title").textContent = t("format.title");
      const fl = document.getElementById("format-list");
      fl.innerHTML = points.map((p) => `<li>${p}</li>`).join("");
      document.getElementById("course-title").textContent = t("course.title");
      document.getElementById("course-stats").innerHTML = `${t(
        "course.distance"
      )}: <strong>6.7 km</strong> · ${t(
        "course.elevation"
      )}: <strong>102 m D+</strong>`;
      document.getElementById("course-links").innerHTML = `${t(
        "course.downloadGpx"
      )}: <a href="assets/BYUTv1.gpx" download>BYUTv1.gpx</a> · ${t(
        "course.viewOnStrava"
      )}: <a href="https://www.strava.com/routes/3400246284944316632" target="_blank" rel="noopener">${t(
        "course.route"
      )}</a>`;
      document.getElementById("location-title").textContent = t(
        "location.title"
      );
      document.getElementById("location-text").textContent = t(
        "location.text"
      );
      document.getElementById("faq-title").textContent = t("faq.title");
      document.getElementById("faq-text").innerHTML = `${t(
        "faq.textPrefix"
      )} <a href="https://www.instagram.com/backyardultraterrassa/" target="_blank" rel="noopener">${t(
        "faq.instagram"
      )}</a>.`;
      document.getElementById("prereg-title").textContent = t("form.title");
      document.getElementById("form-subtle").textContent = t("form.subtle");
      document.getElementById("label-firstName").textContent = t(
        "labels.firstName"
      );
      document.getElementById("label-lastName").textContent = t(
        "labels.lastName"
      );
      document.getElementById("label-email").textContent = t("labels.email");
      document.getElementById("label-captcha").textContent = t(
        "labels.captcha"
      );
      document.getElementById("label-consent").textContent = t(
        "consent.label"
      );
      document.getElementById("submit-btn").textContent = t("actions.submit");
      document.getElementById("register-another-btn").textContent = t(
        "actions.registerAnother"
      );
      document.getElementById("tooltip-text").textContent = t("tooltip.text");
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

    // ===== Preregistration form logic =====
    const GOOGLE_APPS_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbwfFER8-DY0dJJ-HEn35BiqZ3bURLoXdmIybdluH7NKGpDLct4kkhS1GD6UFMdDH687nQ/exec";

    const form = document.getElementById("prereg-form");
    const submitBtn = document.getElementById("submit-btn");
    const errorBox = document.getElementById("form-error");
    const statusText = document.getElementById("submit-status");
    const successCard = document.getElementById("prereg-success");
    const preregCard = document.getElementById("prereg-card");
    const successTitle = document.getElementById("success-title");
    const successMessage = document.getElementById("success-message");
    const successSummary = document.getElementById("success-summary");
    const registerAnotherBtn = document.getElementById("register-another-btn");

    function showError(msg) {
      if (!errorBox) return;
      errorBox.style.display = "block";
      errorBox.textContent = msg;
    }
    function clearError() {
      if (!errorBox) return;
      errorBox.style.display = "none";
      errorBox.textContent = "";
    }
    function isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
      return re.test(String(email).trim());
    }
    function setSubmitting(submitting) {
      if (submitBtn) submitBtn.disabled = submitting;
      if (statusText)
        statusText.textContent = submitting ? t("status.submitting") : "";
    }
    function showSuccess({ firstName, lastName, email, duplicate = false }) {
      if (preregCard) preregCard.style.display = "none";
      if (successCard) successCard.style.display = "block";
      if (successTitle)
        successTitle.textContent = duplicate
          ? t("success.duplicateTitle")
          : t("success.title");
      if (successMessage)
        successMessage.textContent = duplicate
          ? t("success.duplicateMessage")
          : t("success.message");
      if (successSummary) {
        const parts = [firstName, lastName, email].filter(Boolean);
        successSummary.textContent = `${t("summary.label")} ${parts.join(
          " · "
        )}`;
      }
    }

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearError();

      const firstName = document.getElementById("firstName")?.value?.trim() || "";
      const lastName = document.getElementById("lastName")?.value?.trim() || "";
      const email = document.getElementById("email")?.value?.trim() || "";
      const consent = Boolean(document.getElementById("consent")?.checked);

      if (!firstName || !lastName || !email) {
        showError(t("errors.completeAllFields"));
        return;
      }
      if (!isValidEmail(email)) {
        showError(t("errors.invalidEmail"));
        return;
      }
      if (!consent) {
        showError(t("errors.mustGrantPermission"));
        return;
      }
      if (!GOOGLE_APPS_SCRIPT_URL) {
        showError(t("errors.endpointMissing"));
        return;
      }

      setSubmitting(true);
      try {
        const captchaToken =
          typeof grecaptcha !== "undefined" && grecaptcha
            ? grecaptcha.getResponse()
            : "";
        if (!captchaToken) {
          showError(t("errors.captchaRequired"));
          return;
        }

        const body = new URLSearchParams({
          firstName,
          lastName,
          email,
          lang: currentLang,
          captcha: captchaToken,
        });
        const resp = await fetch(GOOGLE_APPS_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body,
        });
        if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
        const data = await resp.json().catch(() => ({}));
        if (data && data.success === true) {
          showSuccess({ firstName, lastName, email, duplicate: false });
        } else if (data && data.error === "duplicate_email") {
          showSuccess({ firstName, lastName, email, duplicate: true });
        } else if (data && data.error === "captcha_failed") {
          showError(t("errors.captchaFailed"));
        } else if (data && typeof data.error === "string") {
          showError(data.error);
        } else {
          showError(t("errors.genericSubmitProblem"));
        }
      } catch (err) {
        console.error(err);
        showError(t("errors.genericSubmitProblem"));
      } finally {
        setSubmitting(false);
        try {
          if (typeof grecaptcha !== "undefined" && grecaptcha) grecaptcha.reset();
        } catch (_) {}
      }
    });

    registerAnotherBtn?.addEventListener("click", () => {
      try {
        form?.reset();
      } catch (_) {}
      clearError();
      if (statusText) statusText.textContent = "";
      if (successCard) successCard.style.display = "none";
      if (preregCard) preregCard.style.display = "block";
      try {
        if (typeof grecaptcha !== "undefined" && grecaptcha) grecaptcha.reset();
      } catch (_) {}
      document.getElementById("firstName")?.focus();
    });

    // ===== Hash navigation (smooth on older browsers) =====
    window.addEventListener("hashchange", () => {
      const target = document.querySelector(location.hash || "#home");
      if (target)
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // ===== Back-to-top button =====
    const toTopBtn = document.getElementById("to-top");
    const showAt = 120;
    const toggleTop = () => {
      if (window.scrollY > showAt) toTopBtn.classList.add("show");
      else toTopBtn.classList.remove("show");
    };
    window.addEventListener("scroll", toggleTop, { passive: true });
    window.addEventListener("load", () => { toggleTop(); positionLangSwitcher(); });
    window.addEventListener("resize", () => { try { positionLangSwitcher(); } catch (_) {} }, { passive: true });
    toTopBtn?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  });
})();
