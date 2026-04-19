export function redirectByRole(profile) {
  const role = profile.role;

  if (role === "admin") {
    window.location.href = "./admin.html";
    return;
  }

  if (role === "pro") {
    window.location.href = "./academy-pro.html";
    return;
  }

  if (role === "medium") {
    window.location.href = "./academy-medium.html";
    return;
  }

  window.location.href = "./dashboard-free.html";
}