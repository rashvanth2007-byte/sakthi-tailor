// Sakthi Tailor & Garments - site script
// Kept external (not inline) on purpose, so the site can use a strict
// Content-Security-Policy that blocks inline scripts.

(function () {
  "use strict";

  var WHATSAPP_NUMBER = "919789651814"; // country code + shop number, no spaces or +

  // ---- Order / booking form -> WhatsApp ----
  function initBookingForm() {
    var form = document.getElementById("orderForm");
    if (!form) return;

    // If a page links here with ?service=Training, preselect it.
    var params = new URLSearchParams(window.location.search);
    var presetService = params.get("service");
    if (presetService) {
      var select = document.getElementById("cservice");
      if (select) {
        for (var i = 0; i < select.options.length; i++) {
          if (select.options[i].value === presetService) {
            select.selectedIndex = i;
            break;
          }
        }
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = document.getElementById("cname").value.trim();
      var phone = document.getElementById("cphone").value.trim();
      var service = document.getElementById("cservice").value;
      var message = document.getElementById("cmessage").value.trim();
      var statusEl = document.getElementById("form-status");

      if (!name || !phone) {
        if (statusEl) statusEl.textContent = "Please enter your name and phone number.";
        return;
      }

      var phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        if (statusEl) statusEl.textContent = "Please enter a valid phone number.";
        return;
      }

      // Build the message safely. encodeURIComponent escapes everything,
      // so there is no way for typed text to break out of the URL or
      // run as a script - this is the whole XSS-safety story for a
      // form that only ever becomes a wa.me link, never gets rendered
      // back into the page as HTML.
      var lines = [
        "New enquiry from the website:",
        "Name: " + name,
        "Phone: " + phone,
        "Service: " + service,
        message ? "Details: " + message : null
      ].filter(Boolean);

      var text = encodeURIComponent(lines.join("\n"));
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text;

      window.open(url, "_blank", "noopener,noreferrer");
      if (statusEl) statusEl.textContent = "Opening WhatsApp...";
    });
  }

  // ---- Cookie consent (DPDP-aware: no non-essential cookies are set
  // before consent; this site currently sets none at all beyond this
  // preference flag) ----
  function initCookieBanner() {
    var banner = document.getElementById("cookie-banner");
    if (!banner) return;

    var KEY = "sakthi_cookie_choice";
    var choice = localStorage.getItem(KEY);

    if (!choice) {
      banner.style.display = "flex";
    }

    var acceptBtn = document.getElementById("cookie-accept");
    var declineBtn = document.getElementById("cookie-decline");

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        localStorage.setItem(KEY, "accepted");
        banner.style.display = "none";
      });
    }
    if (declineBtn) {
      declineBtn.addEventListener("click", function () {
        localStorage.setItem(KEY, "declined");
        banner.style.display = "none";
      });
    }
  }

  // ---- Offline support (service worker) ----
  function initServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").catch(function () {
          // Fails silently on hosts that don't support it (e.g. local
          // file:// preview) - the rest of the site still works.
        });
      });
    }
  }

  // ---- 3D tilt on category cards & training box ----
  function initTilt() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var tiltEls = document.querySelectorAll(".cat-card, .training-box");
    tiltEls.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var rotateX = ((y / rect.height) - 0.5) * -8;
        var rotateY = ((x / rect.width) - 0.5) * 8;
        el.style.transform = "rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  // ---- Scroll reveal for full-screen panel sections ----
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
    }, { threshold: 0.15 });

    targets.forEach(function (t) { observer.observe(t); });
  }


  // ---- Services slider: filter tabs, arrows, progress bar ----
  function initServiceSlider() {
    var track = document.getElementById("svcTrack");
    if (!track) return;
    var cards = Array.prototype.slice.call(track.querySelectorAll(".svc-card"));
    var tabs = document.querySelectorAll(".svc-tab");
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
      var left = max > 0 ? (track.scrollLeft / max) * (100 - pct) : 0;
      bar.style.width = pct + "%";
      bar.style.marginLeft = left + "%";
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var f = tab.getAttribute("data-filter");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", on ? "true" : "false");
        });
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

    // ---- Auto-advance: moves one card every few seconds, loops back at the end ----
    var AUTO_DELAY = 3500;
    var timer = null;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function autoStep() {
      var max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      if (track.scrollLeft >= max - 4) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        track.scrollBy({ left: step(), behavior: "smooth" });
      }
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    function startAuto() {
      if (reduceMotion) return;
      stopAuto();
      timer = setInterval(autoStep, AUTO_DELAY);
    }

    // Pause while the visitor is interacting, resume afterwards
    track.addEventListener("mouseenter", stopAuto);
    track.addEventListener("mouseleave", startAuto);
    track.addEventListener("focusin", stopAuto);
    track.addEventListener("focusout", startAuto);
    track.addEventListener("touchstart", stopAuto, { passive: true });
    track.addEventListener("touchend", function () { setTimeout(startAuto, 4000); }, { passive: true });
    [prev, next].forEach(function (b) {
      if (b) b.addEventListener("click", startAuto); // restart the countdown after a manual click
    });
    tabs.forEach(function (t) { t.addEventListener("click", startAuto); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto(); else startAuto();
    });
    startAuto();
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
        b.setAttribute("aria-label", "View photo: " + (it.getAttribute("data-caption") || ""));
        var img = src.cloneNode();
        img.loading = "lazy";
        b.appendChild(img);
        tourGrid.appendChild(b);
      });
    }

    function syncScrollLock() {
      document.body.style.overflow = (!tour.hidden || !lb.hidden) ? "hidden" : "";
    }

    // ---- Filter tabs (page + full view stay in sync) ----
    var tourTabs = pageTabs.map(function (t) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "svc-tab" + (t.classList.contains("is-active") ? " is-active" : "");
      c.textContent = t.textContent;
      c.setAttribute("data-tfilter", t.getAttribute("data-gfilter"));
      c.setAttribute("role", "tab");
      c.setAttribute("aria-selected", t.classList.contains("is-active") ? "true" : "false");
      tourTabsWrap.appendChild(c);
      return c;
    });

    function setFilter(f) {
      filter = f;
      pageTabs.concat(tourTabs).forEach(function (t) {
        var on = (t.getAttribute("data-gfilter") || t.getAttribute("data-tfilter")) === f;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      applyPreview();
      if (!tour.hidden) { buildTour(); tour.scrollTop = 0; }
    }
    pageTabs.forEach(function (t) { t.addEventListener("click", function () { setFilter(t.getAttribute("data-gfilter")); }); });
    tourTabs.forEach(function (t) { t.addEventListener("click", function () { setFilter(t.getAttribute("data-tfilter")); }); });

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

    applyPreview();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBookingForm();
    initCookieBanner();
    initServiceWorker();
    initTilt();
    initScrollReveal();
    initServiceSlider();
    initGallery();
  });
})();
