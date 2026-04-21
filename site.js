function initTheme() {
  const saved = localStorage.getItem("logan-theme");
  if (saved === "dark") {
    document.body.classList.add("dark-theme");
  }
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = document.body.classList.contains("dark-theme")
      ? "fas fa-moon"
      : "fas fa-sun";
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  localStorage.setItem("logan-theme", isDark ? "dark" : "light");
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = isDark ? "fas fa-moon" : "fas fa-sun";
  }
}

function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("open");
}

function openAuthModal(tab = "register") {
  switchTab(tab);
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.add("open");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("open");
}

function switchTab(tab) {
  const reg = document.getElementById("form-register");
  const log = document.getElementById("form-login");
  const regBtn = document.getElementById("tab-register");
  const logBtn = document.getElementById("tab-login");

  if (!reg || !log || !regBtn || !logBtn) return;

  if (tab === "register") {
    reg.classList.remove("hidden");
    log.classList.add("hidden");
    regBtn.classList.add("active");
    logBtn.classList.remove("active");
  } else {
    reg.classList.add("hidden");
    log.classList.remove("hidden");
    regBtn.classList.remove("active");
    logBtn.classList.add("active");
  }
}

function toggleFaq(el) {
  el.classList.toggle("active");
  const icon = el.querySelector(".faq-icon");
  if (icon) {
    icon.classList.toggle("fa-chevron-down");
    icon.classList.toggle("fa-chevron-up");
  }
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("active");
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initReveal();
});

window.toggleTheme = toggleTheme;
window.toggleMenu = toggleMenu;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchTab = switchTab;
window.toggleFaq = toggleFaq;
