/* =========================================================
   ADMIN MODE — painel de edição
   Atalho: Ctrl+Shift+E   |   Botão flutuante ⚙ (canto inferior direito)
   ========================================================= */
(function () {
  const FONT_OPTIONS = [
    { label: "— Padrão do site —", value: "" },
    {
      label: "Cormorant Garamond (serifa elegante)",
      value: "Cormorant Garamond, serif",
    },
    {
      label: "Playfair Display (serifa clássica)",
      value: "Playfair Display, serif",
    },
    { label: "Great Vibes (manuscrita)", value: "Great Vibes, cursive" },
    { label: "Dancing Script (manuscrita)", value: "Dancing Script, cursive" },
    { label: "Inter (moderna)", value: "Inter, sans-serif" },
  ];
  const GLOBAL_FONT_OPTIONS = FONT_OPTIONS.slice(1);

  const EDITABLE_TEXTS = [
    {
      key: "finalTitle",
      label: "Título final",
      type: "text",
      hint: 'Ex: "Feliz Dia das Mães" ou "Feliz Aniversário, Mãe"',
    },
    { key: "finalQuoteLine1", label: "Frase final — linha 1", type: "text" },
    { key: "finalQuoteLine2", label: "Frase final — linha 2", type: "text" },
    {
      key: "finalMessage",
      label: "Mensagem final (digitada)",
      type: "textarea",
      hint: "Use linhas em branco para criar pausas dramáticas",
    },
  ];

  const MAX_SLIDES = window.SiteConfig.MAX_SLIDES || 20;
  const EXAMPLE_SLIDE = {
    src: "https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=1200&q=80",
    caption: "Nova memória…",
  };
  let cfg = window.SiteConfig.load();
  let panel;

  function build() {
    panel = document.createElement("div");
    panel.className = "admin-overlay";
    panel.innerHTML = `
      <div class="admin-modal" role="dialog" aria-label="Editor">
        <header>
          <h2>Editor</h2>
          <button class="admin-close" title="Fechar (Esc)" aria-label="Fechar">✕</button>
        </header>
        <div class="admin-tabs">
          <button data-tab="textos" class="active">Textos & Fontes</button>
          <button data-tab="fotos">Fotos</button>
          <button data-tab="aparencia">Aparência</button>
          <button data-tab="dados">Dados</button>
        </div>
        <div class="admin-body">
          <div class="admin-tab active" data-tab="textos">${renderTextsTab()}</div>
          <div class="admin-tab" data-tab="fotos">${renderPhotosTab()}</div>
          <div class="admin-tab" data-tab="aparencia">${renderThemeTab()}</div>
          <div class="admin-tab" data-tab="dados">${renderDataTab()}</div>
        </div>
        <div class="admin-footer">
          <button class="admin-btn ghost" id="adminReset">Restaurar padrão</button>
          <button class="admin-btn primary" id="adminSave">Salvar e recarregar</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    wire();
  }

  function renderTextsTab() {
    const t = cfg.texts || {};
    const f = cfg.textFonts || {};
    const b = cfg.birthday || {};
    const fields = EDITABLE_TEXTS.map((cfgItem) => {
      const value = t[cfgItem.key] ?? "";
      const inputHtml =
        cfgItem.type === "textarea"
          ? `<textarea data-text="${cfgItem.key}" rows="6">${esc(value)}</textarea>`
          : `<input type="text" data-text="${cfgItem.key}" value="${esc(value)}" />`;
      const fontSel = `
        <label class="sub-label">Fonte deste texto</label>
        <select data-textfont="${cfgItem.key}">
          ${FONT_OPTIONS.map((o) => `<option value="${esc(o.value)}" ${o.value === (f[cfgItem.key] || "") ? "selected" : ""}>${esc(o.label)}</option>`).join("")}
        </select>`;
      return `
        <div class="admin-card">
          <label>${cfgItem.label}</label>
          ${inputHtml}
          ${cfgItem.hint ? `<p class="admin-hint">${cfgItem.hint}</p>` : ""}
          ${fontSel}
        </div>`;
    }).join("");

    return `
      <div class="admin-card">
        <label>Título da página (aba do navegador)</label>
        <input type="text" data-field="pageTitle" value="${esc(cfg.pageTitle || "")}" />
      </div>
      <div class="admin-card">
        <label>Data para "voltar no tempo" (aniversário da mãe)</label>
        <div class="date-grid">
          <div class="admin-field">
            <label>Dia</label>
            <input type="number" inputmode="numeric" min="1" max="31" data-bday="day" value="${b.day || ""}" placeholder="Dia" />
          </div>
          <div class="admin-field">
            <label>Mês</label>
            <input type="number" inputmode="numeric" min="1" max="12" data-bday="month" value="${b.month || ""}" placeholder="Mês" />
          </div>
          <div class="admin-field">
            <label>Ano</label>
            <input type="number" inputmode="numeric" min="1900" max="2100" data-bday="year" value="${b.year || ""}" placeholder="Ano" />
          </div>
        </div>
        <p class="admin-hint">O relógio retrocede até esta data antes do slideshow.</p>
      </div>
      ${fields}
      <p class="admin-hint" style="margin-top:18px; text-align:center; opacity:.7">
        🔒 A cena inicial (relógio, START e frase de abertura) é fixa e não pode ser editada.
      </p>
    `;
  }

  function renderPhotosTab() {
    const count = cfg.slides.length;
    return `
      <p class="admin-hint" style="margin-bottom:14px">
        ${count} de ${MAX_SLIDES} fotos. Clique na miniatura para trocar a imagem; ela será comprimida em WebP e salva no navegador.
      </p>
      <div class="slides-list" id="slidesList">
        ${cfg.slides.map((s, i) => slideItem(s, i)).join("")}
      </div>
      <button class="admin-add" id="addSlide" ${count >= MAX_SLIDES ? "disabled" : ""}>
        ${count >= MAX_SLIDES ? `Limite de ${MAX_SLIDES} fotos atingido` : "＋ Adicionar foto"}
      </button>
      <p class="admin-hint" style="margin-top:10px">
        ⚠ Fotos grandes são redimensionadas automaticamente para até 1200px e qualidade WebP 0.75.
      </p>
    `;
  }

  function slideItem(s, i) {
    const thumbStyle = s.src ? `background-image:url('${esc(s.src)}')` : "";
    const imageId = s.imageId ? `data-image-id="${esc(s.imageId)}"` : "";
    return `
      <div class="slide-item" data-idx="${i}">
        <div class="thumb" ${imageId} style="${thumbStyle}" title="Trocar foto"></div>
        <div class="content">
          <textarea data-caption placeholder="Legenda…">${esc(s.caption)}</textarea>
        </div>
        <div class="actions">
          <button data-act="up" title="Mover para cima">↑</button>
          <button data-act="down" title="Mover para baixo">↓</button>
          <button data-act="del" class="danger" title="Remover">✕</button>
        </div>
      </div>
    `;
  }

  function renderThemeTab() {
    const th = cfg.theme;
    return `
      <div class="admin-card">
        <label>Fonte principal do site</label>
        <select data-theme="fontDisplay">
          ${GLOBAL_FONT_OPTIONS.map((f) => `<option value="${esc(f.value)}" ${f.value === th.fontDisplay ? "selected" : ""}>${esc(f.label)}</option>`).join("")}
        </select>
        <p class="admin-hint">Aplicada a todos os textos sem fonte específica.</p>
      </div>
      <div class="admin-card">
        <label>Cores</label>
        <div class="color-grid">
          <div class="color-cell"><span>Fundo</span><input type="color" data-theme="bg" value="${th.bg}" /></div>
          <div class="color-cell"><span>Texto</span><input type="color" data-theme="ink" value="${th.ink}" /></div>
          <div class="color-cell"><span>Rosa</span><input type="color" data-theme="rose" value="${th.rose}" /></div>
          <div class="color-cell"><span>Dourado</span><input type="color" data-theme="gold" value="${th.gold}" /></div>
        </div>
        <p class="admin-hint">Para aniversário, experimente cores mais vivas. Para Dia das Mães, mantenha rosa + dourado.</p>
      </div>
    `;
  }

  function renderDataTab() {
    return `
      <div class="admin-card">
        <label>Backup</label>
        <button class="admin-btn ghost" id="exportBtn" style="width:100%; margin-top:6px">⬇ Exportar configuração (.json)</button>
        <p class="admin-hint">Salva textos, legendas e cores. Fotos enviadas ficam no IndexedDB deste navegador.</p>
      </div>
      <div class="admin-card">
        <label>Importar configuração</label>
        <input type="file" id="importFile" accept="application/json" />
        <p class="admin-hint">Substitui as edições atuais pelas do arquivo escolhido.</p>
      </div>
      <div class="admin-card">
        <p class="admin-hint">⚠ "Restaurar padrão" volta tudo ao tema original de Dia das Mães. Suas edições serão perdidas.</p>
      </div>
    `;
  }

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function wire() {
    panel.querySelector(".admin-close").addEventListener("click", close);
    panel.addEventListener("click", (e) => {
      if (e.target === panel) close();
    });
    panel.querySelectorAll(".admin-tabs button").forEach((b) => {
      b.addEventListener("click", () => switchTab(b.dataset.tab));
    });
    panel.querySelector("#adminSave").addEventListener("click", saveAndReload);
    panel.querySelector("#adminReset").addEventListener("click", () => {
      if (confirm("Restaurar todas as configurações para o padrão?")) {
        window.SiteConfig.reset();
        location.reload();
      }
    });

    // textos
    panel.querySelectorAll("[data-text]").forEach((el) => {
      el.addEventListener("input", () => {
        cfg.texts = cfg.texts || {};
        cfg.texts[el.dataset.text] = el.value;
      });
    });
    panel.querySelectorAll("[data-textfont]").forEach((el) => {
      el.addEventListener("change", () => {
        cfg.textFonts = cfg.textFonts || {};
        cfg.textFonts[el.dataset.textfont] = el.value;
      });
    });
    panel.querySelectorAll("[data-field]").forEach((el) => {
      el.addEventListener("input", () => {
        cfg[el.dataset.field] = el.value;
      });
    });
    panel.querySelectorAll("[data-bday]").forEach((el) => {
      el.addEventListener("input", () => {
        cfg.birthday = cfg.birthday || {};
        cfg.birthday[el.dataset.bday] = parseInt(el.value, 10) || 0;
      });
    });

    // tema
    panel.querySelectorAll("[data-theme]").forEach((el) => {
      el.addEventListener("input", () => {
        cfg.theme[el.dataset.theme] = el.value;
        window.SiteConfig.applyTheme(cfg);
      });
    });

    wirePhotos();
    wireData();
  }

  function wirePhotos() {
    const list = panel.querySelector("#slidesList");
    list.addEventListener("click", (e) => {
      const item = e.target.closest(".slide-item");
      if (!item) return;
      const idx = parseInt(item.dataset.idx, 10);

      if (e.target.classList.contains("thumb")) {
        pickPhoto(idx);
        return;
      }
      const act = e.target.dataset.act;
      if (act === "del") {
        if (!confirm("Remover esta foto?")) return;
        window.ImageStore?.deleteImage?.(cfg.slides[idx].imageId);
        cfg.slides.splice(idx, 1);
        refreshPhotosTab();
      } else if (act === "up" && idx > 0) {
        [cfg.slides[idx - 1], cfg.slides[idx]] = [
          cfg.slides[idx],
          cfg.slides[idx - 1],
        ];
        refreshPhotosTab();
      } else if (act === "down" && idx < cfg.slides.length - 1) {
        [cfg.slides[idx + 1], cfg.slides[idx]] = [
          cfg.slides[idx],
          cfg.slides[idx + 1],
        ];
        refreshPhotosTab();
      }
    });
    list.addEventListener("input", (e) => {
      if (e.target.matches("[data-caption]")) {
        const idx = parseInt(e.target.closest(".slide-item").dataset.idx, 10);
        cfg.slides[idx].caption = e.target.value;
      }
    });
    panel.querySelector("#addSlide").addEventListener("click", () => {
      if (cfg.slides.length >= MAX_SLIDES) return;
      cfg.slides.push({ ...EXAMPLE_SLIDE });
      refreshPhotosTab();
    });
    hydratePhotoThumbs();
  }

  function refreshPhotosTab() {
    panel.querySelector('.admin-tab[data-tab="fotos"]').innerHTML = renderPhotosTab();
    wirePhotos();
  }

  function hydratePhotoThumbs() {
    if (!window.ImageStore) return;
    panel.querySelectorAll(".thumb[data-image-id]").forEach((thumb) => {
      window.ImageStore.getObjectUrl(thumb.dataset.imageId).then((url) => {
        if (url) thumb.style.backgroundImage = `url('${url}')`;
      });
    });
  }

  function pickPhoto(idx) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!window.ImageStore) {
        alert("Seu navegador não está com IndexedDB disponível para salvar imagens.");
        return;
      }
      try {
        toast("Processando imagem…");
        const previousId = cfg.slides[idx].imageId;
        const stored = await window.ImageStore.processFile(file);
        cfg.slides[idx] = {
          ...cfg.slides[idx],
          ...stored,
          caption: cfg.slides[idx].caption || "",
        };
        if (previousId && previousId !== stored.imageId) {
          window.ImageStore.deleteImage(previousId);
        }
        refreshPhotosTab();
        toast(`Foto otimizada ✓ ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(stored.size / 1024).toFixed(0)}KB`);
      } catch (err) {
        console.error(err);
        alert("Não foi possível processar esta imagem. Tente outra foto em JPG, PNG, SVG ou WebP.");
      }
    };
    input.click();
  }

  function wireData() {
    panel.querySelector("#exportBtn").addEventListener("click", async () => {
      await migrateInlineImages();
      const cleanCfg = {
        ...cfg,
        slides: (cfg.slides || []).map((slide) =>
          window.ImageStore
            ? window.ImageStore.cleanSlideForStorage(slide)
            : { ...slide },
        ),
      };
      const blob = new Blob([JSON.stringify(cleanCfg, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "homenagem-config.json";
      a.click();
    });
    panel.querySelector("#importFile").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          cfg = JSON.parse(reader.result);
          await migrateInlineImages();
          window.SiteConfig.save(cfg);
          toast("Configuração importada ✓ Recarregando…");
          setTimeout(() => location.reload(), 800);
        } catch {
          alert("Arquivo inválido.");
        }
      };
      reader.readAsText(file);
    });
  }

  async function migrateInlineImages() {
    if (!window.ImageStore) return;
    for (const slide of cfg.slides || []) {
      if (!slide.src?.startsWith("data:image/")) continue;
      const blob = await fetch(slide.src).then((r) => r.blob());
      const file = new File([blob], "foto-importada", {
        type: blob.type || "image/png",
      });
      const stored = await window.ImageStore.processFile(file);
      slide.imageId = stored.imageId;
      slide.width = stored.width;
      slide.height = stored.height;
      slide.size = stored.size;
      slide.type = stored.type;
      slide.originalSize = stored.originalSize;
      slide.src = "";
    }
  }

  function switchTab(tab) {
    panel
      .querySelectorAll(".admin-tabs button")
      .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    panel
      .querySelectorAll(".admin-tab")
      .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  }

  async function saveAndReload() {
    try {
      toast("Salvando…");
      await migrateInlineImages();
      window.SiteConfig.save(cfg);
      toast("Salvo ✓ Recarregando…");
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      alert(
        "Não foi possível salvar/processar as fotos. Tente usar uma imagem menor ou em JPG/PNG/WebP.",
      );
    }
  }

  function open() {
    if (!panel) build();
    cfg = window.SiteConfig.load();
    rebuildAll();
    panel.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    panel?.classList.remove("open");
    document.body.style.overflow = "";
  }

  function rebuildAll() {
    if (!panel) return;
    panel.querySelector('.admin-tab[data-tab="textos"]').innerHTML = renderTextsTab();
    panel.querySelector('.admin-tab[data-tab="fotos"]').innerHTML = renderPhotosTab();
    panel.querySelector('.admin-tab[data-tab="aparencia"]').innerHTML = renderThemeTab();
    panel.querySelector('.admin-tab[data-tab="dados"]').innerHTML = renderDataTab();
    wire();
  }

  function toast(msg) {
    let t = document.querySelector(".admin-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "admin-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  document.getElementById("adminToggle")?.addEventListener("click", () => {
    panel?.classList.contains("open") ? close() : open();
  });
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) {
      e.preventDefault();
      panel?.classList.contains("open") ? close() : open();
    } else if (e.key === "Escape" && panel?.classList.contains("open")) {
      close();
    }
  });
})();
