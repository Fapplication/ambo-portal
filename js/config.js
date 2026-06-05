// ============================================================
// AMBO UNIVERSITY PORTAL — Configuration
// ============================================================
// IMPORTANT: Replace the API_URL below with your deployed
// Google Apps Script Web App URL after deployment.
// ============================================================

const CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbxag3kbACfwOiA7zc4pEHY-euD0lZ9E2sv0RmzAqWxajxzw2xPzPE5ZPTdDcJPhkPrT/exec",
  ADMIN_ID: "admin",
  ADMIN_PASSWORD: "admin123"
};

// ── Shared API caller ────────────────────────────────────────
async function apiCall(payload) {
  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

// ── Session helpers ──────────────────────────────────────────
function saveUser(data) {
  sessionStorage.setItem("au_user", JSON.stringify(data));
}

function getUser() {
  try { return JSON.parse(sessionStorage.getItem("au_user")); }
  catch(e) { return null; }
}

function clearUser() {
  sessionStorage.removeItem("au_user");
}

// ── Grade helper ─────────────────────────────────────────────
function gradeOf(total) {
  if (total >= 90) return "A";
  if (total >= 80) return "B";
  if (total >= 70) return "C";
  if (total >= 60) return "D";
  return "F";
}

function gradeColor(grade) {
  const map = { A: "#276749", B: "#2B6CB0", C: "#744210", D: "#975A16", F: "#C53030" };
  return map[grade] || "#4A5568";
}

// ── Complaint storage (local — no backend change needed) ─────
function saveComplaint(courseId, text, grade, total) {
  const existing = getComplaints();
  const user = getUser();
  existing.push({
    id: Date.now(),
    studentId: user ? user.id : "",
    course: courseId,
    grade,
    total,
    complaintText: text,
    status: "pending",
    submittedAt: new Date().toISOString()
  });
  localStorage.setItem("au_complaints", JSON.stringify(existing));
}

function getComplaints() {
  try { return JSON.parse(localStorage.getItem("au_complaints")) || []; }
  catch(e) { return []; }
}

function updateComplaintStatus(id, status) {
  const all = getComplaints();
  const idx = all.findIndex(c => c.id === id);
  if (idx !== -1) { all[idx].status = status; localStorage.setItem("au_complaints", JSON.stringify(all)); }
}

// ── Notification store ────────────────────────────────────────
function saveNotification(title, body, course) {
  const existing = getNotifications();
  existing.unshift({ id: Date.now(), title, body, course, sentAt: new Date().toISOString() });
  localStorage.setItem("au_notifications", JSON.stringify(existing.slice(0, 50)));
}

function getNotifications() {
  try { return JSON.parse(localStorage.getItem("au_notifications")) || []; }
  catch(e) { return []; }
}

// ── Toggle sidebar (mobile) ──────────────────────────────────
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

// ── Toggle password visibility ───────────────────────────────
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === "password") { input.type = "text"; btn.textContent = "🙈"; }
  else { input.type = "password"; btn.textContent = "👁"; }
}

// ── Generic modal close ──────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

// ── doLogout ─────────────────────────────────────────────────
function doLogout() {
  clearUser();
  window.location.href = isInPages() ? "../index.html" : "index.html";
}

function isInPages() {
  return window.location.pathname.includes("/pages/");
}
