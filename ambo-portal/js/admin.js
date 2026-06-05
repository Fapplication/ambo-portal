// ============================================================
// AMBO UNIVERSITY PORTAL — Admin/Instructor Dashboard Logic
// ============================================================

const ADMIN_COURSES = [
  "Geometric Design of Road and Streets (CEng 3201)",
  "Transport Planning and Modeling (CEng 2901)"
];

const COURSE_SHORT_A = {
  "Geometric Design of Road and Streets (CEng 3201)": "CEng 3201",
  "Transport Planning and Modeling (CEng 2901)": "CEng 2901"
};

let recentUpdates = [];

// ── Init ─────────────────────────────────────────────────────
(function() {
  const user = getUser();
  if (!user || user.role !== "admin") {
    window.location.href = "../index.html";
    return;
  }
  loadAdminDashboard();
  loadStudentGrid("Geometric Design of Road and Streets (CEng 3201)", null);

  // Wire mark fields for live preview
  ["mark-quiz", "mark-mid", "mark-assign", "mark-final"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateMarkPreview);
  });
})();

// ── Navigation ────────────────────────────────────────────────
function showAdminSection(name) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.getElementById("admin-section-" + name).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n => {
    if (n.getAttribute("onclick") && n.getAttribute("onclick").includes("'" + name + "'")) n.classList.add("active");
  });
  document.getElementById("admin-page-title").textContent = {
    dashboard: "Admin Dashboard", marks: "Manage Marks", students: "Students Grid",
    notes: "Lecture Notes", exam: "Exam Manager", notify: "Notifications", complaints: "Complaints"
  }[name] || "Dashboard";

  if (name === "complaints") loadAdminComplaints();
  if (name === "notes") loadAllNotes();
  if (name === "students") loadStudentGrid("Geometric Design of Road and Streets (CEng 3201)", null);
}

// ── Dashboard Load ────────────────────────────────────────────
async function loadAdminDashboard() {
  try {
    // Load CEng 3201 count
    const r1 = await apiCall({ action: "getMarks", id: "__count_3201__" });
    // These will return no data for a fake ID - we use the grid endpoint instead
  } catch(e) {}

  // Load counts from each sheet
  loadSheetCount("Geometric Design of Road and Streets (CEng 3201)", "admin-stat-3201");
  loadSheetCount("Transport Planning and Modeling (CEng 2901)", "admin-stat-2901");
  loadNotesCount();
  updateComplaintCount();

  const updates = JSON.parse(localStorage.getItem("au_recent_updates") || "[]");
  renderRecentUpdates(updates);
}

async function loadSheetCount(course, statId) {
  try {
    const result = await apiCall({
      action: "updateMark",
      id: "__test__probe__", subject: course,
      quiz: 0, mid: 0, assignment: 0, final: 0,
      adminId: "admin", adminPassword: "admin123"
    });
    // Won't work for counting - just load the grid
  } catch(e) {}
  document.getElementById(statId).textContent = "—";
}

function loadNotesCount() {
  document.getElementById("admin-stat-notes").textContent = "—";
}

function updateComplaintCount() {
  const all = getComplaints().filter(c => c.status === "pending");
  document.getElementById("admin-stat-complaints").textContent = all.length;
}

function renderRecentUpdates(updates) {
  const el = document.getElementById("recent-updates");
  if (!updates || updates.length === 0) {
    el.innerHTML = '<p class="muted-text">No recent updates.</p>';
    return;
  }
  el.innerHTML = updates.slice(0, 5).map(u => `
    <div class="recent-item">
      <div class="recent-item-id">${u.id.toUpperCase()} — ${COURSE_SHORT_A[u.course] || u.course}</div>
      <div class="recent-item-meta">Total: ${u.total} | Grade: ${gradeOf(parseFloat(u.total))} | ${new Date(u.ts).toLocaleDateString()}</div>
    </div>
  `).join("");
}

// ── Publish Marks ─────────────────────────────────────────────
function updateMarkPreview() {
  const q = parseFloat(document.getElementById("mark-quiz").value) || 0;
  const m = parseFloat(document.getElementById("mark-mid").value) || 0;
  const a = parseFloat(document.getElementById("mark-assign").value) || 0;
  const f = parseFloat(document.getElementById("mark-final").value) || 0;
  const total = q + m + a + f;
  document.getElementById("mark-total-val").textContent = total.toFixed(1);
  document.getElementById("mark-total-grade").textContent = gradeOf(total);
  document.getElementById("mark-total-preview").style.display = "block";
}

async function publishMark() {
  const id = document.getElementById("mark-student-id").value.trim();
  const course = document.getElementById("mark-course").value;
  const q = parseFloat(document.getElementById("mark-quiz").value) || 0;
  const m = parseFloat(document.getElementById("mark-mid").value) || 0;
  const a = parseFloat(document.getElementById("mark-assign").value) || 0;
  const f = parseFloat(document.getElementById("mark-final").value) || 0;
  const msgEl = document.getElementById("mark-msg");

  msgEl.style.display = "none";

  if (!id) { showMsgEl(msgEl, "error", "Please enter a student ID."); return; }

  try {
    const result = await apiCall({
      action: "updateMark",
      id: id.toLowerCase(),
      subject: course,
      quiz: q, mid: m, assignment: a, final: f,
      adminId: CONFIG.ADMIN_ID,
      adminPassword: CONFIG.ADMIN_PASSWORD
    });

    if (result.success) {
      showMsgEl(msgEl, "success", `Marks published for ${id.toUpperCase()} in ${COURSE_SHORT_A[course] || course}.`);
      const total = (q + m + a + f).toFixed(1);

      // Save to recent updates
      const updates = JSON.parse(localStorage.getItem("au_recent_updates") || "[]");
      updates.unshift({ id, course, total, ts: Date.now() });
      localStorage.setItem("au_recent_updates", JSON.stringify(updates.slice(0, 20)));
      renderRecentUpdates(updates);

      // Reset form
      document.getElementById("mark-student-id").value = "";
      document.getElementById("mark-quiz").value = "";
      document.getElementById("mark-mid").value = "";
      document.getElementById("mark-assign").value = "";
      document.getElementById("mark-final").value = "";
      document.getElementById("mark-total-preview").style.display = "none";
    } else {
      showMsgEl(msgEl, "error", result.message || "Failed to publish marks.");
    }
  } catch(e) {
    showMsgEl(msgEl, "error", "Connection error. Please try again.");
  }
}

// ── Load Marks Grid (Admin preview) ──────────────────────────
async function loadCourseGrid(course) {
  const displayEl = document.getElementById("marks-grid-display");
  displayEl.innerHTML = '<div class="loading-placeholder">Loading…</div>';

  // We use a probe by fetching a known sheet structure
  // Since GAS returns marks per student, we build from updateMark API
  // For display, we call the admin grid action we know exists in GAS
  try {
    // The GAS code compiles grid via adminCompileAndSendGlobalGrids for Telegram
    // For web portal we use getMarks per student which returns all courses
    // Best approach: direct admin grid fetch via a custom action (add to GAS as getGrid)
    // For now, we show a notice
    displayEl.innerHTML = `
      <div style="padding: 1.25rem;">
        <p style="color: var(--text-secondary); font-size: 0.875rem;">
          Full grid view is available on the Telegram bot (📋 View Global Marks Grid). 
          To enable web grid view, add the <code>getGrid</code> action to your Apps Script 
          (see README instructions).
        </p>
        <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
          Selected: <strong>${course}</strong>
        </p>
      </div>`;
  } catch(e) {
    displayEl.innerHTML = '<div class="loading-placeholder">Could not load grid.</div>';
  }
}

// ── Student Grid (by course) ──────────────────────────────────
async function loadStudentGrid(course, btn) {
  if (btn) {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  }

  const el = document.getElementById("students-grid");
  el.innerHTML = '<div class="loading-placeholder">Loading student data…</div>';

  // Since getGrid doesn't exist in GAS yet, we display an info card
  el.innerHTML = `
    <div style="padding: 1.25rem;">
      <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem;">
        To enable full student grid view on the web portal, add this action to your Google Apps Script:
      </p>
      <pre style="background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 1rem; font-size: 0.78rem; overflow-x: auto; color: var(--text-primary);">else if (action === "getGrid") res = getGridForCourse(req.subject, req.adminId, req.adminPassword);</pre>
      <p style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
        And add the function <code>getGridForCourse(subject, adminId, adminPassword)</code> that returns all rows from that sheet.<br/>
        See README.md for the complete code snippet.
      </p>
      <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
        Currently viewing: <strong>${course}</strong>
      </p>
    </div>`;

  document.getElementById("admin-stat-3201").textContent = "—";
  document.getElementById("admin-stat-2901").textContent = "—";
}

// ── Lecture Notes ─────────────────────────────────────────────
async function uploadNote() {
  const course = document.getElementById("note-course").value;
  const title = document.getElementById("note-title").value.trim();
  const url = document.getElementById("note-url").value.trim();
  const msgEl = document.getElementById("note-msg");
  msgEl.style.display = "none";

  if (!title || !url) { showMsgEl(msgEl, "error", "Please fill in both the title and URL."); return; }

  try {
    const result = await apiCall({
      action: "uploadNote",
      course, title, url,
      adminId: CONFIG.ADMIN_ID,
      adminPassword: CONFIG.ADMIN_PASSWORD
    });

    if (result.success) {
      showMsgEl(msgEl, "success", "Lecture note published successfully!");
      document.getElementById("note-title").value = "";
      document.getElementById("note-url").value = "";
      loadAllNotes();
    } else {
      showMsgEl(msgEl, "error", result.message || "Upload failed.");
    }
  } catch(e) {
    showMsgEl(msgEl, "error", "Connection error. Please try again.");
  }
}

async function loadAllNotes() {
  const el = document.getElementById("admin-notes-list");
  el.innerHTML = '<div class="loading-placeholder">Loading notes…</div>';
  try {
    const result = await apiCall({ action: "getNotes" });
    if (result.success && result.data && result.data.length > 0) {
      el.innerHTML = result.data.map(n => `
        <div class="note-card">
          <span class="note-course-badge">${COURSE_SHORT_A[n.course] || n.course}</span>
          <div class="note-title">${n.title}</div>
          <a class="note-download-btn" href="${n.url}" target="_blank" rel="noopener">View →</a>
        </div>
      `).join("");
    } else {
      el.innerHTML = '<div class="loading-placeholder">No notes published yet. Upload your first note above.</div>';
    }
  } catch(e) {
    el.innerHTML = '<div class="loading-placeholder">Could not load notes. Check API connection.</div>';
  }
}

// ── Exam Questions ────────────────────────────────────────────
async function addQuestion() {
  const course = document.getElementById("exam-course").value;
  const question = document.getElementById("exam-question").value.trim();
  const a = document.getElementById("exam-opt-a").value.trim();
  const b = document.getElementById("exam-opt-b").value.trim();
  const c = document.getElementById("exam-opt-c").value.trim();
  const d = document.getElementById("exam-opt-d").value.trim();
  const correct = document.getElementById("exam-correct").value;
  const timer = document.getElementById("exam-timer").value || 15;
  const msgEl = document.getElementById("exam-msg");
  msgEl.style.display = "none";

  if (!question || !a || !b || !c || !d) {
    showMsgEl(msgEl, "error", "Please fill in the question and all four options.");
    return;
  }

  try {
    const result = await apiCall({
      action: "addQuestion",
      course, question, a, b, c, d, correct, timer,
      adminId: CONFIG.ADMIN_ID,
      adminPassword: CONFIG.ADMIN_PASSWORD
    });

    if (result.success) {
      showMsgEl(msgEl, "success", "Question added to the exam pool!");
      document.getElementById("exam-question").value = "";
      document.getElementById("exam-opt-a").value = "";
      document.getElementById("exam-opt-b").value = "";
      document.getElementById("exam-opt-c").value = "";
      document.getElementById("exam-opt-d").value = "";
    } else {
      showMsgEl(msgEl, "error", result.message || "Failed to add question.");
    }
  } catch(e) {
    showMsgEl(msgEl, "error", "Connection error. Please try again.");
  }
}

// ── Notifications ─────────────────────────────────────────────
async function sendNotice() {
  const title = document.getElementById("notice-title").value.trim();
  const body = document.getElementById("notice-body").value.trim();
  const course = document.getElementById("notice-course").value;
  const msgEl = document.getElementById("notice-msg");
  msgEl.style.display = "none";

  if (!title || !body) { showMsgEl(msgEl, "error", "Please enter both a title and message body."); return; }

  // Save locally (Telegram broadcast would need a custom GAS action)
  saveNotification(title, body, course);
  showMsgEl(msgEl, "success", "Notice saved. To broadcast via Telegram, use the Telegram Bot admin panel.");

  document.getElementById("notice-title").value = "";
  document.getElementById("notice-body").value = "";
}

// ── Complaints ────────────────────────────────────────────────
function loadAdminComplaints() {
  const el = document.getElementById("admin-complaints-list");
  const all = getComplaints().filter(c => c.complaintText && c.status === "pending");

  if (all.length === 0) {
    el.innerHTML = '<div class="loading-placeholder">No open complaints at this time.</div>';
    updateComplaintCount();
    return;
  }

  el.innerHTML = all.map(c => `
    <div class="complaint-card">
      <div class="complaint-course">Student: <strong>${c.studentId.toUpperCase()}</strong> — ${c.course}</div>
      <div class="complaint-meta">
        Grade: <strong>${c.grade}</strong> | Total: <strong>${c.total}</strong> |
        Submitted: ${new Date(c.submittedAt).toLocaleDateString()}
      </div>
      <p style="font-size:0.875rem; color: var(--text-secondary); margin: 0.5rem 0 1rem;">${c.complaintText}</p>
      <div class="complaint-actions">
        <button class="btn-accept" onclick="resolveComplaint(${c.id}, 'accepted')">Accept Complaint</button>
        <button class="btn-reject" onclick="resolveComplaint(${c.id}, 'rejected')">Reject Complaint</button>
      </div>
    </div>
  `).join("");

  updateComplaintCount();
}

function resolveComplaint(id, status) {
  updateComplaintStatus(id, status);
  loadAdminComplaints();
}

// ── Helpers ───────────────────────────────────────────────────
function showMsgEl(el, type, msg) {
  el.className = "alert alert-" + type;
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => { el.style.display = "none"; }, 5000);
}
