# 🏛️ Civil Engineering Student Portal

A full-stack academic portal for Civil Engineering students and instructors, powered by **Google Sheets** as a backend database and **Google Apps Script** as the API.

---

## 📁 Project Structure

```
student-portal/
├── index.html                    # Login & Registration page
├── student-dashboard.html        # Student home
├── student-marks.html            # View marks + Accept/Reject
├── student-tests.html            # Online tests
├── student-notes.html            # Lecture notes download
├── student-chatbot.html          # AI Chatbot assistant
├── student-notifications.html    # Notices from instructor
├── instructor-dashboard.html     # Instructor home
├── instructor-marks.html         # Manage student marks
├── instructor-complaints.html    # Review complaints
├── instructor-tests.html         # Upload exam questions
├── instructor-notes.html         # Upload lecture notes
├── instructor-notices.html       # Send announcements
├── css/
│   ├── main.css                  # Global styles
│   └── auth.css                  # Login page styles
├── js/
│   ├── config.js                 # API wrapper + helpers
│   └── layout.js                 # Sidebar/topbar renderer
└── Code.gs                       # Google Apps Script backend
```

---

## 🚀 Setup Instructions

### Step 1: Set Up Google Sheets

1. Open [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Create the following **tabs** (sheet names must match exactly):

| Sheet Name | Columns (Row 1 headers) |
|---|---|
| `Authorized_IDs` | `ID`, `Name` |
| `OTP_Verification` | `Chat_ID`, `Student_ID`, `OTP_Code`, `Timestamp` |
| `Users` | `ID`, `Password`, `Name`, `Telegram_Username`, `Role`, `Email` |
| `Lecture_Notes` | `Course_Name`, `Topic_Title`, `Resource_URL` |
| `Online_Tests` | `Course_Name`, `Question_Text`, `Option_A`, `Option_B`, `Option_C`, `Option_D`, `Correct_Answer` |
| `Bot_Sessions` | `ChatID`, `StudentID`, `Status`, `Name` |
| `Geometric Design of Road and Streets (CEng 3201)` | `StudentID`, `Name`, `Quiz`, `Mid`, `Assignment`, `Final` |
| `Transport Planning and Modeling (CEng 2901)` | `StudentID`, `Name`, `Quiz`, `Mid`, `Assignment`, `Final` |

3. **Pre-populate `Authorized_IDs`** with all student IDs and names.
4. Copy your **Sheet ID** from the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### Step 2: Deploy Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**.
2. Delete the default code and paste the contents of `Code.gs`.
3. Replace `YOUR_GOOGLE_SHEET_ID` with your actual Sheet ID.
4. Click **Deploy → New Deployment**.
5. Choose **Web App** as the type.
6. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
7. Click **Deploy** and copy the **Web App URL**.

### Step 3: Configure the Frontend

1. Open `js/config.js`.
2. Replace `YOUR_SCRIPT_ID` in the `API_URL` with your Apps Script Web App URL:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
   ```

### Step 4: Deploy to GitHub Pages

1. Create a GitHub repository (e.g., `civil-eng-portal`).
2. Upload all files maintaining the folder structure.
3. Go to **Settings → Pages**.
4. Set source to **main branch / root**.
5. Your site will be live at: `https://yourusername.github.io/civil-eng-portal/`

---

## 🔐 Default Instructor Credentials

| Username | Password |
|---|---|
| `admin` | `admin123` |

> ⚠️ **Change the admin password** in `Code.gs` before deployment:
> ```javascript
> const adminPass = hashPassword('YOUR_NEW_PASSWORD');
> ```
> Then redeploy the Apps Script.

---

## ✨ Features

### Student
- ✅ Self-registration with pre-authorized ID + OTP verification
- ✅ Secure login
- ✅ View marks per course (Quiz, Mid, Assignment, Final)
- ✅ Accept or reject marks with complaint submission
- ✅ Take timed online multiple-choice tests
- ✅ Download lecture notes filtered by course
- ✅ Chatbot Q&A assistant
- ✅ View instructor notifications

### Instructor
- ✅ Secure admin login
- ✅ Dashboard with statistics
- ✅ View & edit student marks per course
- ✅ Review and resolve student complaints
- ✅ Upload multiple-choice exam questions
- ✅ Upload lecture note links
- ✅ Send notices to all students

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Hosting | GitHub Pages |
| Fonts | Google Fonts (Sora + JetBrains Mono) |

---

## 📱 Responsive Design

The portal is fully responsive and works on:
- 🖥️ Desktop (1024px+)
- 💻 Laptop (768–1024px)
- 📱 Mobile (< 768px) with collapsible sidebar

---

## ⚠️ Important Notes

- The Apps Script must be redeployed whenever `Code.gs` changes.
- OTP codes are currently returned in the API response for testing — **remove the `otp` field** from `sendOTP()` in production.
- For email OTP delivery, students need an `Email` column in the `Users` sheet.
- The chatbot uses rule-based responses; you can extend it with AI by integrating the Anthropic API in `Code.gs`.
