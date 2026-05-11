import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

function setError(msg) {
  const el = document.getElementById("loginError");
  if (el) el.textContent = msg || "";
}

function setSuccess(msg) {
  const el = document.getElementById("loginSuccess");
  if (el) el.textContent = msg || "";
}

function mapFirebaseError(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/invalid-credential":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản.";
    case "auth/wrong-password":
      return "Mật khẩu không đúng.";
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/too-many-requests":
      return "Bạn đăng nhập quá nhiều lần. Vui lòng thử lại sau.";
    default:
      return error?.message || "Có lỗi xảy ra khi đăng nhập.";
  }
}

async function syncUserVerificationFlags(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return {
      phoneVerified: false,
      status: "pending_setup"
    };
  }

  const data = snap.data();

  const nextStatus =
    user.emailVerified && data.phoneVerified ? "active" : "pending_verify";

  await setDoc(
    ref,
    {
      emailVerified: !!user.emailVerified,
      status: nextStatus
    },
    { merge: true }
  );

  return {
    ...data,
    emailVerified: !!user.emailVerified,
    status: nextStatus
  };
}

const loginForm = document.getElementById("loginForm");
const resendVerifyBtn = document.getElementById("resendVerifyBtn");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitBtn = document.getElementById("loginBtn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Đang đăng nhập...";

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await cred.user.reload();

    const user = auth.currentUser;
    const profile = await syncUserVerificationFlags(user);

    if (!user.emailVerified) {
      setError("Email của bạn chưa được xác minh. Hãy kiểm tra hộp thư và bấm link xác minh.");
      resendVerifyBtn.style.display = "inline-flex";
      return;
    }

    if (!profile.phoneVerified) {
      setError("Số điện thoại của bạn chưa được xác minh. Hãy hoàn tất OTP ở trang đăng ký.");
      return;
    }

    window.location.href = "./dashboard.html";
  } catch (error) {
    console.error("Login error:", error);
    setError(mapFirebaseError(error));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Đăng nhập";
  }
});

resendVerifyBtn?.addEventListener("click", async () => {
  setError("");
  setSuccess("");

  try {
    if (!auth.currentUser) {
      setError("Bạn cần đăng nhập lại trước khi gửi email xác minh.");
      return;
    }

    await sendEmailVerification(auth.currentUser);
    setSuccess("Đã gửi lại email xác minh.");
  } catch (error) {
    console.error("Resend verify error:", error);
    setError(error?.message || "Không gửi lại được email xác minh.");
  }
});
