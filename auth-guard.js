import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function requireRole(allowedRoles = []) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "./login.html";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      window.location.href = "./login.html";
      return;
    }

    const profile = userSnap.data();

    if (!allowedRoles.includes(profile.role)) {
      if (profile.role === "admin") {
        window.location.href = "./admin.html";
        return;
      }

      if (profile.role === "pro") {
        window.location.href = "./academy-pro.html";
        return;
      }

      if (profile.role === "medium") {
        window.location.href = "./academy-medium.html";
        return;
      }

      window.location.href = "./dashboard-free.html";
    }
  });
}

export function requireLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "./login.html";
    }
  });
}