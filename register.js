import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

async function createUserProfile(user, extraData = {}) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      name: extraData.name || "",
      phone: extraData.phone || "",
      role: "free",
      provider: "password",
      createdAt: serverTimestamp()
    });
  }
}

function getMessage(error) {
  const code = error?.code || "";

  if (code === "auth/email-already-in-use") return "Email này đã được sử dụng.";
  if (code === "auth/weak-password") return "Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.";
  if (code === "auth/invalid-email") return "Email không hợp lệ.";
  if (code === "auth/operation-not-allowed") return "Bạn chưa bật Email/Password trong Firebase Authentication.";
  if (code === "auth/user-not-found") return "Không tìm thấy tài khoản.";
  if (code === "auth/wrong-password") return "Sai mật khẩu.";
  if (code === "auth/invalid-credential") return "Email hoặc mật khẩu không đúng.";
  if (code === "permission-denied" || code === "firestore/permission-denied") return "Firestore Rules đang chặn quyền ghi dữ liệu.";
  return `Lỗi: ${code || "unknown"}`;
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName")?.value.trim() || "";
    const phone = document.getElementById("registerPhone")?.value.trim() || "";
    const email = document.getElementById("registerEmail")?.value.trim() || "";
    const password = document.getElementById("registerPassword")?.value || "";

    if (!email || !password) {
      alert("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await createUserProfile(cred.user, {
        name,
        phone
      });

      alert("Đăng ký thành công.");
      window.location.href = "./dashboard.html";
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      alert(getMessage(error));
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim() || "";
    const password = document.getElementById("loginPassword")?.value || "";

    if (!email || !password) {
      alert("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Đăng nhập thành công.");
      window.location.href = "./dashboard.html";
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert(getMessage(error));
    }
  });
}
