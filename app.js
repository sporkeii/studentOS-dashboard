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
      savedStatus || "🟢 studying hard",
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
    initDashboard();
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

// =============================================
// DASHBOARD — SUBJECTS + TASKS SYSTEM
// =============================================

const SUBJECT_COLORS = {
  Mathematics: "#00ffcc",
  Science: "#ff6eb4",
  English: "#ffe066",
  MSCS: "#a78bfa",
  ICT: "#38bdf8",
  "TLE/Robotics": "#fb923c",
  Filipino: "#f472b6",
  "AP/ESP": "#34d399",
};

// Task types and their weight ranges
// PETA/project: 60-80%, notebook/book: 30-40%, other: 20-30%
function getTaskWeight(name) {
  const n = name.toLowerCase();
  if (n.includes("peta") || n.includes("project") || n.includes("codemonkey"))
    return 0.7;
  if (n.includes("notebook") || n.includes("book") || n.includes("journal"))
    return 0.35;
  return 0.25;
}

// Initial subject task data
const DEFAULT_SUBJECT_TASKS = {
  Mathematics: [
    { name: "math notebook", done: true },
    { name: "math exercises", done: false },
    { name: "math PETA", done: true },
  ],
  Science: [
    { name: "science notebook", done: true },
    { name: "science PETA", done: true },
    { name: "reflection", done: true },
  ],
  English: [
    { name: "english notebook", done: true },
    { name: "english PETA", done: false },
    { name: "iready", done: true },
  ],
  MSCS: [
    { name: "mscs notebook", done: false },
    { name: "mscs book", done: true },
  ],
  ICT: [
    { name: "ICT coding project", done: false },
    { name: "ICT notes", done: true },
  ],
  "TLE/Robotics": [
    { name: "TLE journal", done: true },
    { name: "TLE notes", done: true },
    { name: "robotics codemonkey", done: true },
  ],
  Filipino: [
    { name: "filipino notes", done: true },
    { name: "filipino PETA", done: true },
  ],
  "AP/ESP": [
    { name: "ap notes", done: false },
    { name: "esp notes", done: true },
  ],
};

const DEFAULT_GENERAL_TASKS = [
  { name: "EXAMS!!!!!!", done: false },
  { name: "study streak 💪", done: false },
];

let activeSubject = "Mathematics";

function loadSubjectTasks() {
  try {
    const saved = localStorage.getItem("sos_subject_tasks");
    return saved
      ? JSON.parse(saved)
      : JSON.parse(JSON.stringify(DEFAULT_SUBJECT_TASKS));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_SUBJECT_TASKS));
  }
}
function saveSubjectTasks(data) {
  localStorage.setItem("sos_subject_tasks", JSON.stringify(data));
}

function loadGeneralTasks() {
  try {
    const saved = localStorage.getItem("sos_general_tasks");
    return saved
      ? JSON.parse(saved)
      : JSON.parse(JSON.stringify(DEFAULT_GENERAL_TASKS));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_GENERAL_TASKS));
  }
}
function saveGeneralTasks(data) {
  localStorage.setItem("sos_general_tasks", JSON.stringify(data));
}

// Compute weighted completion % for a subject
function calcSubjectPct(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  let totalW = 0,
    doneW = 0;
  tasks.forEach((t) => {
    const w = getTaskWeight(t.name);
    totalW += w;
    if (t.done) doneW += w;
  });
  return totalW === 0 ? 0 : Math.round((doneW / totalW) * 100);
}

function buildSubjectTabs() {
  const container = document.getElementById("subjTabs");
  if (!container) return;
  container.innerHTML = "";
  const subjects = Object.keys(SUBJECT_COLORS);
  subjects.forEach((subj) => {
    const btn = document.createElement("button");
    btn.className = "subj-tab-btn" + (subj === activeSubject ? " active" : "");
    btn.textContent = subj;
    btn.style.setProperty("--sc", SUBJECT_COLORS[subj]);
    btn.onclick = () => {
      activeSubject = subj;
      document
        .querySelectorAll(".subj-tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderSubjectDetail();
    };
    container.appendChild(btn);
  });
}

function renderSubjectDetail() {
  const panel = document.getElementById("subjDetail");
  if (!panel) return;
  const subjectData = loadSubjectTasks();
  const tasks = subjectData[activeSubject] || [];
  const pct = calcSubjectPct(tasks);
  const color = SUBJECT_COLORS[activeSubject];
  const allDone = tasks.length > 0 && tasks.every((t) => t.done);

  panel.innerHTML = `
    <div class="subj-detail-header">
      <span class="subj-detail-name" style="color:${color}">${activeSubject}</span>
      <span class="subj-detail-pct" style="color:${color}">${pct}%</span>
    </div>
    <div class="prog-bar subj-prog-bar">
      <div class="prog-fill" style="width:${pct}%;--c:${color};"></div>
    </div>
    <div class="subj-task-list" id="subjTaskList">
      ${tasks
        .map(
          (t, i) => `
        <div class="task-row" id="strow-${i}">
          <label class="task-item${t.done ? " struck" : ""}">
            <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleSubjTask(${i},this)" />
            ${t.name}
            <span class="task-type-badge">${getTaskBadge(t.name)}</span>
          </label>
          <button class="task-del-btn" onclick="deleteSubjTask(${i})" title="delete">✕</button>
        </div>
      `,
        )
        .join("")}
    </div>
    ${allDone ? `<div class="tasks-all-done">🎉 tasks completed!</div>` : ""}
    <div class="add-task subj-add-task">
      <input type="text" id="newSubjTaskInput" placeholder="add task for ${activeSubject}..." />
      <button onclick="addSubjTask()">+</button>
    </div>
  `;

  // animate prog bar
  const fill = panel.querySelector(".prog-fill");
  if (fill) {
    fill.style.width = "0%";
    requestAnimationFrame(() =>
      setTimeout(() => {
        fill.style.width = pct + "%";
      }, 30),
    );
  }
}

function getTaskBadge(name) {
  const n = name.toLowerCase();
  if (n.includes("peta") || n.includes("project") || n.includes("codemonkey"))
    return "PETA";
  if (n.includes("notebook") || n.includes("book") || n.includes("journal"))
    return "notes";
  return "other";
}

function toggleSubjTask(idx, cb) {
  const subjectData = loadSubjectTasks();
  if (!subjectData[activeSubject]) return;
  subjectData[activeSubject][idx].done = cb.checked;
  saveSubjectTasks(subjectData);
  renderSubjectDetail();
  updateDashSubLine();
}

function deleteSubjTask(idx) {
  const subjectData = loadSubjectTasks();
  if (!subjectData[activeSubject]) return;
  subjectData[activeSubject].splice(idx, 1);
  saveSubjectTasks(subjectData);
  renderSubjectDetail();
  updateDashSubLine();
}

function addSubjTask() {
  const input = document.getElementById("newSubjTaskInput");
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  const subjectData = loadSubjectTasks();
  if (!subjectData[activeSubject]) subjectData[activeSubject] = [];
  subjectData[activeSubject].push({ name: val, done: false });
  saveSubjectTasks(subjectData);
  input.value = "";
  renderSubjectDetail();
  updateDashSubLine();
}

// General tasks
function renderGeneralTasks() {
  const list = document.getElementById("generalTaskList");
  if (!list) return;
  const tasks = loadGeneralTasks();
  list.innerHTML = tasks
    .map(
      (t, i) => `
    <div class="task-row">
      <label class="task-item${t.done ? " struck" : ""}">
        <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleGenTask(${i},this)" />
        ${t.name}
      </label>
      <button class="task-del-btn" onclick="deleteGenTask(${i})" title="delete">✕</button>
    </div>
  `,
    )
    .join("");

  const allDoneEl = document.getElementById("generalAllDone");
  const allDone = tasks.length > 0 && tasks.every((t) => t.done);
  if (allDoneEl) allDoneEl.classList.toggle("hidden", !allDone);
}

function toggleGenTask(idx, cb) {
  const tasks = loadGeneralTasks();
  tasks[idx].done = cb.checked;
  saveGeneralTasks(tasks);
  renderGeneralTasks();
  updateDashSubLine();
}

function deleteGenTask(idx) {
  const tasks = loadGeneralTasks();
  tasks.splice(idx, 1);
  saveGeneralTasks(tasks);
  renderGeneralTasks();
  updateDashSubLine();
}

function addGeneralTask() {
  const input = document.getElementById("newGenTaskInput");
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  const tasks = loadGeneralTasks();
  tasks.push({ name: val, done: false });
  saveGeneralTasks(tasks);
  input.value = "";
  renderGeneralTasks();
  updateDashSubLine();
}

function updateDashSubLine() {
  const el = document.getElementById("dashSubLine");
  if (!el) return;
  const genTasks = loadGeneralTasks();
  const pending = genTasks.filter((t) => !t.done).length;
  const subjectData = loadSubjectTasks();
  const allSubjPct = Object.keys(subjectData).map((s) =>
    calcSubjectPct(subjectData[s]),
  );
  const avgPct = allSubjPct.length
    ? Math.round(allSubjPct.reduce((a, b) => a + b, 0) / allSubjPct.length)
    : 0;
  el.innerHTML = `<span class="accent">${pending} general task${pending !== 1 ? "s" : ""}</span> pending · avg completion: <span class="streak">${avgPct}%</span>`;
}

function animateProgressBars() {
  // now handled per-subject in renderSubjectDetail
}

function strikeTask(checkbox) {
  const label = checkbox.closest("label");
  if (label) label.classList.toggle("struck", checkbox.checked);
}

function addTask() {
  // legacy — redirect to general
  addGeneralTask();
}

// Full dashboard init
function initDashboard() {
  buildSubjectTabs();
  renderSubjectDetail();
  renderGeneralTasks();
  updateDashSubLine();
  buildStreakGrid();
  const savedAvatar = localStorage.getItem("sos_avatar") || "👩‍💻";
  const dashAvatar = document.querySelector(".dash-avatar");
  if (dashAvatar) dashAvatar.textContent = savedAvatar;
}

// STREAK SYSTEM
function getStreakData() {
  try {
    return JSON.parse(localStorage.getItem("sos_streak") || "{}");
  } catch {
    return {};
  }
}

function saveStreakData(data) {
  localStorage.setItem("sos_streak", JSON.stringify(data));
}

function dateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function friendlyDate(daysAgo) {
  if (daysAgo === 0) return "today";
  if (daysAgo === 1) return "yesterday";
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function logStudyToday() {
  const data = getStreakData();
  const key = dateKey(0);
  const lvl = data[key] || 0;
  data[key] = Math.min(lvl + 1, 4); // each click increases intensity, max 4
  saveStreakData(data);
  buildStreakGrid();

  const btn = document.getElementById("streakLogBtn");
  if (btn) {
    btn.textContent = "✅ logged!";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = "+ log today";
      btn.disabled = false;
    }, 1500);
  }
}

function buildStreakGrid() {
  const grid = document.getElementById("streakGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const data = getStreakData();

  // seed realistic-looking historical data if empty
  if (Object.keys(data).length === 0) {
    for (let i = 83; i >= 0; i--) {
      const rand = Math.random();
      let lvl = 0;
      if (rand > 0.55) lvl = 1;
      if (rand > 0.72) lvl = 2;
      if (rand > 0.86) lvl = 3;
      if (rand > 0.95) lvl = 4;
      if (i < 12) lvl = Math.max(lvl, 2); // recent streak
      if (lvl > 0) data[dateKey(i)] = lvl;
    }
    saveStreakData(data);
  }

  // build grid — 84 days (12 weeks)
  for (let i = 83; i >= 0; i--) {
    const key = dateKey(i);
    const lvl = data[key] || 0;
    const d = document.createElement("div");
    d.className = `streak-day streak-${lvl}`;

    const label = friendlyDate(i);
    const studyLabel =
      lvl === 0
        ? "no study logged"
        : lvl === 1
          ? "light study"
          : lvl === 2
            ? "solid session"
            : lvl === 3
              ? "great studying!"
              : "🔥 intense grind!";
    d.title = `${label} · ${studyLabel}`;

    if (i === 0) {
      d.classList.add("streak-today");
      d.title = `today · ${studyLabel} (click + log today to record)`;
    }

    grid.appendChild(d);
  }

  updateStreakStats(data);
}

function updateStreakStats(data) {
  // calculate current streak (consecutive days going back from today)
  let current = 0;
  for (let i = 0; i < 84; i++) {
    if (data[dateKey(i)]) current++;
    else break;
  }

  // calculate best streak
  let best = 0,
    run = 0;
  for (let i = 83; i >= 0; i--) {
    if (data[dateKey(i)]) {
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }

  const total = Object.keys(data).filter((k) => data[k] > 0).length;

  const elCurrent = document.getElementById("streakCurrent");
  const elBest = document.getElementById("streakBest");
  const elTotal = document.getElementById("streakTotal");
  const elTip = document.getElementById("streakTip");

  if (elCurrent) elCurrent.textContent = current;
  if (elBest) elBest.textContent = Math.max(best, 21); // keep 21 as floor for demo
  if (elTotal) elTotal.textContent = Math.max(total, 47);

  if (elTip) {
    const todayLogged = !!data[dateKey(0)];
    if (todayLogged && current > 0) {
      elTip.textContent = `✅ today's session logged! ${current}-day streak going strong 💪`;
    } else if (current > 0) {
      elTip.textContent = `⚠️ you're on a ${current}-day streak — don't forget to log today!`;
    } else {
      elTip.textContent = `👋 no streak yet — hit "+ log today" after studying to start one!`;
    }
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

// this ended up way more complex than i expected, but it was fun to build and looks pretty cool..
// bit buggy though

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

// bit more buggy >> need fixx

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
const playlist = [
  {
    title: "terr et tiwa dorment",
    artist: "alain goraguer",
    emoji: "🌙",
    file: "music/music1.mp3",
    img: "images/image1.jpg",
    duration: 49,
  },
  {
    title: "la dolce vita",
    artist: "pino calvi",
    emoji: "🌸",
    file: "music/music2.mp3",
    img: "images/image2.jpg",
    duration: 57,
  },
  {
    title: "nata ni thlae",
    artist: "yinyin",
    emoji: "🌿",
    file: "music/music3.mp3",
    img: "images/image3.jpg",
    duration: 54,
  },
  {
    title: "rosalie est partie",
    artist: "philippe sarde",
    emoji: "🌹",
    file: "music/music4.mp3",
    img: "images/image4.jpg",
    duration: 57,
  },
  {
    title: "souped up",
    artist: "michael giacchino",
    emoji: "🚀",
    file: "music/music5.mp3",
    img: "images/image5.jpg",
    duration: 50,
  },
];

let currentSong = 0;
let isPlaying = false;
let isShuffle = false;
let isLoop = false;
let bgMuted = false;
let musicMode = "full";

// real audio element
let audioEl = null;
let progRafId = null;

function getAudio() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener("ended", () => {
      if (isLoop) {
        audioEl.currentTime = 0;
        audioEl.play().catch(() => {});
      } else {
        nextSong();
      }
    });
    audioEl.addEventListener("timeupdate", updateProgressBar);
    audioEl.addEventListener("loadedmetadata", () => {
      // update total time display once we know actual duration
      const totalEl = document.querySelector(".prog-total");
      if (totalEl) totalEl.textContent = formatTime(audioEl.duration);
    });
  }
  return audioEl;
}

function formatTime(secs) {
  if (!isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = String(Math.floor(secs % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

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

    const coverHtml = `<div class="pl-cover">
      <img src="${song.img}" alt="${song.title}" onerror="this.style.display='none'" />
    </div>`;

    const dur = formatTime(song.duration);

    item.innerHTML = `
      <div class="pl-num">${i + 1}</div>
      ${coverHtml}
      <div class="pl-info">
        <div class="pl-title">${song.title}</div>
        <div class="pl-artist">${song.artist}</div>
      </div>
      <div class="pl-dur">${dur}</div>
      <div class="pl-playing-indicator" id="pli-${i}" style="display:${i === currentSong && isPlaying ? "flex" : "none"}">
        <span></span><span></span><span></span>
      </div>
    `;
    container.appendChild(item);
  });
}

function selectSong(i) {
  const wasPlaying = isPlaying;
  currentSong = i;
  loadCurrentSong();
  updateNowPlaying();
  updatePlaylistHighlight();
  if (wasPlaying) {
    const audio = getAudio();
    audio.play().catch(() => {});
    isPlaying = true;
    setPlayingUI(true);
  }
}

function loadCurrentSong() {
  const audio = getAudio();
  const song = playlist[currentSong];
  audio.src = song.file;
  audio.load();
  updateProgressBar();
  // update total duration display from metadata hint
  const totalEl = document.querySelector(".prog-total");
  if (totalEl) totalEl.textContent = formatTime(song.duration);
}

function updateNowPlaying() {
  const song = playlist[currentSong];
  const npTitle = document.getElementById("npTitle");
  const npArtist = document.getElementById("npArtist");
  const albumEmoji = document.getElementById("albumEmoji");

  if (npTitle) npTitle.textContent = song.title;
  if (npArtist) npArtist.textContent = song.artist;
  if (albumEmoji) {
    albumEmoji.innerHTML = `<img src="${song.img}" alt="${song.title}"
      style="width:100%;height:100%;object-fit:cover;border-radius:50%;"
      onerror="this.style.display='none'" />`;
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

function setPlayingUI(playing) {
  const playBtn = document.getElementById("playBtn");
  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const albumArt = document.getElementById("albumArt");
  const eqBars = document.getElementById("eqBars");
  const miniEq = document.getElementById("miniEq");

  if (playBtn) playBtn.textContent = playing ? "⏸" : "▶";
  if (miniPlayBtn) miniPlayBtn.textContent = playing ? "⏸" : "▶";
  if (albumArt) albumArt.classList.toggle("playing", playing);
  if (eqBars) eqBars.classList.toggle("active", playing);
  if (miniEq) miniEq.classList.toggle("playing", playing);
}

function togglePlay() {
  const audio = getAudio();

  if (!audio.src || audio.src === window.location.href) {
    // first play — load the current song
    loadCurrentSong();
  }

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play().catch((err) => {
      console.warn("audio play failed:", err);
    });
    isPlaying = true;
  }

  setPlayingUI(isPlaying);
  updatePlaylistHighlight();
}

function updateProgressBar() {
  const audio = getAudio();
  const duration =
    isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : playlist[currentSong].duration;
  const current = audio.currentTime || 0;
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  const fill = document.getElementById("progFill");
  const dot = document.getElementById("progDot");
  const timeEl = document.getElementById("progTime");

  if (fill) fill.style.width = pct + "%";
  if (dot) dot.style.left = pct + "%";
  if (timeEl) timeEl.textContent = formatTime(current);
}

function seekTrack(e) {
  const track = document.getElementById("progTrack");
  if (!track) return;
  const audio = getAudio();
  const rect = track.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const duration =
    isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : playlist[currentSong].duration;
  audio.currentTime = pct * duration;
  updateProgressBar();
}

function nextSong() {
  if (isShuffle) {
    currentSong = Math.floor(Math.random() * playlist.length);
  } else {
    currentSong = (currentSong + 1) % playlist.length;
  }
  loadCurrentSong();
  updateNowPlaying();
  if (isPlaying) {
    getAudio()
      .play()
      .catch(() => {});
  }
}

function prevSong() {
  const audio = getAudio();
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentSong = (currentSong - 1 + playlist.length) % playlist.length;
  loadCurrentSong();
  updateNowPlaying();
  if (isPlaying) {
    audio.play().catch(() => {});
  }
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById("shuffleBtn");
  if (btn) btn.classList.toggle("active-ctrl", isShuffle);
}

function toggleLoop() {
  isLoop = !isLoop;
  const audio = getAudio();
  // don't set audio.loop — we handle it manually in "ended" so nextSong still works for non-loop
  const btn = document.getElementById("loopBtn");
  if (btn) btn.classList.toggle("active-ctrl", isLoop);
}

function setVolume(val) {
  const audio = getAudio();
  audio.volume = val;
  const icon = document.getElementById("volIcon");
  if (!icon) return;
  if (val == 0) icon.textContent = "🔇";
  else if (val < 0.4) icon.textContent = "🔉";
  else icon.textContent = "🔊";
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
  const audio = getAudio();
  audio.muted = bgMuted;
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
  if (miniAlbum) miniAlbum.innerHTML = `<span class="mini-note">♪</span>`;
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

// =============================================
// GUIDE / TOUR SYSTEM
// =============================================

const guidePages = [
  {
    emoji: "🖥️",
    title: "welcome to StudentOS!",
    body: `ok so basically this whole thing is built to feel like a little operating system, but for studying. there's a desktop, draggable windows, a taskbar, the whole deal. it's supposed to make studying feel a bit less boring lol.<br><br>you can <strong>drag windows</strong> by their title bar, <strong>minimize</strong> them with the _ button, or <strong>close</strong> them with ✕. windows stack on top of each other just like a real OS!`,
    tip: "💡 tip: click a minimized app in the taskbar at the bottom to bring it back up",
  },
  {
    emoji: "📚",
    title: "student dashboard",
    body: `this is like your home base. open it from the desktop icon or the start menu. it shows:<br><br>
<strong>📊 subjects</strong> — your progress bars for each class. they animate when the window opens which is super satisfying ngl<br><br>
<strong>✅ tasks</strong> — your to-do list. check things off, add new ones with the input at the bottom. checked items get crossed out automatically!<br><br>
<strong>📅 study streak</strong> — the little grid at the bottom is like a heatmap of your study days (think github contributions but make it school)`,
    tip: "💡 tip: the streak grid shows the last 84 days — darker pink = more studying that day",
  },
  {
    emoji: "⏰",
    title: "study timer (pomodoro!)",
    body: `if you've never heard of the pomodoro technique — basically you study for 25 minutes, take a 5 minute break, repeat. it genuinely works and this timer does it for you.<br><br>
<strong>pomodoro</strong> = 25 min focus session<br>
<strong>short break</strong> = 5 min<br>
<strong>long break</strong> = 15 min (after 4 sessions)<br><br>
the ring around the clock fills up as time passes, and it tracks which session you're on (1 through 4). after 4 pomodoros you've earned a long break!!`,
    tip: "💡 tip: the ring color changes depending on the mode — blue for focus, teal for short break, purple for long",
  },
  {
    emoji: "🎵",
    title: "music player",
    body: `okay this one is just for vibes. there are 5 tracks preloaded and you can switch between them in the playlist on the right.<br><br>
there are also 3 <strong>display modes</strong>:<br>
<strong>full player</strong> — the default, shows album art + controls<br>
<strong>mini</strong> — hides the now-playing panel, just the playlist<br>
<strong>bg mode</strong> — completely hides the UI so you can keep the window open without it being in the way<br><br>
the mini player at the bottom right stays visible no matter what, so you can always control playback`,
    tip: "💡 tip: space bar = play/pause, ctrl+→/← = skip forward/back (as long as you're not typing)",
  },
  {
    emoji: "📝",
    title: "notes app",
    body: `quick and simple. just a text area where you can jot stuff down. supports basic formatting:<br><br>
<strong>B</strong> = bold, <strong>I</strong> = italic, <strong>U</strong> = underline<br>
you can also change the text color (cyan, pink, or yellow — very on-brand)<br><br>
the word count updates live at the bottom. and if you want to save what you wrote, hit <strong>💾 save</strong> and it downloads as a .txt file to your computer. it doesn't auto-save between sessions though, so heads up!`,
    tip: "💡 tip: select text first before clicking bold/italic/etc, just like in any normal text editor",
  },
  {
    emoji: "🌌",
    title: "3d interactive mode",
    body: `this one is just for fun honestly. it's a canvas-based 3D renderer (no libraries, built from scratch!!) that renders three shapes:<br><br>
<strong>cube</strong> — classic. spins smoothly with depth shading on each face<br>
<strong>sphere</strong> — now actually a proper 3D sphere with latitude + longitude wireframe lines that rotate with your mouse<br>
<strong>torus</strong> — a donut shape. it's the most complex one and it looks kinda hypnotic<br><br>
<strong>move your mouse</strong> over the canvas to tilt it, <strong>scroll</strong> to zoom in/out, and use the color picker to change the glow color`,
    tip: "💡 tip: try the torus with a yellow color. you're welcome",
  },
  {
    emoji: "⚙️",
    title: "settings + customization",
    body: `you can personalize the OS a little from settings:<br><br>
<strong>👤 profile</strong> — set your display name and click the avatar to cycle through different emoji avatars. this shows up in the start menu and dashboard<br><br>
<strong>💬 status</strong> — pick a study mode status (studying hard, light study, resting, etc)<br><br>
<strong>🎨 appearance</strong> — toggle dark/light mode, adjust brightness<br><br>
<strong>important:</strong> hit <em>save changes</em> to actually keep everything — it saves to your browser so it'll still be there next time you open the page!`,
    tip: "💡 tip: click the avatar emoji in settings to cycle through 12 different options including animals 🐱🦊🐼",
  },
  {
    emoji: "🎨",
    title: "one last thing — pick your vibe!",
    body: `before you dive in, choose how you want studentOS to look. you can always change it later from settings or the 🌙 button in the taskbar.<br><br>pick whichever feels right for your studying environment :)`,
    tip: "💡 tip: dark mode is easier on your eyes at night, light mode is great in bright rooms!",
    isThemePicker: true,
  },
];

let guideCurrent = 0;

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

  const isLast = guideCurrent === guidePages.length - 1;
  const isThemePicker = guidePages[guideCurrent].isThemePicker;

  // show/hide theme picker
  const picker = document.getElementById("guideThemePicker");
  if (picker) picker.classList.toggle("hidden", !isThemePicker);

  if (nextBtn) {
    if (isThemePicker) {
      nextBtn.style.display = "none";
    } else {
      nextBtn.style.display = "";
      nextBtn.textContent = isLast ? "done ✓" : "next →";
    }
  }

  // highlight current theme in picker
  if (isThemePicker) {
    const darkBtn = document.getElementById("guidePickDark");
    const lightBtn = document.getElementById("guidePickLight");
    if (darkBtn) darkBtn.classList.toggle("selected", !isLightMode);
    if (lightBtn) lightBtn.classList.toggle("selected", isLightMode);
  }
}

function guidePickTheme(mode) {
  const wantLight = mode === "light";
  if (wantLight !== isLightMode) {
    toggleTheme();
  }
  // highlight selection
  const darkBtn = document.getElementById("guidePickDark");
  const lightBtn = document.getElementById("guidePickLight");
  if (darkBtn) darkBtn.classList.toggle("selected", !wantLight);
  if (lightBtn) lightBtn.classList.toggle("selected", wantLight);

  // after a brief moment, close the guide
  setTimeout(closeGuide, 400);
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
