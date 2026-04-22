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
      console.error("Register error:", error);

      let message = "Đăng ký thất bại.";
      if (error.code === "auth/email-already-in-use") {
        message = "Email này đã được sử dụng.";
      } else if (error.code === "auth/weak-password") {
        message = "Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.";
      } else if (error.code === "auth/invalid-email") {
        message = "Email không hợp lệ.";
      }

      alert(message);
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
      const cred = await signInWithEmailAndPassword(auth, email, password);

      await createUserProfile(cred.user, {});

      alert("Đăng nhập thành công.");
      window.location.href = "./dashboard.html";
    } catch (error) {
      console.error("Login error:", error);

      let message = "Đăng nhập thất bại.";
      if (error.code === "auth/user-not-found") {
        message = "Không tìm thấy tài khoản.";
      } else if (error.code === "auth/wrong-password") {
        message = "Sai mật khẩu.";
      } else if (error.code === "auth/invalid-credential") {
        message = "Email hoặc mật khẩu không đúng.";
      }

      alert(message);
    }
  });
}
