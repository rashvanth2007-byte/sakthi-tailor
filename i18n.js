// Sakthi Tailor & Garments - language switcher.
//
// English is written directly in the HTML. Every element with
// data-i18n="key" (text), data-i18n-aria="key" (aria-label) or
// data-i18n-ph="key" (placeholder) is translated from the packs in /lang.
// A pack is only downloaded when a visitor picks that language.

(function () {
  "use strict";

  var LANGS = [
    { code: "en", name: "English" },
    { code: "ta", name: "தமிழ்" },
    { code: "te", name: "తెలుగు" },
    { code: "ml", name: "മലയാളം" },
    { code: "kn", name: "ಕನ್ನಡ" },
    { code: "hi", name: "हिन्दी" },
    { code: "ur", name: "اردو", rtl: true }
  ];
  // Noto font per script, loaded on demand so English visitors download nothing extra
  var FONTS = {
    ta: "Noto+Sans+Tamil:wght@400;600",
    te: "Noto+Sans+Telugu:wght@400;600",
    ml: "Noto+Sans+Malayalam:wght@400;600",
    kn: "Noto+Sans+Kannada:wght@400;600",
    hi: "Noto+Sans+Devanagari:wght@400;600",
    ur: "Noto+Nastaliq+Urdu:wght@400;600"
  };
  var KEY = "sakthi_lang";
  var packs = window.SAKTHI_I18N = window.SAKTHI_I18N || {};
  var english = {};   // captured from the page itself, so English is never duplicated
  var current = "en";
  var listeners = [];

  function find(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }

  function store(code) { try { localStorage.setItem(KEY, code); } catch (e) { /* private mode */ } }
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  function captureEnglish() {
    each("[data-i18n]", function (el) { english[el.getAttribute("data-i18n")] = el.textContent; });
    each("[data-i18n-title]", function (el) { english[el.getAttribute("data-i18n-title")] = el.getAttribute("title"); });
    each("[data-i18n-aria]", function (el) { english[el.getAttribute("data-i18n-aria")] = english[el.getAttribute("data-i18n-aria")] || el.getAttribute("aria-label"); });
    each("[data-i18n-ph]", function (el) { english[el.getAttribute("data-i18n-ph")] = el.getAttribute("placeholder"); });
    each("[data-caption-key]", function (el) { english[el.getAttribute("data-caption-key")] = el.getAttribute("data-caption"); });
  }

  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }

  // Look up a key in the current language, falling back to English
  function t(key, fallback) {
    var pack = packs[current];
    if (pack && pack[key]) return pack[key];
    if (english[key]) return english[key];
    var en = packs.en;
    if (en && en[key]) return en[key];
    return fallback || key;
  }

  function apply() {
    var info = find(current) || LANGS[0];
    var html = document.documentElement;
    html.lang = current;
    html.dir = info.rtl ? "rtl" : "ltr";
    html.setAttribute("data-lang", current);

    each("[data-i18n]", function (el) {
      // textContent only: translations are never parsed as HTML
      el.textContent = t(el.getAttribute("data-i18n"));
      // Inside an English-only block (legal pages), mark translated bits with their real language
      var host = el.parentElement && el.parentElement.closest("[lang]");
      if (host && host !== html) el.setAttribute("lang", current);
    });
    each("[data-i18n-title]", function (el) { el.setAttribute("title", t(el.getAttribute("data-i18n-title"))); });
    each("[data-i18n-aria]", function (el) { el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))); });
    each("[data-i18n-ph]", function (el) { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    each("[data-caption-key]", function (el) { el.setAttribute("data-caption", t(el.getAttribute("data-caption-key"))); });
    each("[data-lang-select]", function (sel) { sel.value = current; });

    listeners.forEach(function (fn) { fn(current); });
  }

  function loadFont(code) {
    if (!FONTS[code] || document.getElementById("font-" + code)) return;
    var link = document.createElement("link");
    link.id = "font-" + code;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=" + FONTS[code] + "&display=swap";
    document.head.appendChild(link);
  }

  function loadPack(code, done) {
    if (code === "en" || packs[code]) { done(); return; }
    var s = document.createElement("script");
    s.src = "lang/" + code + ".js";
    s.onload = done;
    s.onerror = function () { done(); };
    document.head.appendChild(s);
  }

  var latest = null;
  function setLang(code, remember) {
    if (!find(code)) code = "en";
    latest = code;
    loadFont(code);
    loadPack(code, function () {
      if (code !== latest) return;                 // a newer choice was made meanwhile
      var ok = code === "en" || !!packs[code];
      current = ok ? code : "en";
      if (ok && remember) store(code);             // never remember a pack that failed to load
      apply();
    });
  }

  function buildPickers() {
    each("[data-lang-select]", function (sel) {
      LANGS.forEach(function (l) {
        var o = document.createElement("option");
        o.value = l.code;
        o.textContent = l.name;
        o.lang = l.code;
        sel.appendChild(o);
      });
      sel.value = current;
      sel.addEventListener("change", function () { setLang(sel.value, true); });
    });
  }

  function initialLang() {
    var fromUrl = (new URLSearchParams(window.location.search).get("lang") || "").toLowerCase();
    if (fromUrl && find(fromUrl)) { store(fromUrl); return fromUrl; }
    var saved = stored();
    if (saved && find(saved)) return saved;
    // First visit: match the browser's language if we have it
    var nav = (navigator.languages || [navigator.language || "en"]);
    for (var i = 0; i < nav.length; i++) {
      var c = String(nav[i]).slice(0, 2).toLowerCase();
      if (find(c)) return c;
    }
    return "en";
  }

  window.I18N = {
    t: t,
    set: function (code) { setLang(code, true); },
    current: function () { return current; },
    onChange: function (fn) { listeners.push(fn); }
  };

  document.addEventListener("DOMContentLoaded", function () {
    captureEnglish();
    buildPickers();
    var start = initialLang();
    if (start !== "en") setLang(start, false);
  });
})();
