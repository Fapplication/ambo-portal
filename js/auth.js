// ============================================================
// AMBO UNIVERSITY PORTAL — Auth Logic
// ============================================================

// Redirect if already logged in
(function() {
  const user = getUser();
  if (user) {
    if (user.role === "admin") window.location.href = "pages/admin.html";
    else window.location.href = "pages/student.html";
  }
})();

function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
  const target = document.getElementById("tab-" + tabName);
  if (target) target.classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(btn => {
    if (btn.textContent.toLowerCase().includes(tabName) ||
        (tabName === "login" && btn.textContent === "Sign In") ||
        (tabName === "register" && btn.textContent === "Register")) {
      btn.classList.add("active");
    }
  });
  // Clear all alerts on tab switch
  document.querySelectorAll(".alert").forEach(a => a.style.display = "none");
}

async function doLogin() {
  const id = document.getElementById("login-id").value.trim();
  const pwd = document.getElementById("login-pwd").value.trim();
  const errEl = document.getElementById("login-error");
  const btnText = document.getElementById("login-btn-text");
  const spinner = document.getElementById("login-spinner");

  errEl.style.display = "none";

  if (!id || !pwd) {
    showAlert(errEl, "Please enter both ID and password.");
    return;
  }

  btnText.textContent = "Signing in…";
  spinner.style.display = "inline-block";

  try {
    const result = await apiCall({ action: "login", id, password: pwd });

    if (result.success) {
      saveUser({ id: result.id, name: result.name, role: result.role });
      if (result.role === "admin") {
        window.location.href = "pages/admin.html";
      } else {
        window.location.href = "pages/student.html";
      }
    } else {
      showAlert(errEl, result.message || "Invalid ID or password. Please try again.");
    }
  } catch(e) {
    showAlert(errEl, "Connection error. Please check your internet and try again.");
  } finally {
    btnText.textContent = "Sign In";
    spinner.style.display = "none";
  }
}

async function doRegister() {
  const id = document.getElementById("reg-id").value.trim();
  const name = document.getElementById("reg-name").value.trim();
  const pwd = document.getElementById("reg-pwd").value.trim();
  const pwd2 = document.getElementById("reg-pwd2").value.trim();
  const errEl = document.getElementById("reg-error");
  const sucEl = document.getElementById("reg-success");
  const btnText = document.getElementById("reg-btn-text");
  const spinner = document.getElementById("reg-spinner");

  errEl.style.display = "none";
  sucEl.style.display = "none";

  if (!id || !name || !pwd || !pwd2) {
    showAlert(errEl, "Please fill in all fields.");
    return;
  }

  if (pwd !== pwd2) {
    showAlert(errEl, "Passwords do not match.");
    return;
  }

  if (pwd.length < 6) {
    showAlert(errEl, "Password must be at least 6 characters.");
    return;
  }

  btnText.textContent = "Creating account…";
  spinner.style.display = "inline-block";

  try {
    const result = await apiCall({ action: "register", id, password: pwd });

    if (result.success) {
      sucEl.textContent = "Account created successfully! You can now sign in.";
      sucEl.style.display = "block";
      document.getElementById("reg-id").value = "";
      document.getElementById("reg-name").value = "";
      document.getElementById("reg-pwd").value = "";
      document.getElementById("reg-pwd2").value = "";
      setTimeout(() => switchTab("login"), 2000);
    } else {
      showAlert(errEl, result.message || "Registration failed. Your ID may not be pre-authorized.");
    }
  } catch(e) {
    showAlert(errEl, "Connection error. Please try again.");
  } finally {
    btnText.textContent = "Create Account";
    spinner.style.display = "none";
  }
}

async function doForgot() {
  const id = document.getElementById("forgot-id").value.trim();
  const errEl = document.getElementById("forgot-error");
  const sucEl = document.getElementById("forgot-success");

  errEl.style.display = "none";
  sucEl.style.display = "none";

  if (!id) {
    showAlert(errEl, "Please enter your Student ID.");
    return;
  }

  sucEl.textContent = "If your ID is registered and linked to Telegram, a reset code has been sent to your Telegram account.";
  sucEl.style.display = "block";
}

function showAlert(el, msg) {
  el.textContent = msg;
  el.style.display = "block";
}

// Enter key support
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("login-pwd").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  document.getElementById("login-id").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
});
