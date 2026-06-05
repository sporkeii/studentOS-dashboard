// app.js, studentos main logic
// ok so i think spent way too long on this

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
  // load saved profile into start menu on boot
  const savedName = localStorage.getItem("sos_name");
  const savedStatus = localStorage.getItem("sos_status");
  const savedAvatar = localStorage.getItem("sos_avatar");
  if (savedName || savedAvatar || savedStatus) {
    applyProfileToUI(
      savedName || "Student User",
      savedStatus || "🍎 studying hard",
      savedAvatar || "👤",
    );
  }
  setTimeout(maybeShowWelcome, 600);
}

// CLOCk
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

// paRTICLES
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
  if (appId === "dashboard") {
    animateProgressBars();
    buildStreakGrid();
    const savedAvatar = localStorage.getItem("sos_avatar") || "👩‍💻";
    const dashAvatar = clone.querySelector(".dash-avatar");
    if (dashAvatar) dashAvatar.textContent = savedAvatar;
  }
  if (appId === "notes") initNotes();
  if (appId === "timer") initTimer();
  if (appId === "settings") setTimeout(loadSettingsIntoPanel, 0);

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

// build the github-style streak grid!!
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

// 3D canvas-based (just for fuuuunnn)
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

// just a fun little canvas 3d renderer i made for the dashboard
// not using any libs or anything, super basic but looks kinda cool :)
// you can change the shape and color in the 3d app settings!!

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

// this ended up way more complex than i expected, but it was fun to build and looks pretty cool

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
  const rx = threeMouseY * 0.4;
  const ry = threeAngle;
  const fov = 300;
  const latLines = 8;
  const lonLines = 12;
  const segSteps = 48;

  // filled sphere base with radial gradient (shading illusion)
  ctx.beginPath();
  ctx.arc(cx, cy, s, 0, Math.PI * 2);
  const grd = ctx.createRadialGradient(
    cx - s * 0.35,
    cy - s * 0.35,
    s * 0.05,
    cx,
    cy,
    s,
  );
  grd.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.55)`);
  grd.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},0.15)`);
  grd.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.02)`);
  ctx.fillStyle = grd;
  ctx.fill();

  // outer glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, s, 0, Math.PI * 2);
  ctx.strokeStyle = colMain;
  ctx.lineWidth = 2;
  ctx.shadowColor = colMain;
  ctx.shadowBlur = 25;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // helper: project 3D point on sphere surface
  function spherePt(lat, lon) {
    const x = s * Math.cos(lat) * Math.cos(lon);
    const y = s * Math.sin(lat);
    const z = s * Math.cos(lat) * Math.sin(lon);
    const rot = rotatePoint(x, y, z, rx, ry);
    return { proj: project(rot.x, rot.y, rot.z, cx, cy, fov), z: rot.z };
  }

  // latitude lines (horizontal rings)
  for (let i = 1; i < latLines; i++) {
    const lat = -Math.PI / 2 + (i / latLines) * Math.PI;
    ctx.beginPath();
    let first = true;
    for (let j = 0; j <= segSteps; j++) {
      const lon = (j / segSteps) * Math.PI * 2;
      const { proj, z } = spherePt(lat, lon);
      // only draw front-facing segments (z >= 0 in rotated space)
      if (z >= -s * 0.1) {
        if (first) {
          ctx.moveTo(proj.x, proj.y);
          first = false;
        } else ctx.lineTo(proj.x, proj.y);
      } else {
        first = true;
      }
    }
    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // longitude lines (vertical meridians)
  for (let i = 0; i < lonLines; i++) {
    const lon = (i / lonLines) * Math.PI * 2;
    ctx.beginPath();
    let first = true;
    for (let j = 0; j <= segSteps; j++) {
      const lat = -Math.PI / 2 + (j / segSteps) * Math.PI;
      const { proj, z } = spherePt(lat, lon);
      if (z >= -s * 0.1) {
        if (first) {
          ctx.moveTo(proj.x, proj.y);
          first = false;
        } else ctx.lineTo(proj.x, proj.y);
      } else {
        first = true;
      }
    }
    ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // highlight dot (top-left specular)
  const hlGrd = ctx.createRadialGradient(
    cx - s * 0.3,
    cy - s * 0.3,
    0,
    cx - s * 0.3,
    cy - s * 0.3,
    s * 0.4,
  );
  hlGrd.addColorStop(0, `rgba(255,255,255,0.25)`);
  hlGrd.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.beginPath();
  ctx.arc(cx, cy, s, 0, Math.PI * 2);
  ctx.fillStyle = hlGrd;
  ctx.fill();
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
// CHANGE THIS SOON

const playlist = [
  {
    title: "PLACEHOLDER1",
    artist: "PLACEHOLDER1",
    emoji: "🎵",
    file: "music1.mp3",
    img: "image1.jpg",
  },
  {
    title: "PLACEHOLDER2",
    artist: "PLACEHOLDER2",
    emoji: "🌊",
    file: "music2.mp3",
    img: "image2.jpg",
  },
  {
    title: "PLACEHOLDER3",
    artist: "PLACEHOLDER3",
    emoji: "🌙",
    file: "music3.mp3",
    img: "image3.jpg",
  },
  {
    title: "PLACEHOLDER4",
    artist: "PLACEHOLDER4",
    emoji: "🍃",
    file: "music4.mp3",
    img: "image4.jpg",
  },
  {
    title: "PLACEHOLDER5",
    artist: "PLACEHOLDER5",
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

// SETTINGS

const AVATARS = [
  "👩‍💻",
  "👨‍💻",
  "🧑‍💻",
  "👧",
  "👦",
  "🧑",
  "👩‍🎓",
  "👨‍🎓",
  "🐱",
  "🦊",
  "🐼",
  "🌸",
];
let avatarIdx = 0;

function cycleAvatar() {
  avatarIdx = (avatarIdx + 1) % AVATARS.length;
  const el = document.getElementById("settingsAvatar");
  if (el) el.textContent = AVATARS[avatarIdx];
}

function selectStatus(el) {
  document
    .querySelectorAll(".status-opt")
    .forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
}

function saveSettings() {
  const nameEl = document.getElementById("settingsName");
  const name = nameEl ? nameEl.value.trim() || "Student User" : "Student User";

  const selectedOpt = document.querySelector(".status-opt.selected");
  const status = selectedOpt ? selectedOpt.dataset.status : "🍎 STUDYING HARD!";

  const avatar = document.getElementById("settingsAvatar")?.textContent || "👩‍💻";

  // persist to localStorage
  localStorage.setItem("sos_name", name);
  localStorage.setItem("sos_status", status);
  localStorage.setItem("sos_avatar", avatar);
  localStorage.setItem("sos_avatarIdx", avatarIdx);

  applyProfileToUI(name, status, avatar);

  // flash save button
  const btn = document.querySelector(".settings-save-btn");
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = "✅ saved!";
    setTimeout(() => {
      btn.textContent = orig;
    }, 1200);
  }
}

function applyProfileToUI(name, status, avatar) {
  const startName = document.querySelector(".start-name");
  const startStatus = document.querySelector(".start-status");
  const startAvatar = document.querySelector(".start-avatar");
  if (startName) startName.textContent = name;
  if (startStatus) startStatus.textContent = status;
  if (startAvatar) startAvatar.textContent = avatar;

  const dashAvatar = document.querySelector(".dash-avatar");
  if (dashAvatar) dashAvatar.textContent = avatar;
}

function loadSettingsIntoPanel() {
  const name = localStorage.getItem("sos_name") || "Student User";
  const status = localStorage.getItem("sos_status") || "🍎 STUDYING HARD!";
  const avatar = localStorage.getItem("sos_avatar") || "👩‍💻";
  const savedIdx = parseInt(localStorage.getItem("sos_avatarIdx") || "0");

  avatarIdx = savedIdx;

  const nameEl = document.getElementById("settingsName");
  if (nameEl) nameEl.value = name;

  const avatarEl = document.getElementById("settingsAvatar");
  if (avatarEl) avatarEl.textContent = avatar;

  document.querySelectorAll(".status-opt").forEach((o) => {
    o.classList.toggle("selected", o.dataset.status === status);
  });
}

// THEME

let isLightMode = false;

function toggleTheme() {
  isLightMode = !isLightMode;
  document.body.classList.toggle("light-mode", isLightMode);

  // taskbar toggle btn emoji
  const tbBtn = document.getElementById("themeToggleBtn");
  if (tbBtn) tbBtn.textContent = isLightMode ? "☀️" : "🌙";

  // settings label
  const lbl = document.getElementById("settingsThemeLabel");
  if (lbl) lbl.textContent = isLightMode ? "light" : "dark";
}

// BRIGHTNESS
let brightnessLevels = [70, 85, 100, 115];
let brightIdx = 2; // start at 100%

function toggleBrightness() {
  brightIdx = (brightIdx + 1) % brightnessLevels.length;
  applyBrightness(brightnessLevels[brightIdx]);
  // sync slider if settings open
  const slider = document.getElementById("brightnessSlider");
  const val = document.getElementById("brightnessVal");
  if (slider) slider.value = brightnessLevels[brightIdx];
  if (val) val.textContent = brightnessLevels[brightIdx] + "%";
}

function applyBrightness(val) {
  document.body.style.setProperty("--brightness", val / 100);
  const valEl = document.getElementById("brightnessVal");
  if (valEl) valEl.textContent = val + "%";
}

// GUIDE / TOUR SYSTEM
// just a simple array of pages that the start menu guide walks through!
// my vocabulary is a bit basic so "guide" and "tour" are interchangeable here, oops

const guidePages = [
  {
    emoji: "🖥️",
    title: "welcome to studentOS!",
    body: `ok so basically this whole thing is built to feel like a little operating system, but for studying. there's a desktop, draggable windows, a taskbar, the whole deal. it's supposed to make studying feel a bit less boring!<br><br>you can <strong>drag windows</strong> by their title bar, <strong>minimize</strong> them with the _ button, or <strong>close</strong> them with ✕. windows stack on top of each other just like a real OS!`,
    tip: "💡 tip: click a minimized app in the taskbar at the bottom to bring it back up",
  },
  {
    emoji: "📚",
    title: "student dashboard",
    body: `this is like your home base. open it from the desktop icon or the start menu. it shows:<br><br>
<strong>📊 subjects</strong> >> your progress bars for each class. they animate when the window opens which is super satisfying!! <br><br>
<strong>✅ tasks</strong> >> your to-do list. check things off, add new ones with the input at the bottom. checked items get crossed out automatically!<br><br>
<strong>📅 study streak</strong> >> the little grid at the bottom is like a heatmap of your study days (think github contributions but make it school)`,
    tip: "💡 tip: the streak grid shows the last 84 days — darker pink = more studying that day",
  },
  {
    emoji: "⏰",
    title: "study timer (pomodoro!)",
    body: `if you've never heard of the pomodoro technique - basically you study for 25 minutes, take a 5 minute break, repeat. it genuinely works and this timer does it for you!<br><br>
<strong>pomodoro</strong> = 25 min focus session<br>
<strong>short break</strong> = 5 min<br>
<strong>long break</strong> = 15 min (after 4 sessions)<br><br>
the ring around the clock fills up as time passes, and it tracks which session you're on (1 through 4). after 4 pomodoros you've earned a long break!!`,
    tip: "💡 tip: the ring color changes depending on the mode — blue for focus, teal for short break, purple for long",
  },
  {
    emoji: "🎵",
    title: "music player",
    body: `okay this one is just for the funsies and focus!! there are 5 tracks preloaded and you can switch between them in the playlist on the right.<br><br>
there are also 3 <strong>display modes</strong>:<br>
<strong>full player</strong> >> the default, shows album art + controls<br>
<strong>mini</strong> >> hides the now-playing panel, just the playlist<br>
<strong>bg mode</strong> >> completely hides the UI so you can keep the window open without it being in the way<br><br>
the mini player at the bottom right stays visible no matter what, so you can always control playback`,
    tip: "💡 tip: space bar = play/pause, ctrl+→/← = skip forward/back (as long as you're not typing)",
  },
  {
    emoji: "📝",
    title: "notes app",
    body: `quick and simple. just a text area where you can jot stuff down! supports basic formatting:<br><br>
<strong>B</strong> = bold, <strong>I</strong> = italic, <strong>U</strong> = underline<br>
you can also change the text color (cyan, pink, or yellow — very on-brand)<br><br>
the word count updates live at the bottom. and if you want to save what you wrote, hit <strong>💾 save</strong> and it downloads as a .txt file to your computer. it doesn't auto-save between sessions though, so heads up!`,
    tip: "💡 tip: select text first before clicking bold/italic/etc, just like in any normal text editor",
  },
  {
    emoji: "🌌",
    title: "3d interactive mode",
    body: `this one is just for fun honestly. it's a canvas-based 3D renderer (no libraries, built from scratch!!) that renders three shapes:<br><br>
<strong>cube</strong> >> classic 3d shape! spins smoothly with depth shading on each face<br>
<strong>sphere</strong> >> now actually a proper 3D sphere with latitude + longitude wireframe lines that rotate with your mouse<br>
<strong>torus</strong> >> a donut shape. it's the most complex one and it looks kinda hypnotic<br><br>
<strong>move your mouse</strong> over the canvas to tilt it, <strong>scroll</strong> to zoom in/out, and use the color picker to change the glow color`,
    tip: "💡 tip: try the torus with a yellow color!",
  },
  {
    emoji: "⚙️",
    title: "settings + customization",
    body: `you can personalize the OS a little from settings:<br><br>
<strong>👤 profile</strong> >> set your display name and click the avatar to cycle through different emoji avatars. this shows up in the start menu and dashboard<br><br>
<strong>💬 status</strong> >> pick a study mode status (studying hard, light study, resting, etc)<br><br>
<strong>🎨 appearance</strong> >> toggle dark/light mode, adjust brightness<br><br>
<strong>important:</strong> hit <em>save changes</em> to actually keep everything — it saves to your browser so it'll still be there next time you open the page!`,
    tip: "💡 tip: click the avatar emoji in settings to cycle through 12 different options including animals 🐱🦊🐼",
  },
];

let guideCurrent = 0;

// more stuff about guidessss....

function buildGuideSlides() {
  const container = document.getElementById("guideSlides");
  const dots = document.getElementById("guideDots");
  if (!container || !dots) return;

  container.innerHTML = "";
  dots.innerHTML = "";

  guidePages.forEach((page, i) => {
    const slide = document.createElement("div");
    slide.className = "guide-slide" + (i === 0 ? " active" : "");
    slide.id = "gslide-" + i;
    slide.innerHTML = `
      <div class="gslide-emoji">${page.emoji}</div>
      <h3 class="gslide-title">${page.title}</h3>
      <div class="gslide-body">${page.body}</div>
      <div class="gslide-tip">${page.tip}</div>
    `;
    container.appendChild(slide);

    const dot = document.createElement("div");
    dot.className = "guide-dot" + (i === 0 ? " active" : "");
    dot.id = "gdot-" + i;
    dot.onclick = () => goToGuideSlide(i);
    dots.appendChild(dot);
  });
}

// const const CONST!!!!!

function goToGuideSlide(idx) {
  const prev = document.getElementById("gslide-" + guideCurrent);
  const prevDot = document.getElementById("gdot-" + guideCurrent);
  if (prev) prev.classList.remove("active");
  if (prevDot) prevDot.classList.remove("active");

  guideCurrent = idx;

  const next = document.getElementById("gslide-" + guideCurrent);
  const nextDot = document.getElementById("gdot-" + guideCurrent);
  if (next) next.classList.add("active");
  if (nextDot) nextDot.classList.add("active");

  const label = document.getElementById("guidePageLabel");
  if (label) label.textContent = `${guideCurrent + 1} / ${guidePages.length}`;

  const prevBtn = document.getElementById("guidePrevBtn");
  const nextBtn = document.getElementById("guideNextBtn");
  if (prevBtn)
    prevBtn.style.visibility = guideCurrent === 0 ? "hidden" : "visible";
  if (nextBtn)
    nextBtn.textContent =
      guideCurrent === guidePages.length - 1 ? "done ✓" : "next →";
}

function guideStep(dir) {
  const next = guideCurrent + dir;
  if (next >= guidePages.length) {
    closeGuide();
    return;
  }
  if (next < 0) return;
  goToGuideSlide(next);
}

function openGuide() {
  guideCurrent = 0;
  buildGuideSlides();
  const overlay = document.getElementById("guideOverlay");
  if (overlay) {
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => overlay.classList.add("visible"));
  }
  goToGuideSlide(0);
}

function closeGuide() {
  const overlay = document.getElementById("guideOverlay");
  if (overlay) {
    overlay.classList.remove("visible");
    setTimeout(() => overlay.classList.add("hidden"), 280);
  }
}

function startGuide() {
  dismissWelcome();
  setTimeout(openGuide, 200);
}

function dismissWelcome() {
  localStorage.setItem("sos_seen_welcome", "1");
  const modal = document.getElementById("welcomeModal");
  if (modal) {
    modal.classList.add("fade-out");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }
}

function maybeShowWelcome() {
  const seen = localStorage.getItem("sos_seen_welcome");
  if (!seen) {
    const modal = document.getElementById("welcomeModal");
    if (modal) {
      modal.classList.remove("hidden");
      requestAnimationFrame(() => modal.classList.add("visible"));
    }
  }
}
