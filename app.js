// app.js — studentos main logic
// ok so i spent way too long on this..

// GLOBALS
let openApps = {}; // tracks which apps are open
let zCounter = 100; // z-index stacking

// LOADER
const loadMessages = [
  "initializing system...",
  "loading student modules...",
  "calibrating neon theme...",
  "mounting music drive...",
  "booting 3d engine...",
  "setting up workspace...",
  "almost done...",
  "welcome to studentOS :)",
];

let loadIdx = 0;
let loadPct = 0;
const loaderBar = document.getElementById("loaderBar");
const loaderText = document.getElementById("loaderText");

function runLoader() {
  const interval = setInterval(() => {
    loadPct += Math.random() * 15 + 5;
    if (loadPct > 100) loadPct = 100;
    loaderBar.style.width = loadPct + "%";

    const msgIdx = Math.floor((loadPct / 100) * loadMessages.length);
    if (msgIdx < loadMessages.length) {
      loaderText.textContent = loadMessages[msgIdx];
    }

    if (loadPct >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById("loader").style.opacity = "0";
        document.getElementById("loader").style.transition = "opacity 0.5s";
        setTimeout(() => {
          document.getElementById("loader").style.display = "none";
          document.getElementById("desktop").classList.remove("hidden");
          initDesktop();
        }, 500);
      }, 400);
    }
  }, 120);
}

window.addEventListener("load", runLoader);

// DESKTOP INIT
function initDesktop() {
  startClock();
  initParticles();
  buildStreakGrid();
}

// CLOCK
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    document.getElementById("clock").textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

// PARTICLES
function initParticles() {
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  // small floating particles
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: Math.random() * 0.4 + 0.1,
    color: ["#00ffcc", "#ff6eb4", "#38bdf8", "#ffe066", "#a78bfa"][
      Math.floor(Math.random() * 5)
    ],
  }));

  function animParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(animParticles);
  }
  animParticles();
}

// APP OPEN / CLOSE
function openApp(appId) {
  if (openApps[appId]) {
    // restore if minimized
    const win = document.getElementById("win-" + appId);
    if (win) {
      win.classList.remove("minimized");
      bringToFront(win);
    }
    return;
  }

  const tpl = document.getElementById("tpl-" + appId);
  if (!tpl) return;
  const clone = tpl.content.firstElementChild.cloneNode(true);
  document.getElementById("windows-container").appendChild(clone);
  bringToFront(clone);
  openApps[appId] = true;
  addTaskbarBtn(appId);

  // post-open init
  if (appId === "3d") setTimeout(init3D, 50);
  if (appId === "music") initMusicPlayer();
  if (appId === "dashboard") animateProgressBars();
  if (appId === "notes") initNotes();
  if (appId === "timer") initTimer();

  // click to bring to front
  clone.addEventListener("mousedown", () => bringToFront(clone));
}

function closeApp(appId, winId) {
  const win = document.getElementById(winId);
  if (win) win.remove();
  delete openApps[appId];
  removeTaskbarBtn(appId);
  if (appId === "3d") stopThreeJS();
  if (appId === "timer") stopTimer();
}

function minimizeWin(winId) {
  const win = document.getElementById(winId);
  if (win) win.classList.add("minimized");
}

function bringToFront(win) {
  zCounter++;
  win.style.zIndex = zCounter;
}

// TASKBAR APPS
function addTaskbarBtn(appId) {
  const labels = {
    dashboard: "📚 Dashboard",
    "3d": "🌌 3D",
    music: "🎵 Music",
    notes: "📝 Notes",
    timer: "⏰ Timer",
  };
  const btn = document.createElement("button");
  btn.className = "taskbar-app-btn";
  btn.id = "tbtn-" + appId;
  btn.textContent = labels[appId] || appId;
  btn.onclick = () => {
    const win = document.getElementById("win-" + appId);
    if (!win) return;
    if (win.classList.contains("minimized")) {
      win.classList.remove("minimized");
      bringToFront(win);
    } else {
      win.classList.add("minimized");
    }
    btn.classList.toggle("minimized", win.classList.contains("minimized"));
  };
  document.getElementById("taskbarApps").appendChild(btn);
}

function removeTaskbarBtn(appId) {
  const btn = document.getElementById("tbtn-" + appId);
  if (btn) btn.remove();
}

// START MENU
function toggleStartMenu() {
  document.getElementById("startMenu").classList.toggle("hidden");
}
document.addEventListener("click", (e) => {
  const menu = document.getElementById("startMenu");
  const startBtn = document.querySelector(".start-btn");
  if (!menu.contains(e.target) && !startBtn.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

// DRAG WINDOWS
let dragging = null;
let dragOffX = 0,
  dragOffY = 0;

function startDrag(e, winId) {
  const win = document.getElementById(winId);
  bringToFront(win);
  dragging = win;
  const rect = win.getBoundingClientRect();
  dragOffX = e.clientX - rect.left;
  dragOffY = e.clientY - rect.top;
}

document.addEventListener("mousemove", (e) => {
  if (!dragging) return;
  let nx = e.clientX - dragOffX;
  let ny = e.clientY - dragOffY;
  // keep within viewport
  nx = Math.max(0, Math.min(nx, window.innerWidth - 60));
  ny = Math.max(0, Math.min(ny, window.innerHeight - 80));
  dragging.style.left = nx + "px";
  dragging.style.top = ny + "px";
});

document.addEventListener("mouseup", () => {
  dragging = null;
});

// DASHBOARD
function animateProgressBars() {
  // the bars animate via CSS transition on load
  // just trigger a tiny reflow to restart them
  const fills = document.querySelectorAll(".prog-fill");
  fills.forEach((f) => {
    const w = f.style.width;
    f.style.width = "0%";
    requestAnimationFrame(() => {
      setTimeout(() => {
        f.style.width = w;
      }, 50);
    });
  });
}

function strikeTask(checkbox) {
  const label = checkbox.closest("label");
  if (checkbox.checked) {
    label.classList.add("struck");
  } else {
    label.classList.remove("struck");
  }
}

function addTask() {
  const input = document.getElementById("newTaskInput");
  const val = input.value.trim();
  if (!val) return;
  const list = document.querySelector(".task-list");
  const label = document.createElement("label");
  label.className = "task-item";
  label.innerHTML = `<input type="checkbox" onchange="strikeTask(this)" /> ${val}`;
  list.appendChild(label);
  input.value = "";
}

// build the github-style streak grid
function buildStreakGrid() {
  const grid = document.getElementById("streakGrid");
  if (!grid) return;
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = document.createElement("div");
    const rand = Math.random();
    let lvl = 0;
    if (rand > 0.6) lvl = 1;
    if (rand > 0.75) lvl = 2;
    if (rand > 0.88) lvl = 3;
    if (rand > 0.95) lvl = 4;
    // make the last 12 days mostly filled (the streak)
    if (i < 12) lvl = Math.max(lvl, 2);
    d.className = `streak-day streak-${lvl}`;
    d.title = `${i} days ago · level ${lvl}`;
    grid.appendChild(d);
  }
}

// NOTES
function initNotes() {
  const area = document.getElementById("noteArea");
  if (!area) return;
  area.addEventListener("input", () => {
    const words = area.innerText.trim().split(/\s+/).filter(Boolean).length;
    document.getElementById("notesFooter").textContent =
      `${words} word${words !== 1 ? "s" : ""}`;
  });
}

function formatNote(cmd) {
  document.execCommand(cmd, false, null);
}

function setNoteColor(color) {
  if (color) document.execCommand("foreColor", false, color);
}

function clearNotes() {
  const area = document.getElementById("noteArea");
  if (area) area.innerHTML = "";
}

function saveNotes() {
  const area = document.getElementById("noteArea");
  if (!area) return;
  const blob = new Blob([area.innerText], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "my-notes.txt";
  a.click();
}

// TIMER
const timerModes = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

let timerInterval = null;
let timerTotal = 25 * 60;
let timerLeft = 25 * 60;
let timerRunning = false;
let sessionCount = 1;
let currentTimerMode = "pomodoro";

function initTimer() {
  updateTimerDisplay();
}

function setTimerMode(mode, btn) {
  document
    .querySelectorAll(".t-tab")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  currentTimerMode = mode;
  stopTimer();
  timerTotal = timerModes[mode];
  timerLeft = timerTotal;
  updateTimerDisplay();
  updateTimerRing();

  // change ring color per mode
  const ring = document.getElementById("ringProg");
  if (!ring) return;
  const colors = { pomodoro: "#38bdf8", short: "#00ffcc", long: "#a78bfa" };
  ring.style.stroke = colors[mode];
}

function startTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById("timerStartBtn").textContent = "▶ start";
    return;
  }
  timerRunning = true;
  document.getElementById("timerStartBtn").textContent = "⏸ pause";
  timerInterval = setInterval(() => {
    timerLeft--;
    updateTimerDisplay();
    updateTimerRing();
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById("timerStartBtn").textContent = "▶ start";
      sessionCount++;
      if (sessionCount > 4) sessionCount = 1;
      const sc = document.getElementById("sessionCount");
      if (sc) sc.textContent = sessionCount;
      timerLeft = timerTotal;
      updateTimerDisplay();
      updateTimerRing();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  const btn = document.getElementById("timerStartBtn");
  if (btn) btn.textContent = "▶ start";
}

function resetTimer() {
  stopTimer();
  timerLeft = timerTotal;
  updateTimerDisplay();
  updateTimerRing();
}

function updateTimerDisplay() {
  const el = document.getElementById("timerDisplay");
  if (!el) return;
  const m = String(Math.floor(timerLeft / 60)).padStart(2, "0");
  const s = String(timerLeft % 60).padStart(2, "0");
  el.textContent = `${m}:${s}`;
}

function updateTimerRing() {
  const ring = document.getElementById("ringProg");
  if (!ring) return;
  const circumference = 553;
  const progress = timerLeft / timerTotal;
  ring.style.strokeDashoffset = circumference * (1 - progress);
}

// 3D (canvas-based, no three.js needed)
let threeCtx = null;
let threeAngle = 0;
let threeMouseX = 0,
  threeMouseY = 0;
let threeColor = "#00ffcc";
let threeObject = "Cube";
let threeScale = 1;
let threeAnim = null;

function init3D() {
  const canvas = document.getElementById("threeCanvas");
  if (!canvas) return;

  // size to parent
  const parent = canvas.parentElement;
  canvas.width = parent.offsetWidth;
  canvas.height = parent.offsetHeight - 30; // minus hint

  threeCtx = canvas.getContext("2d");

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    threeMouseX = ((e.clientX - rect.left) / canvas.width - 0.5) * 2;
    threeMouseY = ((e.clientY - rect.top) / canvas.height - 0.5) * 2;
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      threeScale -= e.deltaY * 0.001;
      threeScale = Math.max(0.4, Math.min(2, threeScale));
      e.preventDefault();
    },
    { passive: false },
  );

  draw3D();
}

function stopThreeJS() {
  if (threeAnim) cancelAnimationFrame(threeAnim);
  threeAnim = null;
}

function changeObject() {
  const sel = document.getElementById("objSelect");
  if (sel) threeObject = sel.value;
}

function changeColor() {
  const inp = document.getElementById("objColor");
  if (inp) threeColor = inp.value;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// simple 3d projection helper
function project(x, y, z, cx, cy, fov) {
  const scale = fov / (fov + z);
  return { x: cx + x * scale, y: cy + y * scale, scale };
}

function rotatePoint(x, y, z, rx, ry) {
  // rotate around Y
  let nx = x * Math.cos(ry) - z * Math.sin(ry);
  let nz = x * Math.sin(ry) + z * Math.cos(ry);
  x = nx;
  z = nz;
  // rotate around X
  let ny = y * Math.cos(rx) - z * Math.sin(rx);
  nz = y * Math.sin(rx) + z * Math.cos(rx);
  return { x, y: ny, z: nz };
}

function draw3D() {
  const canvas = document.getElementById("threeCanvas");
  if (!canvas || !threeCtx) return;

  const ctx = threeCtx;
  const W = canvas.width,
    H = canvas.height;
  const cx = W / 2,
    cy = H / 2;
  const fov = 300;

  ctx.clearRect(0, 0, W, H);

  // background gradient
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) / 2);
  grad.addColorStop(0, "rgba(10,10,40,1)");
  grad.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // grid floor effect
  ctx.strokeStyle = "rgba(0,255,204,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, H);
    ctx.stroke();
  }
  for (let i = 0; i < H; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(W, i);
    ctx.stroke();
  }

  threeAngle += 0.01 + threeMouseX * 0.01;
  const tiltX = threeMouseY * 0.4;
  const tiltY = threeAngle;
  const s = 80 * threeScale;

  const rgb = hexToRgb(threeColor);
  const colMain = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  const colDim = `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
  const colGlow = `rgba(${rgb.r},${rgb.g},${rgb.b},0.08)`;

  if (threeObject === "Cube") {
    drawCube(ctx, cx, cy, fov, s, tiltX, tiltY, colMain, colDim, colGlow);
  } else if (threeObject === "Sphere") {
    drawSphere(ctx, cx, cy, s, colMain, rgb);
  } else if (threeObject === "Torus") {
    drawTorus(ctx, cx, cy, fov, s, tiltX, tiltY, colMain, colDim);
  }

  // update rotation display
  const rotEl = document.getElementById("rotVal");
  if (rotEl)
    rotEl.textContent =
      Math.floor(((threeAngle % (Math.PI * 2)) / (Math.PI * 2)) * 360) + "°";

  threeAnim = requestAnimationFrame(draw3D);
}

function drawCube(ctx, cx, cy, fov, s, rx, ry, colMain, colDim, colGlow) {
  const verts = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ].map((v) => {
    const r = rotatePoint(v[0] * s, v[1] * s, v[2] * s, rx, ry);
    return project(r.x, r.y, r.z, cx, cy, fov);
  });

  const faces = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [1, 2, 6, 5],
    [0, 3, 7, 4],
  ];

  const faceColors = [colMain, colDim, colDim, colDim, colGlow, colMain];

  faces.forEach((f, i) => {
    ctx.beginPath();
    ctx.moveTo(verts[f[0]].x, verts[f[0]].y);
    for (let k = 1; k < f.length; k++) ctx.lineTo(verts[f[k]].x, verts[f[k]].y);
    ctx.closePath();
    ctx.fillStyle = faceColors[i % faceColors.length];
    ctx.fill();
    ctx.strokeStyle = colMain;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // glow
  ctx.shadowColor = colMain;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = colMain;
  ctx.lineWidth = 2;
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  edges.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(verts[a].x, verts[a].y);
    ctx.lineTo(verts[b].x, verts[b].y);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;
}

function drawSphere(ctx, cx, cy, s, colMain, rgb) {
  // fake sphere with layered circles
  for (let i = 8; i >= 0; i--) {
    const t = i / 8;
    const r = s * Math.sin(Math.acos(1 - t));
    ctx.beginPath();
    ctx.arc(cx, cy - s * (1 - t * 2), r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.1 + t * 0.2})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // main circle
  ctx.beginPath();
  ctx.arc(cx, cy, s, 0, Math.PI * 2);
  const grd = ctx.createRadialGradient(
    cx - s * 0.3,
    cy - s * 0.3,
    s * 0.1,
    cx,
    cy,
    s,
  );
  grd.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`);
  grd.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.05)`);
  ctx.fillStyle = grd;
  ctx.fill();
  ctx.strokeStyle = colMain;
  ctx.lineWidth = 2;
  ctx.shadowColor = colMain;
  ctx.shadowBlur = 25;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // latitude lines
  for (let lat = -3; lat <= 3; lat++) {
    const y0 = cy + lat * (s / 3.5);
    const r = Math.sqrt(Math.max(0, s * s - (y0 - cy) * (y0 - cy)));
    ctx.beginPath();
    ctx.ellipse(
      cx,
      y0,
      r,
      r * 0.2 + Math.abs(threeAngle % 0.1),
      0,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawTorus(ctx, cx, cy, fov, s, rx, ry) {
  const rgb = hexToRgb(threeColor);
  const R = s * 0.8,
    r2 = s * 0.3;
  const steps = 28,
    tubeSteps = 14;
  const points = [];

  for (let i = 0; i < steps; i++) {
    const theta = (i / steps) * Math.PI * 2;
    const row = [];
    for (let j = 0; j < tubeSteps; j++) {
      const phi = (j / tubeSteps) * Math.PI * 2;
      const x = (R + r2 * Math.cos(phi)) * Math.cos(theta);
      const y = r2 * Math.sin(phi);
      const z = (R + r2 * Math.cos(phi)) * Math.sin(theta);
      const rotated = rotatePoint(x, y, z, rx, ry);
      const proj = project(rotated.x, rotated.y, rotated.z, cx, cy, fov);
      row.push(proj);
    }
    points.push(row);
  }

  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < tubeSteps; j++) {
      const ni = (i + 1) % steps,
        nj = (j + 1) % tubeSteps;
      const a = points[i][j],
        b = points[ni][j],
        c = points[ni][nj],
        d = points[i][nj];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.closePath();
      const alpha = 0.08 + (a.scale - 0.5) * 0.2;
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0, alpha)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
}

// MUSIC PLAYER
const playlist = [
  {
    title: "Study Beats 01",
    artist: "Chill Lo-Fi",
    emoji: "🎵",
    file: "music1.mp3",
    img: "image1.jpg",
  },
  {
    title: "Focus Flow",
    artist: "Ambient Vibes",
    emoji: "🌊",
    file: "music2.mp3",
    img: "image2.jpg",
  },
  {
    title: "Night Coding",
    artist: "Neon Sound",
    emoji: "🌙",
    file: "music3.mp3",
    img: "image3.jpg",
  },
  {
    title: "Calm Mind",
    artist: "Relax Lab",
    emoji: "🍃",
    file: "music4.mp3",
    img: "image4.jpg",
  },
  {
    title: "Deep Focus",
    artist: "Study Zone",
    emoji: "🔮",
    file: "music5.mp3",
    img: "image5.jpg",
  },
];

let currentSong = 0;
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let bgMuted = false;
let musicMode = "full";

// simulated progress
let progInterval = null;
let progSeconds = 0;
const totalSeconds = 225; // 3:45

function initMusicPlayer() {
  buildPlaylist();
  updateNowPlaying();
  showMiniPlayer();
}

function buildPlaylist() {
  const container = document.getElementById("playlistItems");
  if (!container) return;
  container.innerHTML = "";
  playlist.forEach((song, i) => {
    const item = document.createElement("div");
    item.className = "pl-item" + (i === currentSong ? " active" : "");
    item.id = "plitem-" + i;
    item.onclick = () => selectSong(i);

    let coverHtml = `<div class="pl-cover"><span>${song.emoji}</span></div>`;
    // try to show image if it exists
    coverHtml = `<div class="pl-cover">
      <img src="${song.img}" alt="${song.title}" onerror="this.parentElement.innerHTML='<span>${song.emoji}</span>'" />
    </div>`;

    item.innerHTML = `
      <div class="pl-num">${i + 1}</div>
      ${coverHtml}
      <div class="pl-info">
        <div class="pl-title">${song.title}</div>
        <div class="pl-artist">${song.artist}</div>
      </div>
      <div class="pl-playing-indicator" id="pli-${i}" style="display:${i === currentSong && isPlaying ? "flex" : "none"}">
        <span></span><span></span><span></span>
      </div>
    `;
    container.appendChild(item);
  });
}

function selectSong(i) {
  currentSong = i;
  progSeconds = 0;
  updateNowPlaying();
  updatePlaylistHighlight();
  if (isPlaying) startFakeProgress();
}

function updateNowPlaying() {
  const song = playlist[currentSong];
  const npTitle = document.getElementById("npTitle");
  const npArtist = document.getElementById("npArtist");
  const albumEmoji = document.getElementById("albumEmoji");
  const albumArt = document.getElementById("albumArt");

  if (npTitle) npTitle.textContent = song.title;
  if (npArtist) npArtist.textContent = song.artist;
  if (albumEmoji) albumEmoji.textContent = song.emoji;
  if (albumArt) {
    // try showing album image
    albumEmoji.innerHTML = `<img src="${song.img}" alt="${song.title}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.outerHTML='${song.emoji}'" />`;
  }

  updateMiniPlayer();
  updateBgMode();
  updatePlaylistHighlight();
}

function updatePlaylistHighlight() {
  playlist.forEach((_, i) => {
    const item = document.getElementById("plitem-" + i);
    const ind = document.getElementById("pli-" + i);
    if (item) item.classList.toggle("active", i === currentSong);
    if (ind)
      ind.style.display = i === currentSong && isPlaying ? "flex" : "none";
  });
}

function togglePlay() {
  isPlaying = !isPlaying;

  const playBtn = document.getElementById("playBtn");
  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const albumArt = document.getElementById("albumArt");
  const eqBars = document.getElementById("eqBars");
  const miniEq = document.getElementById("miniEq");

  if (playBtn) playBtn.textContent = isPlaying ? "⏸" : "▶";
  if (miniPlayBtn) miniPlayBtn.textContent = isPlaying ? "⏸" : "▶";
  if (albumArt) albumArt.classList.toggle("playing", isPlaying);
  if (eqBars) eqBars.classList.toggle("active", isPlaying);
  if (miniEq) miniEq.classList.toggle("playing", isPlaying);

  if (isPlaying) {
    startFakeProgress();
  } else {
    clearInterval(progInterval);
  }

  updatePlaylistHighlight();
}

function startFakeProgress() {
  clearInterval(progInterval);
  progInterval = setInterval(() => {
    progSeconds++;
    if (progSeconds >= totalSeconds) {
      nextSong();
      return;
    }
    updateProgressBar();
  }, 1000);
}

function updateProgressBar() {
  const pct = (progSeconds / totalSeconds) * 100;
  const fill = document.getElementById("progFill");
  const dot = document.getElementById("progDot");
  const timeEl = document.getElementById("progTime");

  if (fill) fill.style.width = pct + "%";
  if (dot) dot.style.left = pct + "%";
  if (timeEl) {
    const m = Math.floor(progSeconds / 60);
    const s = String(progSeconds % 60).padStart(2, "0");
    timeEl.textContent = `${m}:${s}`;
  }
}

function seekTrack(e) {
  const track = document.getElementById("progTrack");
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  progSeconds = Math.floor(pct * totalSeconds);
  updateProgressBar();
}

function nextSong() {
  if (isShuffle) {
    currentSong = Math.floor(Math.random() * playlist.length);
  } else {
    currentSong = (currentSong + 1) % playlist.length;
  }
  progSeconds = 0;
  updateNowPlaying();
  if (isPlaying) startFakeProgress();
}

function prevSong() {
  if (progSeconds > 3) {
    progSeconds = 0;
    updateProgressBar();
    return;
  }
  currentSong = (currentSong - 1 + playlist.length) % playlist.length;
  progSeconds = 0;
  updateNowPlaying();
  if (isPlaying) startFakeProgress();
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById("shuffleBtn");
  if (btn) btn.classList.toggle("active-ctrl", isShuffle);
}

function toggleLoop() {
  isLoop = !isLoop;
  const btn = document.getElementById("loopBtn");
  if (btn) btn.classList.toggle("active-ctrl", isLoop);
}

// MUSIC MODES
function setMusicMode(mode, btn) {
  musicMode = mode;
  document
    .querySelectorAll(".mode-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  const layout = document.getElementById("musicLayout");
  const bgOverlay = document.getElementById("bgOverlay");

  if (mode === "bg") {
    if (layout) layout.style.display = "none";
    if (bgOverlay) bgOverlay.classList.remove("hidden");
  } else {
    if (layout) layout.style.display = "flex";
    if (bgOverlay) bgOverlay.classList.add("hidden");
  }

  if (mode === "mini") {
    // shrink the now-playing panel
    const np = document.querySelector(".now-playing");
    if (np) np.style.display = "none";
  } else {
    const np = document.querySelector(".now-playing");
    if (np) np.style.display = "flex";
  }
}

function updateBgMode() {
  const bgTrack = document.getElementById("bgTrack");
  if (bgTrack) bgTrack.textContent = playlist[currentSong].title;
}

function toggleBgMute() {
  bgMuted = !bgMuted;
  const btn = document.getElementById("bgMuteBtn");
  if (btn) btn.textContent = bgMuted ? "🔇 muted" : "🔊 playing";
}

// MINI PLAYER
function showMiniPlayer() {
  document.getElementById("miniPlayer").classList.remove("hidden");
  updateMiniPlayer();
}

function updateMiniPlayer() {
  const song = playlist[currentSong];
  const miniTitle = document.getElementById("miniTitle");
  const miniArtist = document.getElementById("miniArtist");
  const miniAlbum = document.getElementById("miniAlbum");
  if (miniTitle) miniTitle.textContent = song.title;
  if (miniArtist) miniArtist.textContent = song.artist;
  if (miniAlbum) miniAlbum.textContent = song.emoji;
}

function toggleMiniPlayer() {
  const mp = document.getElementById("miniPlayer");
  mp.classList.toggle("hidden");
}

// KEYBOARD SHORTCUTS
document.addEventListener("keydown", (e) => {
  // space to toggle play (only if not typing in an input)
  if (
    e.code === "Space" &&
    e.target.tagName !== "INPUT" &&
    !e.target.isContentEditable
  ) {
    e.preventDefault();
    togglePlay();
  }
  // arrow keys for prev/next
  if (e.code === "ArrowRight" && e.ctrlKey) nextSong();
  if (e.code === "ArrowLeft" && e.ctrlKey) prevSong();
});
