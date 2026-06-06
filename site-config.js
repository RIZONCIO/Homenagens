(function () {
  const STORAGE_KEY = "homenagem_config_v1";
  const EMPTY_IMAGE =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const MAX_SLIDES = 50;
  const DEFAULT_SLIDES = [
    {
      src: "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=1200&q=80",
      caption: "Antes de cuidar de todos… você também era filha.",
    },
    {
      src: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=1200&q=80",
      caption: "Seu primeiro grande amor.",
    },
    {
      src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
      caption: "E o amor só crescia mais.",
    },
    {
      src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80",
      caption: "Seu mundo inteiro em uma só foto.",
    },
    {
      src: "https://images.unsplash.com/photo-1484820540004-14229fe36ca4?auto=format&fit=crop&w=1200&q=80",
      caption: "Mais um momento guardado com carinho.",
    },
    {
      src: "https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?auto=format&fit=crop&w=1200&q=80",
      caption: "Dias simples… que viraram memórias eternas.",
    },
    {
      src: "https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=1200&q=80",
      caption: "A espera mais ansiosa do mundo… minha chegada.",
    },
    {
      src: "https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=1200&q=80",
      caption: "Seu colo sempre foi meu lugar favorito.",
    },
    {
      src: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=80",
      caption: "Alguns dos melhores momentos eram simples assim.",
    },
    {
      src: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=1200&q=80",
      caption: "No fim das contas… família sempre foi nosso maior presente.",
    },
  ];

  const DEFAULTS = {
    pageTitle: "Para Você, Mãe — Uma Viagem no Tempo",
    pageDescription: "Uma homenagem cinematográfica para o Dia das Mães.",
    birthday: { day: 3, month: 8, year: 1985 },

    texts: {
      finalQuoteLine1: "O tempo passa…",
      finalQuoteLine2: "mas alguns momentos permanecem eternos.",
      finalTitle: "Feliz Dia das Mães",
      finalMessage:
        "Mãe…\n\nobrigado por cada momento.\n\nPor cada cuidado.\n\nPor nunca desistir de nós.\n\nNós te amamos.",
    },
    textFonts: {
      finalQuoteLine1: "",
      finalQuoteLine2: "",
      finalTitle: "",
      finalMessage: "",
    },
    slides: DEFAULT_SLIDES,
    theme: {
      bg: "#07060a",
      bgSoft: "#0f0d14",
      ink: "#f5f1ea",
      rose: "#f3c7d1",
      gold: "#d9b46a",
      fontDisplay: "Cormorant Garamond, serif",
      fontMono: "Share Tech Mono, monospace",
    },
  };

  function deepMerge(a, b) {
    if (Array.isArray(b)) return b.slice();
    if (b && typeof b === "object") {
      const out = { ...a };
      for (const k of Object.keys(b)) out[k] = deepMerge(a?.[k], b[k]);
      return out;
    }
    return b === undefined ? a : b;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
      return deepMerge(DEFAULTS, JSON.parse(raw));
    } catch (err) {
      console.error("Erro ao carregar configuração:", err);
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  function save(cfg) {
    const clean = {
      ...cfg,
      slides: (cfg.slides || []).map((slide) =>
        window.ImageStore
          ? window.ImageStore.cleanSlideForStorage(slide)
          : { ...slide, previewUrl: undefined, objectUrl: undefined },
      ),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    window.ImageStore?.clear?.();
  }

  function applyTheme(cfg) {
    const r = document.documentElement;
    const t = cfg.theme || {};
    if (t.bg) r.style.setProperty("--bg", t.bg);
    if (t.bgSoft) r.style.setProperty("--bg-soft", t.bgSoft);
    if (t.ink) r.style.setProperty("--ink", t.ink);
    if (t.rose) r.style.setProperty("--rose", t.rose);
    if (t.gold) r.style.setProperty("--gold", t.gold);
    if (t.fontDisplay) r.style.setProperty("--font-display", t.fontDisplay);
    if (t.fontMono) r.style.setProperty("--font-mono", t.fontMono);
  }

  function applyTexts(cfg) {
    document.title = cfg.pageTitle || document.title;
    const fonts = cfg.textFonts || {};
    document.querySelectorAll("[data-edit]").forEach((el) => {
      const key = el.dataset.edit;
      const val = cfg.texts?.[key];
      if (val !== undefined) el.textContent = val;
      const f = fonts[key];
      el.style.fontFamily = f ? f : "";
    });
  }

  function renderSlides(cfg) {
    const wrap = document.getElementById("slideshowWrap");
    if (!wrap) return;
    // Remove slides existentes (mantém legenda)
    wrap.querySelectorAll(".slide").forEach((s) => s.remove());
    const caption = document.getElementById("slideCaption");
    (cfg.slides || []).forEach((s, i) => {
      const src = s.src || EMPTY_IMAGE;
      const bg = s.src ? `--img: url('${escapeCSSUrl(s.src)}')` : "";
      const div = document.createElement("div");
      div.className = "slide";
      div.dataset.caption = s.caption || "";
      if (s.imageId) div.dataset.imageId = s.imageId;
      div.innerHTML = `
        <div class="slide-photo" style="${bg}">
          <img src="${src}" alt="${(s.caption || "").replace(/"/g, "&quot;")}" loading="${i < 2 ? "eager" : "lazy"}" />
        </div>`;
      wrap.insertBefore(div, caption);
      if (s.imageId && window.ImageStore) {
        const photo = div.querySelector(".slide-photo");
        const img = div.querySelector("img");
        window.ImageStore.hydrateElement(img, s.imageId, photo);
      }
    });
  }

  function escapeCSSUrl(url) {
    return url.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  function applyAll(cfg) {
    applyTheme(cfg);
    applyTexts(cfg);
    renderSlides(cfg);
  }

  window.SiteConfig = {
    DEFAULTS,
    STORAGE_KEY,
    MAX_SLIDES,
    load,
    save,
    reset,
    applyAll,
    applyTheme,
    applyTexts,
    renderSlides,
  };

  // Aplica tema/textos imediatamente (antes do script.js)
  const current = load();
  window.SiteConfig.current = current;
  // Aplica tema o quanto antes para evitar flash
  if (document.documentElement) applyTheme(current);
  document.addEventListener("DOMContentLoaded", () => {
    applyTexts(current);
    renderSlides(current);
  });
})();
