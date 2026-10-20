// Sakthi Tailor & Garments - site script
// Kept external (not inline) on purpose, so the site can use a strict
// Content-Security-Policy that blocks inline scripts.

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var WHATSAPP_NUMBER = SITE.whatsapp || "919789651814"; // country code + shop number, no spaces or +
  var CONSENT_KEY = "sakthi_cookie_choice";

  function t(key, fallback) {
    return window.I18N ? window.I18N.t(key, fallback) : fallback;
  }
  function onLang(fn) { if (window.I18N) window.I18N.onChange(fn); }

  function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { /* private mode */ } }

  function waLink(text) {
    return "https://wa.me/" + WHATSAPP_NUMBER + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  // Only ever allow real https links from config into href attributes
  function safeUrl(u) {
    return typeof u === "string" && /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : "";
  }

  // ---- Mobile menu ----
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;
    function close() {
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    }
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    // Header shadow once the page scrolls
    var header = document.querySelector(".site-nav");
    function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Fill contact details & social links from config.js ----
  function initSiteConfig() {
    var social = SITE.social || {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-social]"), function (a) {
      var kind = a.getAttribute("data-social");
      if (kind === "whatsapp") { a.href = waLink(t("wa.greeting", "Hi, I'd like to know more about your tailoring services.")); return; }
      var url = safeUrl(social[kind]);
      if (url) a.href = url;
    });

    var floatBtn = document.querySelector("[data-wa-float]");
    function refreshWa() {
      var link = waLink(t("wa.greeting", "Hi, I'd like to know more about your tailoring services."));
      if (floatBtn) floatBtn.href = link;
      Array.prototype.forEach.call(document.querySelectorAll('[data-social="whatsapp"]'), function (a) { a.href = link; });
    }
    refreshWa();
    onLang(refreshWa);

    Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  // ---- Branches + Google Maps (loaded only after consent) ----
  function initBranches() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".branch-card"));
    if (!cards.length) return;
    var branches = SITE.branches || [];
    var frame = document.getElementById("mapFrame");
    var consentBox = document.getElementById("mapConsent");
    var emptyBox = document.getElementById("mapEmpty");
    var loadBtn = document.getElementById("mapLoad");
    var remember = document.getElementById("mapRemember");
    var active = 0;
    var mapsAllowed = getConsent() === "accepted";

    function queryFor(b) { return b ? (b.mapQuery || b.address || "") : ""; }

    cards.forEach(function (card, i) {
      var b = branches[i] || {};
      // Real details replace the "to be added" text and stop being translated
      [["address", b.address], ["hours", b.hours]].forEach(function (pair) {
        var el = card.querySelector('[data-field="' + pair[0] + '"]');
        if (el && pair[1]) {
          el.removeAttribute("data-i18n");
          el.textContent = pair[1];
        }
      });
      var phone = card.querySelector('[data-field="phone"]');
      if (phone && b.phoneTel) {
        phone.href = "tel:" + b.phoneTel.replace(/[^\d+]/g, "");
        phone.textContent = b.phoneDisplay || b.phoneTel;
      }
      var dir = card.querySelector('[data-field="directions"]');
      if (dir) {
        var q = queryFor(b);
        if (q) dir.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
        else {
          // No address yet: turn "Directions" into an honest "Call" button
          dir.href = "tel:" + (b.phoneTel || SITE.phoneTel || "+919789651814").replace(/[^\d+]/g, "");
          dir.removeAttribute("target");
          var label = dir.querySelector("[data-i18n]");
          if (label) { label.setAttribute("data-i18n", "nav.call"); label.textContent = t("nav.call", "Call"); }
          var icon = dir.querySelector("use");
          if (icon) icon.setAttribute("href", "#i-phone");
        }
      }

      // The whole card is a mouse target; the "Show map" button is the keyboard/screen-reader control
      card.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        select(i);
      });
    });

    function render() {
      var q = queryFor(branches[active]);
      emptyBox.hidden = true;
      consentBox.hidden = true;
      frame.hidden = true;
      if (!q) { emptyBox.hidden = false; return; }
      if (!mapsAllowed) { consentBox.hidden = false; return; }
      var src = "https://www.google.com/maps?q=" + encodeURIComponent(q) + "&output=embed";
      if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
      frame.hidden = false;
    }

    function select(i) {
      active = i;
      cards.forEach(function (c, j) {
        var on = j === i;
        c.classList.toggle("is-active", on);
        var btn = c.querySelector("[data-show-map]");
        if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      render();
    }

    if (loadBtn) loadBtn.addEventListener("click", function () {
      mapsAllowed = true;
      if (remember && remember.checked) { setConsent("accepted"); hideBanner(); }
      render();
    });

    // The cookie banner can switch maps on or off for the whole site
    document.addEventListener("sakthi:consent", function (e) {
      mapsAllowed = e.detail === "accepted";
      if (!mapsAllowed) frame.removeAttribute("src");
      render();
    });

    select(0);
  }

  // ---- Order / booking form -> WhatsApp ----
  function initBookingForm() {
    var form = document.getElementById("orderForm");
    if (!form) return;

    // If a page links here with ?service=Training, preselect it.
    var params = new URLSearchParams(window.location.search);
    var presetService = params.get("service");
    var select = document.getElementById("cservice");
    if (presetService && select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === presetService) { select.selectedIndex = i; break; }
      }
    }

    // Today's date in the visitor's own time zone (toISOString would give the UTC date)
    var dateInput = document.getElementById("cdate");
    if (dateInput) {
      var now = new Date();
      dateInput.min = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nameEl = document.getElementById("cname");
      var phoneEl = document.getElementById("cphone");
      var name = nameEl.value.trim();
      var phone = phoneEl.value.trim();
      var serviceSel = document.getElementById("cservice");
      var branchSel = document.getElementById("cbranch");
      var message = document.getElementById("cmessage").value.trim();
      var date = dateInput ? dateInput.value : "";
      var statusEl = document.getElementById("form-status");

      nameEl.removeAttribute("aria-invalid");
      phoneEl.removeAttribute("aria-invalid");

      if (!name || !phone) {
        statusEl.textContent = t("form.errRequired", "Please enter your name and phone number.");
        statusEl.classList.add("is-error");
        (name ? phoneEl : nameEl).setAttribute("aria-invalid", "true");
        (name ? phoneEl : nameEl).focus();
        return;
      }

      var phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 13) {
        statusEl.textContent = t("form.errPhone", "Please enter a valid phone number (at least 10 digits).");
        statusEl.classList.add("is-error");
        phoneEl.setAttribute("aria-invalid", "true");
        phoneEl.focus();
        return;
      }
      statusEl.classList.remove("is-error");

      // Build the message safely. encodeURIComponent escapes everything,
      // so there is no way for typed text to break out of the URL or
      // run as a script - this is the whole XSS-safety story for a
      // form that only ever becomes a wa.me link, never gets rendered
      // back into the page as HTML. The option text shown to the visitor
      // (in their language) is sent, so the shop reads what they chose.
      var serviceText = serviceSel.options[serviceSel.selectedIndex].text;
      var branchText = branchSel ? branchSel.options[branchSel.selectedIndex].text : "";
      var inEnglish = !window.I18N || window.I18N.current() === "en";
      var lines = [
        t("wa.msgIntro", "New enquiry from the website:"),
        t("wa.msgName", "Name") + ": " + name,
        t("wa.msgPhone", "Phone") + ": " + phone,
        t("wa.msgService", "Service") + ": " + serviceText + (inEnglish ? "" : " (" + serviceSel.value + ")"),
        branchText ? t("wa.msgBranch", "Branch") + ": " + branchText : null,
        date ? t("wa.msgDate", "Needed by") + ": " + date : null,
        message ? t("wa.msgDetails", "Details") + ": " + message : null
      ].filter(Boolean);

      window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
      statusEl.textContent = t("form.opening", "Opening WhatsApp…");
    });
  }

  // ---- Consent banner (DPDP-aware: nothing non-essential loads before
  // consent; the only optional third party is the Google Maps embed) ----
  var banner;
  function hideBanner() { if (banner) banner.hidden = true; }
  function initConsent() {
    banner = document.getElementById("cookie-banner");
    if (!banner) return;

    if (!getConsent()) banner.hidden = false;

    function choose(v) {
      setConsent(v);
      hideBanner();
      document.dispatchEvent(new CustomEvent("sakthi:consent", { detail: v }));
    }
    var acceptBtn = document.getElementById("cookie-accept");
    var declineBtn = document.getElementById("cookie-decline");
    if (acceptBtn) acceptBtn.addEventListener("click", function () { choose("accepted"); });
    if (declineBtn) declineBtn.addEventListener("click", function () { choose("declined"); });

    Array.prototype.forEach.call(document.querySelectorAll("[data-open-consent]"), function (b) {
      b.addEventListener("click", function () { banner.hidden = false; (acceptBtn || banner).focus(); });
    });
  }

  // ---- Share button (native share sheet, falls back to copying the link) ----
  function initShare() {
    var btn = document.getElementById("shareBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var data = { title: document.title, text: t("soc.shareText", "Sakthi Tailor & Garments"), url: location.origin + location.pathname };
      if (navigator.share) {
        navigator.share(data).catch(function () { /* user closed the sheet */ });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(data.url).then(function () {
          var label = btn.querySelector("span");
          var old = label.textContent;
          label.textContent = t("soc.copied", "Link copied to clipboard");
          setTimeout(function () { label.textContent = old; }, 2200);
        });
      } else {
        window.open(waLink(data.text + " " + data.url).replace(WHATSAPP_NUMBER, ""), "_blank", "noopener,noreferrer");
      }
    });
  }

  // ---- Offline support (service worker) ----
  function initServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {
          // Fails silently on hosts that don't support it - the rest of the site still works.
        });
      });
    }
  }

  // ---- 3D tilt on category cards & training box ----
  function initTilt() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    if (reduceMotion || !finePointer) return;

    var tiltEls = document.querySelectorAll(".cat-card, .training-box");
    tiltEls.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var rotateX = ((y / rect.height) - 0.5) * -6;
        var rotateY = ((x / rect.width) - 0.5) * 6;
        el.style.transform = "rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  // ---- Scroll reveal ----
  function initScrollReveal() {
    var targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    targets.forEach(function (t) { observer.observe(t); });
  }

  // Shared helper for filter chips: toggles the pressed state within one group
  function pressChip(group, chip) {
    group.forEach(function (c) {
      var on = c === chip;
      c.classList.toggle("is-active", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  // ---- Services slider: filter chips, arrows, progress bar ----
  function initServiceSlider() {
    var track = document.getElementById("svcTrack");
    if (!track) return;
    var cards = Array.prototype.slice.call(track.querySelectorAll(".svc-card"));
    // Only the service chips - the gallery has its own (data-gfilter)
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var bar = document.getElementById("svcBar");
    var prev = document.getElementById("svcPrev");
    var next = document.getElementById("svcNext");

    function step() {
      var first = cards.filter(function (c) { return !c.hidden; })[0];
      return first ? first.getBoundingClientRect().width + 28 : 320;
    }
    function updateBar() {
      if (!bar) return;
      var max = track.scrollWidth - track.clientWidth;
      var visible = track.clientWidth / track.scrollWidth;
      var pct = Math.max(visible, 0.12) * 100;
      var left = max > 0 ? (Math.abs(track.scrollLeft) / max) * (100 - pct) : 0;
      bar.style.width = pct + "%";
      bar.style.marginLeft = left + "%";
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var f = tab.getAttribute("data-filter");
        pressChip(tabs, tab);
        cards.forEach(function (c) {
          var show = f === "all" || c.getAttribute("data-cat").split(" ").indexOf(f) !== -1;
          c.hidden = !show;
        });
        track.scrollTo({ left: 0 });
        updateBar();
      });
    });

    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    track.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
    updateBar();
    // No auto-advance: visitors scroll, swipe or use the arrows at their own pace
    // (moving content without a pause control fails WCAG 2.2.2 on touch screens).
  }

  // ---- Photo gallery: preview mosaic, full-screen "Show all" view, lightbox ----
  function initGallery() {
    var grid = document.getElementById("gGrid");
    if (!grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll(".g-item"));
    var pageTabs = Array.prototype.slice.call(document.querySelectorAll("[data-gfilter]"));
    var moreBtn = document.getElementById("gMore");
    var tour = document.getElementById("gTour");
    var tourGrid = document.getElementById("gTourGrid");
    var tourTabsWrap = document.getElementById("gTourTabs");
    var tourClose = document.getElementById("gTourClose");
    var lb = document.getElementById("lightbox");
    var lbImg = document.getElementById("lbImg");
    var lbCap = document.getElementById("lbCap");
    var filter = "all";
    var list = [];          // every photo in the current filter (used by the full view and the lightbox)
    var current = 0;        // lightbox position inside `list`
    var tourOpener = null;  // element to give focus back to when the full view closes
    var lbOpener = null;

    function inFilter(it) { return filter === "all" || it.getAttribute("data-cat") === filter; }

    // The 5 photos shown in the mosaic: hand-picked for "All", featured-first for each category
    function previewSet() {
      var pool = items.filter(inFilter);
      if (filter === "all") {
        var picked = pool.filter(function (it) { return it.hasAttribute("data-hero"); })
          .sort(function (a, b) { return a.getAttribute("data-hero") - b.getAttribute("data-hero"); });
        if (picked.length >= 5) return picked.slice(0, 5);
      }
      var feat = pool.filter(function (it) { return it.getAttribute("data-featured") === "1"; });
      var rest = pool.filter(function (it) { return it.getAttribute("data-featured") !== "1"; });
      return feat.concat(rest).slice(0, 5);
    }

    function applyPreview() {
      list = items.filter(inFilter);
      items.forEach(function (it) {
        it.hidden = true;
        it.className = "g-item";
        it.setAttribute("aria-label", t("ui.photoOf", "View photo") + ": " + (it.getAttribute("data-caption") || ""));
      });
      previewSet().forEach(function (it, i) {
        it.hidden = false;
        it.classList.add("m" + (i + 1));
        grid.appendChild(it); // keeps keyboard order the same as the visual order
      });
    }

    function buildTour() {
      tourGrid.innerHTML = "";
      list.forEach(function (it, i) {
        var src = it.querySelector("img");
        var b = document.createElement("button");
        b.type = "button";
        b.className = "g-tour-item";
        b.setAttribute("data-i", i);
        b.setAttribute("aria-label", t("ui.photoOf", "View photo") + ": " + (it.getAttribute("data-caption") || ""));
        var img = src.cloneNode();
        img.loading = "lazy";
        b.appendChild(img);
        tourGrid.appendChild(b);
      });
    }

    function syncScrollLock() {
      document.body.style.overflow = (!tour.hidden || !lb.hidden) ? "hidden" : "";
    }

    // ---- Filter chips (page + full view stay in sync) ----
    var tourTabs = pageTabs.map(function (tab) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "chip" + (tab.classList.contains("is-active") ? " is-active" : "");
      c.textContent = tab.textContent;
      c.setAttribute("data-tfilter", tab.getAttribute("data-gfilter"));
      c.setAttribute("aria-pressed", tab.classList.contains("is-active") ? "true" : "false");
      if (tab.hasAttribute("data-i18n")) c.setAttribute("data-i18n", tab.getAttribute("data-i18n"));
      tourTabsWrap.appendChild(c);
      return c;
    });

    function setFilter(f) {
      filter = f;
      pageTabs.concat(tourTabs).forEach(function (tab) {
        var on = (tab.getAttribute("data-gfilter") || tab.getAttribute("data-tfilter")) === f;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-pressed", on ? "true" : "false");
      });
      applyPreview();
      if (!tour.hidden) { buildTour(); tour.scrollTop = 0; }
    }
    pageTabs.forEach(function (tab) { tab.addEventListener("click", function () { setFilter(tab.getAttribute("data-gfilter")); }); });
    tourTabs.forEach(function (tab) { tab.addEventListener("click", function () { setFilter(tab.getAttribute("data-tfilter")); }); });

    // ---- Full-screen "Show all" view ----
    function openTour() {
      tourOpener = document.activeElement;
      buildTour();
      tour.hidden = false;
      tour.scrollTop = 0;
      syncScrollLock();
      tourClose.focus();
    }
    function closeTour() {
      tour.hidden = true;
      syncScrollLock();
      if (tourOpener && document.body.contains(tourOpener)) tourOpener.focus();
    }
    if (moreBtn) moreBtn.addEventListener("click", openTour);
    tourClose.addEventListener("click", closeTour);
    tourGrid.addEventListener("click", function (e) {
      var b = e.target.closest(".g-tour-item");
      if (b) openLightbox(parseInt(b.getAttribute("data-i"), 10));
    });

    // ---- Lightbox (sits on top of the full view; closing it returns you to the grid) ----
    function show(i) {
      if (!list.length) return;
      current = (i + list.length) % list.length;
      var it = list[current];
      var img = it.querySelector("img");
      lbImg.src = img.getAttribute("src");
      lbImg.alt = img.getAttribute("alt") || "";
      lbCap.textContent = it.getAttribute("data-caption") || "";
    }
    function openLightbox(i) {
      lbOpener = document.activeElement;
      show(i);
      lb.hidden = false;
      syncScrollLock();
      document.getElementById("lbClose").focus();
    }
    function closeLightbox() {
      lb.hidden = true;
      syncScrollLock();
      // Back to the exact thumbnail you were looking at, so the grid scrolls to it
      var target = !tour.hidden ? tourGrid.children[current] : lbOpener;
      if (target && document.body.contains(target)) target.focus();
    }
    items.forEach(function (it) {
      it.addEventListener("click", function () { openLightbox(list.indexOf(it)); });
    });
    document.getElementById("lbClose").addEventListener("click", closeLightbox);
    document.getElementById("lbPrev").addEventListener("click", function () { show(current - 1); });
    document.getElementById("lbNext").addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

    // Swipe left/right on phones
    var touchX = null;
    lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });

    function trapTab(e, box) {
      var f = Array.prototype.slice.call(box.querySelectorAll("button")).filter(function (b) { return b.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", function (e) {
      if (!lb.hidden) {
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowLeft") show(current - 1);
        else if (e.key === "ArrowRight") show(current + 1);
        else if (e.key === "Tab") trapTab(e, lb);
      } else if (!tour.hidden) {
        if (e.key === "Escape") closeTour();
        else if (e.key === "Tab") trapTab(e, tour);
      }
    });

    // Captions change language with the rest of the page
    onLang(function () { applyPreview(); if (!tour.hidden) buildTour(); });
    applyPreview();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initSiteConfig();
    initConsent();
    initBranches();
    initBookingForm();
    initShare();
    initServiceWorker();
    initTilt();
    initScrollReveal();
    initServiceSlider();
    initGallery();
  });
})();
