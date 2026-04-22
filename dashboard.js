import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const roleLevelMap = {
  free: 1,
  medium: 2,
  pro: 3,
  admin: 4
};

const body = document.body;
const themeToggleBtn = document.getElementById("themeToggleBtn");
const logoutBtn = document.getElementById("logoutBtn");

const roleBadge = document.getElementById("roleBadge");
const heroCurrentRole = document.getElementById("heroCurrentRole");
const heroRoleDesc = document.getElementById("heroRoleDesc");

const statCourses = document.getElementById("statCourses");
const statTerms = document.getElementById("statTerms");
const statNews = document.getElementById("statNews");

const courseGrid = document.getElementById("courseGrid");
const lessonList = document.getElementById("lessonList");
const lessonContent = document.getElementById("lessonContent");
const selectedCourseName = document.getElementById("selectedCourseName");
const lessonStatus = document.getElementById("lessonStatus");

const dictionaryGrid = document.getElementById("dictionaryGrid");
const dictionarySearch = document.getElementById("dictionarySearch");
const newsGrid = document.getElementById("newsGrid");

let currentRole = "free";
let allCourses = [];
let allDictionary = [];
let allNews = [];
let selectedCourseId = null;
let selectedLessonId = null;

const savedTheme = localStorage.getItem("dashboardTheme") || "light";
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
  localStorage.setItem("dashboardTheme", mode);
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
    console.error("Logout error:", error);
    alert("Đăng xuất thất bại.");
  }
});

function prettifyRole(role) {
  const map = {
    free: "Free",
    medium: "Medium",
    pro: "Pro",
    admin: "Admin"
  };
  return map[role] || "Free";
}

function roleDescription(role) {
  if (role === "admin") return "Bạn đang ở cấp Admin. Có toàn quyền xem và quản trị toàn bộ hệ thống.";
  if (role === "pro") return "Bạn đang ở cấp Pro. Có thể học toàn bộ Silver, Gold, Diamond và xem đầy đủ công cụ.";
  if (role === "medium") return "Bạn đang ở cấp Medium. Có thể học Silver và Gold, chưa mở Diamond.";
  return "Bạn đang ở cấp Free. Có thể xem nội dung nền tảng và làm quen hệ thống.";
}

function canAccess(requiredRole, userRole) {
  return roleLevelMap[userRole] >= roleLevelMap[requiredRole];
}

function getCourseCardClass(requiredRole) {
  if (requiredRole === "free") return "silver";
  if (requiredRole === "medium") return "gold";
  if (requiredRole === "pro") return "diamond";
  return "";
}

async function loadUserRole(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    currentRole = (data.role || "free").toLowerCase();
  } else {
    currentRole = "free";
  }

  roleBadge.textContent = prettifyRole(currentRole).toUpperCase();
  heroCurrentRole.textContent = prettifyRole(currentRole).toUpperCase();
  heroRoleDesc.textContent = roleDescription(currentRole);
}

async function loadCourses() {
  try {
    const q = query(collection(db, "courses"), orderBy("order", "asc"));
    const snap = await getDocs(q);

    const courses = [];

    for (const docSnap of snap.docs) {
      const courseData = docSnap.data();
      if (courseData.isPublished !== true) continue;

      const courseId = docSnap.id;

      const lessonQ = query(
        collection(db, "courses", courseId, "lessons"),
        orderBy("order", "asc")
      );
      const lessonSnap = await getDocs(lessonQ);

      const lessons = lessonSnap.docs
        .map((lessonDoc) => ({
          id: lessonDoc.id,
          ...lessonDoc.data()
        }))
        .filter((lesson) => lesson.isPublished === true);

      courses.push({
        id: courseId,
        ...courseData,
        lessons
      });
    }

    allCourses = courses;
    statCourses.textContent = String(courses.length);
    renderCourses();
    renderLessons();
    renderLessonContent();
  } catch (error) {
    console.error("Load courses error:", error);
    courseGrid.innerHTML = `
      <div class="empty-state small">
        <strong>Lỗi tải khóa học</strong>
        <span>Kiểm tra Firestore collection courses và lessons.</span>
      </div>
    `;
  }
}

function renderCourses() {
  courseGrid.innerHTML = "";

  if (!allCourses.length) {
    courseGrid.innerHTML = `
      <div class="empty-state small">
        <strong>Chưa có khóa học</strong>
        <span>Hãy thêm dữ liệu trong collection courses.</span>
      </div>
    `;
    return;
  }

  allCourses.forEach((course) => {
    const unlocked = canAccess(course.requiredRole, currentRole);
    const isSelected = selectedCourseId === course.id;

    const card = document.createElement("article");
    card.className = [
      "course-card",
      getCourseCardClass(course.requiredRole),
      unlocked ? "unlocked" : "locked",
      isSelected ? "active" : ""
    ].join(" ");

    card.innerHTML = `
      <div class="course-thumb-wrap">
        ${
          course.thumbnailUrl
            ? `<img class="course-thumb" src="${course.thumbnailUrl}" alt="${course.title || ""}">`
            : `<div class="course-thumb course-thumb-fallback">LOGAN CRYPTO</div>`
        }

        <div class="course-card-top overlay">
          <div class="course-level">${course.levelLabel || ""}</div>
          <div class="course-open-tag ${unlocked ? "open" : "closed"}">
            ${unlocked ? "Đã mở" : "Bị khóa"}
          </div>
        </div>
      </div>

      <h3>${course.title || ""}</h3>
      <div class="course-subtitle">${course.subtitle || ""}</div>
      <p class="course-desc">${course.description || ""}</p>
      <div class="course-required">
        Mở từ cấp: <strong>${prettifyRole(course.requiredRole || "free")}</strong>
      </div>

      <button class="course-btn" ${unlocked ? "" : "disabled"}>
        ${unlocked ? "Xem khóa học" : "Chưa đủ quyền"}
      </button>
    `;

    if (unlocked) {
      card.addEventListener("click", () => {
        selectedCourseId = course.id;
        selectedLessonId = null;
        renderCourses();
        renderLessons();
        renderLessonContent();
      });
    }

    courseGrid.appendChild(card);
  });
}

function renderLessons() {
  const course = allCourses.find((c) => c.id === selectedCourseId);

  if (!course) {
    selectedCourseName.textContent = "Chọn khóa học";
    lessonList.innerHTML = `
      <div class="empty-state small">
        <strong>Chưa có bài học hiển thị</strong>
        <span>Hãy chọn một khóa học đang mở để xem nội dung.</span>
      </div>
    `;
    return;
  }

  selectedCourseName.textContent = course.title || "Khóa học";
  lessonList.innerHTML = "";

  course.lessons.forEach((lesson, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lesson-item " + (selectedLessonId === lesson.id ? "active" : "");
    btn.innerHTML = `
      <div class="lesson-index">${index + 1}</div>
      <div class="lesson-meta">
        <strong>${lesson.title || ""}</strong>
        <span>${lesson.duration || ""}</span>
      </div>
    `;
    btn.addEventListener("click", () => {
      selectedLessonId = lesson.id;
      renderLessons();
      renderLessonContent();
    });
    lessonList.appendChild(btn);
  });

  if (!selectedLessonId && course.lessons.length) {
    selectedLessonId = course.lessons[0].id;
    renderLessons();
  }
}

function renderLessonContent() {
  const course = allCourses.find((c) => c.id === selectedCourseId);

  if (!course) {
    lessonStatus.textContent = "Sẵn sàng học";
    lessonContent.innerHTML = `
      <div class="empty-state">
        <strong>Chào mừng đến với Logan Crypto Dashboard</strong>
        <span>Hãy chọn một khóa học ở phía trên, sau đó chọn bài học để bắt đầu.</span>
      </div>
    `;
    return;
  }

  const lesson = course.lessons.find((l) => l.id === selectedLessonId) || course.lessons[0];
  if (!lesson) return;

  lessonStatus.textContent = lesson.duration || "Bài học";

  lessonContent.innerHTML = `
    <div class="lesson-view">
      <div class="lesson-video-wrap">
        <iframe
          src="${lesson.vimeoEmbedUrl || ""}"
          title="${lesson.title || ""}"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>

      <div class="lesson-info-card">
        <div class="lesson-pill">${course.levelLabel || ""}</div>
        <h2>${lesson.title || ""}</h2>
        <p class="lesson-desc">${lesson.description || ""}</p>

        <div class="lesson-note-box">
          <h4>Điểm chính của bài học</h4>
          <ul>
            ${(lesson.notes || []).map((note) => `<li>${note}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  `;
}

async function loadDictionary() {
  try {
    const q = query(collection(db, "dictionary"), orderBy("order", "asc"));
    const snap = await getDocs(q);

    allDictionary = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    statTerms.textContent = String(allDictionary.length);
    renderDictionary(allDictionary);
  } catch (error) {
    console.error("Load dictionary error:", error);
    dictionaryGrid.innerHTML = `
      <div class="empty-state small">
        <strong>Lỗi tải từ điển</strong>
        <span>Kiểm tra collection dictionary.</span>
      </div>
    `;
  }
}

function renderDictionary(items) {
  dictionaryGrid.innerHTML = "";

  if (!items.length) {
    dictionaryGrid.innerHTML = `
      <div class="empty-state small">
        <strong>Chưa có thuật ngữ</strong>
        <span>Hãy thêm dữ liệu trong collection dictionary.</span>
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "dictionary-card";
    card.innerHTML = `
      <div class="dictionary-term">${item.term || ""}</div>
      <div class="dictionary-short">${item.shortMeaning || ""}</div>
      <p>${item.definition || ""}</p>
      <div class="dictionary-category">${item.category || "Crypto"}</div>
    `;
    dictionaryGrid.appendChild(card);
  });
}

dictionarySearch?.addEventListener("input", (e) => {
  const keyword = e.target.value.trim().toLowerCase();

  if (!keyword) {
    renderDictionary(allDictionary);
    return;
  }

  const filtered = allDictionary.filter((item) => {
    const raw = [
      item.term || "",
      item.shortMeaning || "",
      item.definition || "",
      item.category || "",
      ...(item.keywords || [])
    ]
      .join(" ")
      .toLowerCase();

    return raw.includes(keyword);
  });

  renderDictionary(filtered);
});

async function loadNews() {
  try {
    const q = query(collection(db, "news"), orderBy("publishedAt", "desc"));
    const snap = await getDocs(q);

    allNews = snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data()
      }))
      .filter((item) => item.isPublished === true);

    statNews.textContent = String(allNews.length);
    renderNews();
  } catch (error) {
    console.error("Load news error:", error);
    newsGrid.innerHTML = `
      <div class="empty-state small">
        <strong>Lỗi tải tin tức</strong>
        <span>Kiểm tra collection news.</span>
      </div>
    `;
  }
}

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleDateString("vi-VN");
}

function renderNews() {
  newsGrid.innerHTML = "";

  if (!allNews.length) {
    newsGrid.innerHTML = `
      <div class="empty-state small">
        <strong>Chưa có tin tức</strong>
        <span>Hãy thêm dữ liệu trong collection news.</span>
      </div>
    `;
    return;
  }

  allNews.forEach((item) => {
    const article = document.createElement("article");
    article.className = "news-card";

    article.innerHTML = `
      ${item.imageUrl ? `<img class="news-image" src="${item.imageUrl}" alt="${item.title || ""}">` : ""}
      <div class="news-body">
        <div class="news-meta">
          <span>${item.sourceName || "Logan Crypto"}</span>
          <span>${formatDate(item.publishedAt)}</span>
        </div>
        <h3>${item.title || ""}</h3>
        <p>${item.summary || ""}</p>
        ${item.sourceUrl ? `<a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer" class="news-link">Xem thêm</a>` : ""}
      </div>
    `;

    newsGrid.appendChild(article);
  });
}

function setupTabs() {
  const tabs = document.querySelectorAll(".dashboard-tab");
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

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  await loadUserRole(user.uid);
  await loadCourses();
  await loadDictionary();
  await loadNews();
  setupTabs();
});
