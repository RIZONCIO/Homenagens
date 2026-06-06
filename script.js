/* =========================================================
   PARA VOCÊ, MÃE — versão cinematográfica (com SiteConfig)
   ========================================================= */

function getCfg() {
  return (window.SiteConfig && window.SiteConfig.load()) || {};
}
let CFG = getCfg();
let BIRTHDAY = CFG.birthday || { day: 3, month: 8, year: 1985 };
let FINAL_MESSAGE = CFG.texts?.finalMessage || "Mãe…\n\nNós te amamos.";

// === SONS ===
const sounds = {
  clock: new Howl({
    src: ["audio/clock.mp3"],
    loop: true,
    volume: 0.5,
    html5: true,
  }),
  whoosh: new Howl({ src: ["audio/whoosh.mp3"], volume: 0.7, html5: true }),
  music: new Howl({
    src: ["audio/music.mp3"],
    loop: true,
    volume: 0.55,
    html5: true,
  }),
  heartbeat: new Howl({
    src: ["audio/heartbeat.mp3"],
    loop: true,
    volume: 0.4,
    html5: true,
  }),
};
Object.values(sounds).forEach((s) => {
  s.on("loaderror", () => {
    console.warn("Erro ao carregar arquivo de áudio");
  });
});

// === HELPERS ===
const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (d) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const fmtDate = (d) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

function showScene(id) {
  document
    .querySelectorAll(".scene")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// === CURSOR ===
(function customCursor() {
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  if (!dot || !ring) return;
  let mx = 0,
    my = 0,
    rx = 0,
    ry = 0;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  });
  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("button,a")) ring.classList.add("hover");
    else ring.classList.remove("hover");
  });
})();

// === PARTÍCULAS ===
(function particles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, parts;
  function resize() {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  }
  function init() {
    parts = Array.from({ length: 35 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      a: Math.random() * 0.4 + 0.1,
    }));
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(243,199,209,${p.a})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  addEventListener("resize", () => {
    resize();
    init();
  });
  resize();
  init();
  tick();
})();

// === RELÓGIO ===
function startClock() {
  const tick = () => {
    const n = new Date();
    $("#startTime").textContent = fmtTime(n);
    $("#startDate").textContent = fmtDate(n);
  };
  tick();
  return setInterval(tick, 1000);
}
let startInterval = startClock();

// === REWIND ===
function rewindToBirthday() {
  return new Promise((resolve) => {
    const target = new Date(
      BIRTHDAY.year,
      BIRTHDAY.month - 1,
      BIRTHDAY.day,
      0,
      0,
      0,
    );
    const start = new Date();
    const targetMs = target.getTime();
    const totalDuration = 7000;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / totalDuration);
      const eased = p < 0.5 ? 4 * p ** 3 : 1 - Math.pow(-2 * p + 2, 3) / 2;
      const cur = start.getTime() - (start.getTime() - targetMs) * eased;
      const d = new Date(cur);
      $("#rewindTime").textContent = fmtTime(d);
      $("#rewindDate").textContent = fmtDate(d);
      const shake = (1 - p) * 6;
      const wrap = document.querySelector("#scene-rewind .rewind-wrap");
      wrap.style.transform = `translate(${(Math.random() - 0.5) * shake}px,${(Math.random() - 0.5) * shake}px)`;
      if (p < 1) requestAnimationFrame(frame);
      else {
        wrap.style.transform = "";
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });
}

function whiteFlash() {
  return new Promise((resolve) => {
    const f = document.createElement("div");
    Object.assign(f.style, {
      position: "fixed",
      inset: 0,
      background: "#fff",
      opacity: 0,
      zIndex: 9999,
      pointerEvents: "none",
      transition: "opacity .3s ease",
    });
    document.body.appendChild(f);
    requestAnimationFrame(() => {
      f.style.opacity = "1";
    });
    setTimeout(() => {
      f.style.opacity = "0";
      setTimeout(() => {
        f.remove();
        resolve();
      }, 700);
    }, 350);
  });
}

// === SLIDESHOW ===
function runSlideshow() {
  return new Promise((resolve) => {
    const slides = document.querySelectorAll("#scene-slideshow .slide");
    const captionEl = $("#slideCaption");
    const PER_SLIDE = 6000;
    let i = 0;
    function next() {
      slides.forEach((s) => s.classList.remove("active"));
      captionEl.classList.remove("visible");
      if (i >= slides.length) {
        resolve();
        return;
      }
      const slide = slides[i];
      slide.classList.add("active");
      setTimeout(() => {
        captionEl.textContent = slide.dataset.caption || "";
        captionEl.classList.add("visible");
      }, 700);
      i++;
      setTimeout(next, PER_SLIDE);
    }
    next();
  });
}

// === MENSAGEM com pausas ===
function typeMessage(text, el, speed = 70) {
  return new Promise((resolve) => {
    el.innerHTML = "";
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.innerHTML = "&nbsp;";
    el.appendChild(cursor);
    let i = 0;
    function step() {
      if (i < text.length) {
        const ch = text[i];
        cursor.insertAdjacentText("beforebegin", ch);
        i++;
        let delay = speed;
        if (ch === "\n") delay = 1400;
        else if (/[.,…!?]/.test(ch)) delay = 600;
        setTimeout(step, delay);
      } else {
        setTimeout(resolve, 3500);
      }
    }
    step();
  });
}

function showFinal() {
  const now = new Date();
  $("#finalTime").textContent = fmtTime(now);
  $("#finalDate").textContent = fmtDate(now);
}

// === ORQUESTRAÇÃO ===
async function startJourney() {
  // Recarrega config caso admin tenha editado
  CFG = getCfg();
  BIRTHDAY = CFG.birthday || BIRTHDAY;
  FINAL_MESSAGE = CFG.texts?.finalMessage || FINAL_MESSAGE;

  clearInterval(startInterval);
  try {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  } catch (e) {}
  sounds.whoosh.play();
  await wait(300);
  showScene("scene-rewind");

  sounds.clock.play();
  await rewindToBirthday();

  sounds.clock.stop();
  await wait(1000);

  await whiteFlash();

  showScene("scene-slideshow");
  sounds.music.play();
  await runSlideshow();

  showScene("scene-message");
  await typeMessage(FINAL_MESSAGE, $("#typedText"), 70);

  sounds.heartbeat.play();
  showFinal();
  showScene("scene-final");

  await wait(6000);
  document.body.classList.add("final-fade");
  sounds.music.fade(0.55, 0, 4000);
  sounds.heartbeat.fade(0.4, 0, 4000);
  setTimeout(() => {
    sounds.music.stop();
    sounds.heartbeat.stop();
  }, 4500);
}

function replay() {
  document.body.classList.remove("final-fade");
  sounds.heartbeat.stop();
  sounds.music.stop();
  showScene("scene-start");
  startInterval = startClock();
}

document.getElementById("startBtn").addEventListener("click", startJourney);

document.addEventListener("keydown", (e) => {
  if (
    (e.key === "r" || e.key === "R") &&
    document.getElementById("scene-final").classList.contains("active")
  ) {
    replay();
  }
});
const replayHeart = document.getElementById("replayHeart");
if (replayHeart) replayHeart.addEventListener("click", replay);

if (window.AOS) {
  AOS.init({ duration: 1200, once: true });
} else {
  console.warn("AOS não foi carregado");
}
