# Ambo University — Educational Web Portal

A complete student and instructor web portal for the Civil Engineering Department at Ambo University. Built to work with the existing Google Apps Script (GAS) backend and Telegram Bot.

---

## 📁 Project Structure

```
ambo-portal/
├── index.html              ← Login / Register page
├── pages/
│   ├── student.html        ← Student dashboard
│   └── admin.html          ← Instructor/Admin dashboard
├── css/
│   └── main.css            ← Shared stylesheet
├── js/
│   ├── config.js           ← API URL + shared utilities
│   ├── auth.js             ← Login, register logic
│   ├── student.js          ← Student dashboard logic
│   └── admin.js            ← Admin dashboard logic
├── logo.png                ← University logo (YOU provide this)
└── README.md               ← This file
```

---

## 🚀 Deployment to GitHub Pages

### Step 1 — Upload files
1. Create a new GitHub repository (e.g. `ambo-portal`)
2. Upload all files maintaining the directory structure above
3. Place your university logo as `logo.png` in the root folder

### Step 2 — Enable GitHub Pages
1. Go to your repository → **Settings** → **Pages**
2. Under "Source" select **Deploy from a branch**
3. Choose `main` branch, `/ (root)` folder
4. Click **Save**
5. Your portal will be live at: `https://YOUR_USERNAME.github.io/ambo-portal/`

### Step 3 — Update the API URL
Open `js/config.js` and replace the `API_URL` value with your deployed GAS Web App URL:

```javascript
const CONFIG = {
  API_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  ...
};
```

---

## ✅ Features

### Student Portal
- 🔐 Login / Register / Forgot Password
- 📊 View marks with visual progress bars (Quiz, Mid, Assignment, Final)
- 📋 Accept or reject published grades with complaint submission
- ✎ Online multiple-choice examinations with timer
- 📄 Download lecture notes and resources
- 🤖 AI Academic Assistant chatbot
- 📱 Fully responsive (mobile + desktop)

### Instructor/Admin Portal
- 📝 Publish and update student marks (with live total/grade preview)
- 📊 Bulk marks grid overview per course
- 👥 Student enrollment grid
- 📤 Upload lecture notes with course assignments
- 🎯 Add MCQ exam questions to the question pool
- 📢 Send announcements and notices
- ⚑ Review and resolve student grade complaints

---

## ⚙️ Optional: Enable Web Grid View

To enable the full student grid on the web portal, add this to your Google Apps Script:

**In the `doPost` function, add:**
```javascript
else if (action === "getGrid") res = getGridForCourse(req.subject, req.adminId, req.adminPassword);
```

**Add this new function:**
```javascript
function getGridForCourse(subject, adminId, adminPassword) {
  if (adminId !== "admin" || adminPassword !== "admin123") return { success: false, message: "Unauthorized." };
  const sheet = SPREADSHEET.getSheetByName(subject);
  if (!sheet) return { success: false, message: "Sheet not found." };
  const rows = sheet.getDataRange().getValues();
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const tot = (parseFloat(rows[i][1])||0) + (parseFloat(rows[i][2])||0) + (parseFloat(rows[i][3])||0) + (parseFloat(rows[i][4])||0);
    data.push({ id: rows[i][0], quiz: rows[i][1], mid: rows[i][2], assignment: rows[i][3], final: rows[i][4], total: tot.toFixed(2), grade: gradeOf(tot) });
  }
  return { success: true, data };
}
```

**Also add a getNotes action:**
```javascript
else if (action === "getNotes") res = getAllNotes(req.adminId, req.adminPassword);
```

```javascript
function getAllNotes(adminId, adminPassword) {
  if (adminId !== "admin" || adminPassword !== "admin123") return { success: false };
  const sheet = SPREADSHEET.getSheetByName("Lecture_Notes");
  if (!sheet) return { success: true, data: [] };
  const rows = sheet.getDataRange().getValues();
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) data.push({ course: rows[i][0], title: rows[i][1], url: rows[i][2] });
  }
  return { success: true, data };
}
```

After adding these functions, redeploy your GAS as a new version.

---

## 🔒 Security Notes

- Admin credentials are defined in `js/config.js` — for production, consider moving to server-side validation
- Student sessions are stored in `sessionStorage` (cleared when browser closes)
- Complaint data is stored in `localStorage` (browser-local, not synced to GAS)
- CORS headers are handled by your GAS `doOptions` function

---

## 📞 Support

This portal communicates with the same Google Apps Script backend as the Telegram Bot. Both can be used simultaneously — the GAS backend handles all data operations.

For issues, contact the system administrator or refer to the Google Apps Script deployment logs.
