export const CONFIG = {
  API_URL: "[script.google.com](https://script.google.com/macros/s/AKfycbxag3kbACfwOiA7zc4pEHY-euD0lZ9E2sv0RmzAqWxajxzw2xPzPE5ZPTdDcJPhkPrT/exec)",
  ADMIN_ID: "admin",
  ADMIN_PASSWORD: "admin123",
};

export async function apiCall<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const url = CONFIG.API_URL + "?payload=" + encodeURIComponent(JSON.stringify(payload));
  
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
  });

  if (!res.ok) throw new Error("Server returned " + res.status);
  return res.json() as Promise<T>;
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: "#059669", B: "#2563eb", C: "#d97706", D: "#ea580c", F: "#dc2626",
  };
  return map[grade] ?? "#6b7280";
}

export interface UserSession {
  id: string;
  name: string;
  role: "admin" | "student";
}

export function saveUser(data: UserSession) {
  sessionStorage.setItem("au_user", JSON.stringify(data));
}

export function getUser(): UserSession | null {
  try { return JSON.parse(sessionStorage.getItem("au_user") ?? "null"); }
  catch { return null; }
}

export function clearUser() {
  sessionStorage.removeItem("au_user");
}

export interface Complaint {
  id: number;
  studentId: string;
  course: string;
  grade: string;
  total: string;
  complaintText: string;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
}

export function saveComplaint(courseId: string, text: string, grade: string, total: string) {
  const user = getUser();
  const existing = getComplaints();
  existing.push({
    id: Date.now(), studentId: user?.id ?? "", course: courseId,
    grade, total, complaintText: text, status: "pending",
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem("au_complaints", JSON.stringify(existing));
}

export function getComplaints(): Complaint[] {
  try { return JSON.parse(localStorage.getItem("au_complaints") ?? "[]"); }
  catch { return []; }
}

export function updateComplaintStatus(id: number, status: "accepted" | "rejected") {
  const all = getComplaints();
  const idx = all.findIndex((c) => c.id === id);
  if (idx !== -1) { all[idx].status = status; localStorage.setItem("au_complaints", JSON.stringify(all)); }
}

export const COURSES = [
  "Geometric Design of Road and Streets (CEng 3201)",
  "Transport Planning and Modeling (CEng 2901)",
];

export const COURSE_SHORT: Record<string, string> = {
  "Geometric Design of Road and Streets (CEng 3201)": "CEng 3201",
  "Transport Planning and Modeling (CEng 2901)": "CEng 2901",
};
