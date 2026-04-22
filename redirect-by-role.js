export function redirectByRole(profile) {
  const role = (profile?.role || "free").toLowerCase();

  if (role === "admin") {
    window.location.href = "./admin.html";
    return;
  }

  window.location.href = "./dashboard.html";
}
