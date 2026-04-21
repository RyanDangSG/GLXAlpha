const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

const savedTheme = localStorage.getItem("logan-theme");

if (savedTheme === "dark") {
  body.classList.remove("light-theme");
  body.classList.add("dark-theme");
  if (themeToggle) themeToggle.textContent = "☾";
} else {
  body.classList.remove("dark-theme");
  body.classList.add("light-theme");
  if (themeToggle) themeToggle.textContent = "☀";
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = body.classList.contains("dark-theme");
    if (isDark) {
      body.classList.remove("dark-theme");
      body.classList.add("light-theme");
      localStorage.setItem("logan-theme", "light");
      themeToggle.textContent = "☀";
    } else {
      body.classList.remove("light-theme");
      body.classList.add("dark-theme");
      localStorage.setItem("logan-theme", "dark");
      themeToggle.textContent = "☾";
    }
  });
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}
