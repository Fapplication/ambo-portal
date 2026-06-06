// ============================================================
// Google Apps Script Backend - Code.gs
// Deploy as Web App: Execute as "Me", Access "Anyone"
// ============================================================

const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // <-- Replace with your Sheet ID
const ss = SpreadsheetApp.openById(SHEET_ID);

// ─── CORS & Router ───────────────────────────────────────────
function doGet(e) {
  return handleRequest(e);
}
function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const params = e.parameter || {};
  const postData = e.postData ? JSON.parse(e.postData.contents || '{}') : {};
  const data = Object.assign({}, params, postData);
  const action = data.action;

  let result;
  try {
    switch (action) {
      // AUTH
      case 'checkAuthorizedID':   result = checkAuthorizedID(data); break;
      case 'sendOTP':             result = sendOTP(data); break;
      case 'verifyOTP':           result = verifyOTP(data); break;
      case 'registerStudent':     result = registerStudent(data); break;
      case 'loginStudent':        result = loginStudent(data); break;
      case 'loginInstructor':     result = loginInstructor(data); break;

      // STUDENT
      case 'getMarks':            result = getMarks(data); break;
      case 'submitComplaint':     result = submitComplaint(data); break;
      case 'getLectureNotes':     result = getLectureNotes(data); break;
      case 'getOnlineTests':      result = getOnlineTests(data); break;
      case 'submitTestResult':    result = submitTestResult(data); break;
      case 'chatbot':             result = chatbot(data); break;

      // INSTRUCTOR
      case 'getDashboard':        result = getDashboard(data); break;
      case 'getAllStudents':       result = getAllStudents(data); break;
      case 'updateMark':          result = updateMark(data); break;
      case 'uploadQuestion':      result = uploadQuestion(data); break;
      case 'uploadLectureNote':   result = uploadLectureNote(data); break;
      case 'sendNotice':          result = sendNotice(data); break;
      case 'getComplaints':       result = getComplaints(data); break;
      case 'resolveComplaint':    result = resolveComplaint(data); break;
      case 'getCourses':          result = getCourses(data); break;

      default: result = { success: false, message: 'Unknown action' };
    }
  } catch (err) {
    result = { success: false, message: err.message };
  }

  const output = ContentService.createTextOutput(JSON.stringify(result));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ─── HELPERS ─────────────────────────────────────────────────
function getSheet(name) {
  return ss.getSheetByName(name);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashPassword(password) {
  // Simple hash - for production use a proper hashing method
  return Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password
  ));
}

// ─── AUTH FUNCTIONS ──────────────────────────────────────────
function checkAuthorizedID(data) {
  const sheet = getSheet('Authorized_IDs');
  const rows = sheetToObjects(sheet);
  const found = rows.find(r => String(r['ID']).trim() === String(data.studentId).trim());
  if (found) {
    // Check if already registered
    const users = sheetToObjects(getSheet('Users'));
    const registered = users.find(u => String(u['ID']).trim() === String(data.studentId).trim());
    return { success: true, name: found['Name'], alreadyRegistered: !!registered };
  }
  return { success: false, message: 'Student ID not found in authorized list.' };
}

function sendOTP(data) {
  const otp = generateOTP();
  const sheet = getSheet('OTP_Verification');
  // Remove old OTPs for this chat/student
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][1]) === String(data.studentId)) {
      sheet.deleteRow(i + 1);
    }
  }
  sheet.appendRow([data.chatId || 'WEB', data.studentId, otp, new Date().toISOString()]);

  // Send email OTP
  try {
    const users = sheetToObjects(getSheet('Users'));
    const user = users.find(u => String(u['ID']) === String(data.studentId));
    const email = data.email || (user ? user['Email'] : null);
    if (email) {
      MailApp.sendEmail({
        to: email,
        subject: 'Your OTP Code - Student Portal',
        body: `Your OTP code is: ${otp}\n\nThis code expires in 10 minutes.`
      });
    }
  } catch(e) {}

  return { success: true, message: 'OTP sent.', otp: otp }; // Remove otp from response in production
}

function verifyOTP(data) {
  const sheet = getSheet('OTP_Verification');
  const rows = sheetToObjects(sheet);
  const record = rows.find(r =>
    String(r['Student_ID']).trim() === String(data.studentId).trim() &&
    String(r['OTP_Code']).trim() === String(data.otp).trim()
  );
  if (!record) return { success: false, message: 'Invalid OTP.' };

  // Check expiry (10 minutes)
  const created = new Date(record['Timestamp']);
  const now = new Date();
  if ((now - created) > 10 * 60 * 1000) return { success: false, message: 'OTP expired.' };

  return { success: true, message: 'OTP verified.' };
}

function registerStudent(data) {
  // Verify OTP first
  const otpCheck = verifyOTP(data);
  if (!otpCheck.success) return otpCheck;

  const sheet = getSheet('Users');
  const existing = sheetToObjects(sheet).find(u => String(u['ID']) === String(data.studentId));
  if (existing) return { success: false, message: 'Student already registered.' };

  const authSheet = getSheet('Authorized_IDs');
  const authRows = sheetToObjects(authSheet);
  const authRecord = authRows.find(r => String(r['ID']).trim() === String(data.studentId).trim());

  sheet.appendRow([
    data.studentId,
    hashPassword(data.password),
    authRecord ? authRecord['Name'] : data.name,
    data.telegramUsername || ''
  ]);

  return { success: true, message: 'Registration successful!' };
}

function loginStudent(data) {
  const sheet = getSheet('Users');
  const rows = sheetToObjects(sheet);
  const user = rows.find(r =>
    String(r['ID']).trim() === String(data.studentId).trim() &&
    r['Password'] === hashPassword(data.password)
  );
  if (!user) return { success: false, message: 'Invalid ID or password.' };
  return { success: true, name: user['Name'], studentId: user['ID'] };
}

function loginInstructor(data) {
  // Check against Users sheet with admin flag or separate admin credentials
  const adminUser = 'admin';
  const adminPass = hashPassword('admin123'); // Change in production
  if (data.username === adminUser && hashPassword(data.password) === adminPass) {
    return { success: true, name: 'Instructor', role: 'instructor' };
  }
  // Also check Users sheet for instructor accounts
  const sheet = getSheet('Users');
  const rows = sheetToObjects(sheet);
  const user = rows.find(r =>
    String(r['Telegram_Username']).trim() === String(data.username).trim() &&
    r['Password'] === hashPassword(data.password) &&
    r['Role'] === 'instructor'
  );
  if (user) return { success: true, name: user['Name'], role: 'instructor' };
  return { success: false, message: 'Invalid credentials.' };
}

// ─── STUDENT FUNCTIONS ───────────────────────────────────────
function getMarks(data) {
  const courses = [
    'Geometric Design of Road and Streets (CEng 3201)',
    'Transport Planning and Modeling (CEng 2901)'
  ];
  const result = [];
  courses.forEach(course => {
    const sheet = getSheet(course);
    if (!sheet) return;
    const rows = sheetToObjects(sheet);
    const record = rows.find(r => String(r['StudentID']).trim() === String(data.studentId).trim());
    if (record) {
      result.push({
        course,
        quiz: record['Quiz'],
        mid: record['Mid'],
        assignment: record['Assignment'],
        final: record['Final'],
        total: (Number(record['Quiz'] || 0) + Number(record['Mid'] || 0) +
                Number(record['Assignment'] || 0) + Number(record['Final'] || 0))
      });
    }
  });
  return { success: true, marks: result };
}

function submitComplaint(data) {
  let sheet = getSheet('Complaints');
  if (!sheet) {
    sheet = ss.insertSheet('Complaints');
    sheet.appendRow(['StudentID', 'Course', 'Type', 'Message', 'Status', 'Timestamp', 'Response']);
  }
  sheet.appendRow([
    data.studentId, data.course, data.type,
    data.message, 'Pending', new Date().toISOString(), ''
  ]);
  return { success: true, message: 'Complaint submitted successfully.' };
}

function getLectureNotes(data) {
  const sheet = getSheet('Lecture_Notes');
  const rows = sheetToObjects(sheet);
  const filtered = data.course
    ? rows.filter(r => r['Course_Name'] === data.course)
    : rows;
  return { success: true, notes: filtered };
}

function getOnlineTests(data) {
  const sheet = getSheet('Online_Tests');
  const rows = sheetToObjects(sheet);
  const filtered = data.course
    ? rows.filter(r => r['Course_Name'] === data.course)
    : rows;
  // Remove correct answers before sending to student
  const sanitized = filtered.map(q => ({
    course: q['Course_Name'],
    question: q['Question_Text'],
    optionA: q['Option_A'],
    optionB: q['Option_B'],
    optionC: q['Option_C'],
    optionD: q['Option_D'],
    id: Utilities.base64Encode(q['Question_Text'].substring(0, 20))
  }));
  return { success: true, questions: sanitized };
}

function submitTestResult(data) {
  let sheet = getSheet('Test_Results');
  if (!sheet) {
    sheet = ss.insertSheet('Test_Results');
    sheet.appendRow(['StudentID', 'Course', 'Score', 'Total', 'Timestamp']);
  }
  sheet.appendRow([
    data.studentId, data.course, data.score,
    data.total, new Date().toISOString()
  ]);
  return { success: true, message: 'Test result saved.', score: data.score, total: data.total };
}

function chatbot(data) {
  const msg = (data.message || '').toLowerCase();
  // Simple rule-based chatbot
  if (msg.includes('mark') || msg.includes('grade')) {
    return { success: true, reply: 'To view your marks, go to "My Marks" from the dashboard. If you have a concern, you can submit a complaint.' };
  }
  if (msg.includes('test') || msg.includes('exam')) {
    return { success: true, reply: 'Online tests are available under "Online Tests". Select your course and start the test.' };
  }
  if (msg.includes('note') || msg.includes('lecture')) {
    return { success: true, reply: 'Lecture notes can be downloaded from the "Lecture Notes" section. Select your course to filter.' };
  }
  if (msg.includes('complain') || msg.includes('complaint')) {
    return { success: true, reply: 'You can submit a complaint from "My Marks" page by clicking Accept/Reject on a course.' };
  }
  if (msg.includes('password') || msg.includes('login')) {
    return { success: true, reply: 'If you forgot your password, please contact your instructor. Login uses your Student ID and password.' };
  }
  if (msg.includes('hello') || msg.includes('hi')) {
    return { success: true, reply: 'Hello! I\'m your student portal assistant. Ask me about marks, tests, lecture notes, or complaints.' };
  }
  return { success: true, reply: 'I can help with marks, online tests, lecture notes, and complaints. What do you need help with?' };
}

// ─── INSTRUCTOR FUNCTIONS ────────────────────────────────────
function getDashboard(data) {
  const usersSheet = getSheet('Users');
  const users = sheetToObjects(usersSheet);
  const students = users.filter(u => u['Role'] !== 'instructor');

  const courses = [
    'Geometric Design of Road and Streets (CEng 3201)',
    'Transport Planning and Modeling (CEng 2901)'
  ];

  const stats = courses.map(course => {
    const sheet = getSheet(course);
    if (!sheet) return { course, count: 0, avgFinal: 0 };
    const rows = sheetToObjects(sheet);
    const finals = rows.map(r => Number(r['Final'] || 0)).filter(f => f > 0);
    const avg = finals.length ? (finals.reduce((a, b) => a + b, 0) / finals.length).toFixed(1) : 0;
    return { course, count: rows.length, avgFinal: avg };
  });

  const complaintsSheet = getSheet('Complaints');
  const pendingComplaints = complaintsSheet
    ? sheetToObjects(complaintsSheet).filter(c => c['Status'] === 'Pending').length
    : 0;

  return {
    success: true,
    totalStudents: students.length,
    courses: stats,
    pendingComplaints
  };
}

function getAllStudents(data) {
  const course = data.course;
  const sheet = getSheet(course);
  if (!sheet) return { success: false, message: 'Course not found.' };
  const rows = sheetToObjects(sheet);
  return { success: true, students: rows };
}

function updateMark(data) {
  const sheet = getSheet(data.course);
  if (!sheet) return { success: false, message: 'Course not found.' };
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const sidIdx = headers.indexOf('StudentID');
  const colMap = { Quiz: headers.indexOf('Quiz'), Mid: headers.indexOf('Mid'), Assignment: headers.indexOf('Assignment'), Final: headers.indexOf('Final') };

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][sidIdx]).trim() === String(data.studentId).trim()) {
      if (data.field && colMap[data.field] !== -1) {
        sheet.getRange(i + 1, colMap[data.field] + 1).setValue(data.value);
      }
      return { success: true, message: 'Mark updated.' };
    }
  }
  return { success: false, message: 'Student not found.' };
}

function uploadQuestion(data) {
  const sheet = getSheet('Online_Tests');
  sheet.appendRow([
    data.course, data.question,
    data.optionA, data.optionB, data.optionC, data.optionD,
    data.correctAnswer
  ]);
  return { success: true, message: 'Question uploaded.' };
}

function uploadLectureNote(data) {
  const sheet = getSheet('Lecture_Notes');
  sheet.appendRow([data.course, data.title, data.url]);
  return { success: true, message: 'Lecture note uploaded.' };
}

function sendNotice(data) {
  let sheet = getSheet('Notices');
  if (!sheet) {
    sheet = ss.insertSheet('Notices');
    sheet.appendRow(['Title', 'Message', 'Timestamp', 'SentBy']);
  }
  sheet.appendRow([data.title, data.message, new Date().toISOString(), 'Instructor']);
  return { success: true, message: 'Notice sent.' };
}

function getComplaints(data) {
  const sheet = getSheet('Complaints');
  if (!sheet) return { success: true, complaints: [] };
  const rows = sheetToObjects(sheet);
  return { success: true, complaints: rows };
}

function resolveComplaint(data) {
  const sheet = getSheet('Complaints');
  if (!sheet) return { success: false, message: 'No complaints sheet.' };
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const statusIdx = headers.indexOf('Status');
  const responseIdx = headers.indexOf('Response');
  const sidIdx = headers.indexOf('StudentID');
  const tsIdx = headers.indexOf('Timestamp');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][tsIdx]) === String(data.timestamp) &&
        String(rows[i][sidIdx]) === String(data.studentId)) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(data.status);
      sheet.getRange(i + 1, responseIdx + 1).setValue(data.response || '');
      return { success: true, message: 'Complaint resolved.' };
    }
  }
  return { success: false, message: 'Complaint not found.' };
}

function getCourses(data) {
  const courses = [
    'Geometric Design of Road and Streets (CEng 3201)',
    'Transport Planning and Modeling (CEng 2901)'
  ];
  return { success: true, courses };
}
