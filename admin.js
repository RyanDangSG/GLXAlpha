import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const body = document.body;
const themeToggleBtn = document.getElementById("themeToggleBtn");
const logoutBtn = document.getElementById("logoutBtn");

const courseForm = document.getElementById("courseForm");
const lessonForm = document.getElementById("lessonForm");
const dictionaryForm = document.getElementById("dictionaryForm");
const newsForm = document.getElementById("newsForm");

const courseList = document.getElementById("courseList");
const lessonListAdmin = document.getElementById("lessonListAdmin");
const dictionaryList = document.getElementById("dictionaryList");
const newsList = document.getElementById("newsList");
const lessonCourseId = document.getElementById("lessonCourseId");

let allCourses = [];

const savedTheme = localStorage.getItem("adminTheme") || "light";
applyTheme(savedTheme);

function applyTheme(mode) {
  if (mode === "dark") {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
    themeToggleBtn.textContent = "☾";
  } else {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
    themeToggleBtn.textContent = "☀";
  }
  localStorage.setItem("adminTheme", mode);
}

themeToggleBtn.addEventListener("click", () => {
  const nextMode = body.classList.contains("dark-theme") ? "light" : "dark";
  applyTheme(nextMode);
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "./login.html";
  } catch (error) {
    console.error(error);
    alert("Đăng xuất thất bại.");
  }
});

function setupTabs() {
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add("active");
    });
  });
}

async function checkAdmin(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    alert("Không tìm thấy quyền người dùng.");
    window.location.href = "./dashboard.html";
    return false;
  }

  const data = snap.data();
  const role = (data.role || "free").toLowerCase();

  if (role !== "admin") {
    alert("Bạn không có quyền truy cập trang admin.");
    window.location.href = "./dashboard.html";
    return false;
  }

  return true;
}

async function loadCourses() {
  const q = query(collection(db, "courses"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  allCourses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  renderCourseList();
  renderCourseSelect();
  await loadLessons();
}

function renderCourseList() {
  courseList.innerHTML = "";

  if (!allCourses.length) {
    courseList.innerHTML = `<div class="empty-admin">Chưa có khóa học</div>`;
    return;
  }

  allCourses.forEach((item) => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      ${item.thumbnailUrl ? `<img src="${item.thumbnailUrl}" alt="${item.title || ""}" style="width:100%;height:170px;object-fit:cover;border-radius:12px;margin-bottom:12px;">` : ""}
      <h4>${item.title || ""}</h4>
      <p>${item.description || ""}</p>
      <div class="list-meta">
        <span class="meta-pill">${item.levelLabel || ""}</span>
        <span class="meta-pill">Role: ${item.requiredRole || "free"}</span>
        <span class="meta-pill">Order: ${item.order ?? ""}</span>
        <span class="meta-pill">${item.isPublished ? "Published" : "Hidden"}</span>
      </div>
    `;
    courseList.appendChild(div);
  });
}

function renderCourseSelect() {
  lessonCourseId.innerHTML = `<option value="">Chọn khóa học</option>`;
  allCourses.forEach((course) => {
    const opt = document.createElement("option");
    opt.value = course.id;
    opt.textContent = course.title;
    lessonCourseId.appendChild(opt);
  });
}

async function loadLessons() {
  lessonListAdmin.innerHTML = "";

  if (!allCourses.length) {
    lessonListAdmin.innerHTML = `<div class="empty-admin">Chưa có bài học</div>`;
    return;
  }

  for (const course of allCourses) {
    const q = query(collection(db, "courses", course.id, "lessons"), orderBy("order", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) continue;

    const block = document.createElement("div");
    block.className = "list-item";
    block.innerHTML = `<h4>${course.title}</h4>`;

    snap.docs.forEach((docSnap) => {
      const item = docSnap.data();
      const lessonDiv = document.createElement("div");
      lessonDiv.style.marginTop = "10px";
      lessonDiv.innerHTML = `
        <p><strong>${item.title || ""}</strong> - ${item.duration || ""}</p>
      `;
      block.appendChild(lessonDiv);
    });

    lessonListAdmin.appendChild(block);
  }

  if (!lessonListAdmin.innerHTML.trim()) {
    lessonListAdmin.innerHTML = `<div class="empty-admin">Chưa có bài học</div>`;
  }
}

async function loadDictionary() {
  const q = query(collection(db, "dictionary"), orderBy("order", "asc"));
  const snap = await getDocs(q);

  dictionaryList.innerHTML = "";
  if (snap.empty) {
    dictionaryList.innerHTML = `<div class="empty-admin">Chưa có thuật ngữ</div>`;
    return;
  }

  snap.docs.forEach((docSnap) => {
    const item = docSnap.data();
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <h4>${item.term || ""}</h4>
      <p>${item.definition || ""}</p>
      <div class="list-meta">
        <span class="meta-pill">${item.shortMeaning || ""}</span>
        <span class="meta-pill">${item.category || "Crypto"}</span>
      </div>
    `;
    dictionaryList.appendChild(div);
  });
}

async function loadNews() {
  const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
  const snap = await getDocs(q);

  newsList.innerHTML = "";
  if (snap.empty) {
    newsList.innerHTML = `<div class="empty-admin">Chưa có tin tức</div>`;
    return;
  }

  snap.docs.forEach((docSnap) => {
    const item = docSnap.data();
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <h4>${item.title || ""}</h4>
      <p>${item.summary || ""}</p>
      <div class="list-meta">
        <span class="meta-pill">${item.sourceName || "Logan Crypto"}</span>
        <span class="meta-pill">${item.isPublished ? "Published" : "Hidden"}</span>
      </div>
    `;
    newsList.appendChild(div);
  });
}

/* CREATE COURSE */
courseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await addDoc(collection(db, "courses"), {
      title: document.getElementById("courseTitle").value.trim(),
      subtitle: document.getElementById("courseSubtitle").value.trim(),
      levelLabel: document.getElementById("courseLevelLabel").value.trim(),
      thumbnailUrl: document.getElementById("courseThumbnailUrl").value.trim(),
      requiredRole: document.getElementById("courseRequiredRole").value,
      description: document.getElementById("courseDescription").value.trim(),
      order: Number(document.getElementById("courseOrder").value || 1),
      isPublished: document.getElementById("coursePublished").checked,
      createdAt: serverTimestamp()
    });

    alert("Đã lưu khóa học.");
    courseForm.reset();
    document.getElementById("coursePublished").checked = true;
    document.getElementById("courseOrder").value = 1;
    await loadCourses();
  } catch (error) {
    console.error(error);
    alert("Lưu khóa học thất bại.");
  }
});

/* CREATE LESSON */
lessonForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const courseId = lessonCourseId.value;
  if (!courseId) {
    alert("Vui lòng chọn khóa học.");
    return;
  }

  try {
    const notesRaw = document.getElementById("lessonNotes").value.trim();
    const notes = notesRaw
      ? notesRaw.split("\n").map((x) => x.trim()).filter(Boolean)
      : [];

    await addDoc(collection(db, "courses", courseId, "lessons"), {
      title: document.getElementById("lessonTitle").value.trim(),
      duration: document.getElementById("lessonDuration").value.trim(),
      description: document.getElementById("lessonDescription").value.trim(),
      vimeoEmbedUrl: document.getElementById("lessonVimeoUrl").value.trim(),
      notes,
      order: Number(document.getElementById("lessonOrder").value || 1),
      isPublished: document.getElementById("lessonPublished").checked,
      createdAt: serverTimestamp()
    });

    alert("Đã lưu bài học.");
    lessonForm.reset();
    document.getElementById("lessonPublished").checked = true;
    document.getElementById("lessonOrder").value = 1;
    await loadLessons();
  } catch (error) {
    console.error(error);
    alert("Lưu bài học thất bại.");
  }
});

/* CREATE DICTIONARY */
dictionaryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const keywordsRaw = document.getElementById("dictionaryKeywords").value.trim();
    const keywords = keywordsRaw
      ? keywordsRaw.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

    await addDoc(collection(db, "dictionary"), {
      term: document.getElementById("dictionaryTerm").value.trim(),
      slug: document.getElementById("dictionarySlug").value.trim(),
      shortMeaning: document.getElementById("dictionaryShortMeaning").value.trim(),
      definition: document.getElementById("dictionaryDefinition").value.trim(),
      category: document.getElementById("dictionaryCategory").value.trim(),
      keywords,
      order: Number(document.getElementById("dictionaryOrder").value || 1),
      createdAt: serverTimestamp()
    });

    alert("Đã lưu thuật ngữ.");
    dictionaryForm.reset();
    document.getElementById("dictionaryOrder").value = 1;
    await loadDictionary();
  } catch (error) {
    console.error(error);
    alert("Lưu thuật ngữ thất bại.");
  }
});

/* CREATE NEWS */
newsForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const tagsRaw = document.getElementById("newsTags").value.trim();
    const tags = tagsRaw
      ? tagsRaw.split(",").map((x) => x.trim()).filter(Boolean)
      : [];

    await addDoc(collection(db, "news"), {
      title: document.getElementById("newsTitle").value.trim(),
      summary: document.getElementById("newsSummary").value.trim(),
      content: document.getElementById("newsContent").value.trim(),
      sourceName: document.getElementById("newsSourceName").value.trim(),
      sourceUrl: document.getElementById("newsSourceUrl").value.trim(),
      imageUrl: document.getElementById("newsImageUrl").value.trim(),
      tags,
      isPublished: document.getElementById("newsPublished").checked,
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    alert("Đã lưu tin tức.");
    newsForm.reset();
    document.getElementById("newsPublished").checked = true;
    await loadNews();
  } catch (error) {
    console.error(error);
    alert("Lưu tin tức thất bại.");
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  const ok = await checkAdmin(user.uid);
  if (!ok) return;

  setupTabs();
  await loadCourses();
  await loadDictionary();
  await loadNews();
});
