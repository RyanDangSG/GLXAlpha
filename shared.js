function applySavedTheme() {
  const saved = localStorage.getItem("logan-theme");
  if (saved === "light") {
    document.body.classList.add("light-theme");
  }
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = document.body.classList.contains("light-theme")
      ? "fas fa-sun"
      : "fas fa-moon";
  }
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  localStorage.setItem("logan-theme", isLight ? "light" : "dark");
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.className = isLight ? "fas fa-sun" : "fas fa-moon";
  }
}

function toggleMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("open");
}

function openAuthModal(tab = "register") {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  switchTab(tab);
  modal.classList.add("open");
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) modal.classList.remove("open");
}

function switchTab(tab) {
  const reg = document.getElementById("form-register");
  const log = document.getElementById("form-login");
  const tabReg = document.getElementById("tab-register");
  const tabLog = document.getElementById("tab-login");

  if (!reg || !log || !tabReg || !tabLog) return;

  if (tab === "register") {
    reg.classList.remove("hidden");
    log.classList.add("hidden");
    tabReg.classList.add("active");
    tabLog.classList.remove("active");
  } else {
    reg.classList.add("hidden");
    log.classList.remove("hidden");
    tabReg.classList.remove("active");
    tabLog.classList.add("active");
  }
}

function toggleFaq(el) {
  el.classList.toggle("active");
  const icon = el.querySelector(".faq-head i");
  if (icon) {
    icon.classList.toggle("fa-chevron-down");
    icon.classList.toggle("fa-chevron-up");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applySavedTheme();

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("active");
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
});
