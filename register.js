import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  linkWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

/* =========================
   CONFIG
========================= */
const SHEET_WEB_APP_URL = "DAN_LINK_WEB_APP_APPS_SCRIPT_CUA_BAN";

/* =========================
   DOM
========================= */
const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById("registerBtn");

const registerError = document.getElementById("registerError");
const registerSuccess = document.getElementById("registerSuccess");

const otpBox = document.getElementById("otpBox");
const verifyBox = document.getElementById("verifyBox");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendEmailBtn = document.getElementById("resendEmailBtn");

const otpError = document.getElementById("otpError");
const otpSuccess = document.getElementById("otpSuccess");

let recaptchaVerifier = null;
let confirmationResult = null;
let otpCooldown = false;

/* =========================
   HELPERS
========================= */
function setText(el, text = "") {
  if (el) el.textContent = text;
}

function clearMessages() {
  setText(registerError, "");
  setText(registerSuccess, "");
  setText(otpError, "");
  setText(otpSuccess, "");
}

function normalizeVietnamPhone(raw) {
  let phone = (raw || "").trim();

  // bỏ khoảng trắng, dấu chấm, gạch ngang
  phone = phone.replace(/[\s\.\-]/g, "");

  // nếu user nhập +84...
  if (phone.startsWith("+84")) {
    phone = phone.slice(3);
  }

  // nếu user nhập 84...
  if (phone.startsWith("84")) {
    phone = phone.slice(2);
  }

  // nếu user nhập 0...
  if (phone.startsWith("0")) {
    phone = phone.slice(1);
  }

  // chỉ giữ ký tự số
  phone = phone.replace(/\D/g, "");

  return `+84${phone}`;
}

function mapFirebaseError(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký.";
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.";
    case "auth/invalid-phone-number":
      return "Số điện thoại không đúng định dạng.";
    case "auth/too-many-requests":
      return "Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.";
    case "auth/captcha-check-failed":
      return "reCAPTCHA không hợp lệ. Hãy tải lại trang và thử lại.";
    case "auth/code-expired":
      return "Mã OTP đã hết hạn.";
    case "auth/invalid-verification-code":
      return "Mã OTP không đúng.";
    case "auth/provider-already-linked":
      return "Số điện thoại này đã được liên kết.";
    case "auth/credential-already-in-use":
      return "Số điện thoại này đã được dùng cho tài khoản khác.";
    default:
      return error?.message || "Có lỗi xảy ra. Vui lòng thử lại.";
  }
}

function initRecaptcha() {
  if (recaptchaVerifier) return recaptchaVerifier;

  recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
    size: "normal"
  });

  return recaptchaVerifier;
}

async function savePendingUserProfile({
  uid,
  name,
  email,
  zalo,
  phone
}) {
  await setDoc(
    doc(db, "users", uid),
    {
      name,
      email,
      zalo,
      phone,
      role: "free",
      status: "registered",
      emailVerified: false,
      phoneVerified: false,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

async function sendLeadToSheet({ name, email, zalo, phone, status }) {
  if (!SHEET_WEB_APP_URL || SHEET_WEB_APP_URL === "DAN_LINK_WEB_APP_APPS_SCRIPT_CUA_BAN") {
    console.warn("Chưa điền SHEET_WEB_APP_URL.");
    return;
  }

  try {
    await fetch(SHEET_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        name,
        email,
        zalo,
        phone,
        status,
        source: "firebase_register"
      })
    });
  } catch (error) {
    console.error("Send lead to sheet error:", error);
  }
}

/* =========================
   REGISTER SUBMIT
========================= */
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();

  const name = document.getElementById("name").value.trim();
  const zaloRaw = document.getElementById("zalo").value.trim();
  const phone = normalizeVietnamPhone(zaloRaw);
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!name) {
    setText(registerError, "Vui lòng nhập họ tên.");
    return;
  }

  if (!zaloRaw) {
    setText(registerError, "Vui lòng nhập Zalo / số điện thoại.");
    return;
  }

  if (!/^\+84\d{8,11}$/.test(phone)) {
    setText(registerError, "Số điện thoại không hợp lệ.");
    return;
  }

  if (!email) {
    setText(registerError, "Vui lòng nhập email.");
    return;
  }

  if (!password) {
    setText(registerError, "Vui lòng nhập mật khẩu.");
    return;
  }

  if (password !== confirmPassword) {
    setText(registerError, "Mật khẩu nhập lại không khớp.");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Đang tạo tài khoản...";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // gửi email verify
    await sendEmailVerification(user);

    // lưu firestore
    await savePendingUserProfile({
      uid: user.uid,
      name,
      email,
      zalo: zaloRaw,
      phone
    });

    // gửi ngay về sheet + telegram
    await sendLeadToSheet({
      name,
      email,
      zalo: zaloRaw,
      phone,
      status: "registered"
    });

    otpBox.classList.remove("hidden");

    setText(
      registerSuccess,
      "Đăng ký thành công. Dữ liệu đã được gửi về hệ thống. Hệ thống đã gửi email xác minh, bây giờ hãy xác thực số điện thoại bằng OTP."
    );
  } catch (error) {
    console.error("Register error:", error);
    setText(registerError, mapFirebaseError(error));
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Tạo tài khoản";
  }
});

/* =========================
   SEND OTP
========================= */
sendOtpBtn.addEventListener("click", async () => {
  clearMessages();

  if (otpCooldown) {
    setText(otpError, "Vui lòng chờ một chút rồi thử gửi OTP lại.");
    return;
  }

  const user = auth.currentUser;
  const zaloRaw = document.getElementById("zalo").value.trim();
  const phone = normalizeVietnamPhone(zaloRaw);

  if (!user) {
    setText(otpError, "Không tìm thấy phiên đăng ký. Hãy đăng ký lại.");
    return;
  }

  if (!zaloRaw) {
    setText(otpError, "Vui lòng nhập Zalo / số điện thoại.");
    return;
  }

  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = "Đang gửi OTP...";
  otpCooldown = true;

  try {
    const appVerifier = initRecaptcha();
    confirmationResult = await linkWithPhoneNumber(user, phone, appVerifier);

    verifyBox.classList.remove("hidden");
    setText(otpSuccess, `Đã gửi mã OTP tới ${phone}`);

    let seconds = 60;
    const timer = setInterval(() => {
      seconds--;
      sendOtpBtn.textContent = `Gửi lại sau ${seconds}s`;

      if (seconds <= 0) {
        clearInterval(timer);
        otpCooldown = false;
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Gửi mã OTP";
      }
    }, 1000);
  } catch (error) {
    console.error("Send OTP error:", error);
    setText(otpError, mapFirebaseError(error));

    otpCooldown = false;
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = "Gửi mã OTP";
  }
});

/* =========================
   VERIFY OTP
========================= */
verifyOtpBtn.addEventListener("click", async () => {
  clearMessages();

  const code = document.getElementById("otpCode").value.trim();
  const user = auth.currentUser;

  if (!confirmationResult) {
    setText(otpError, "Bạn chưa gửi OTP.");
    return;
  }

  if (!code) {
    setText(otpError, "Vui lòng nhập mã OTP.");
    return;
  }

  if (!user) {
    setText(otpError, "Phiên đăng ký đã hết. Hãy đăng ký lại.");
    return;
  }

  verifyOtpBtn.disabled = true;
  verifyOtpBtn.textContent = "Đang xác thực...";

  try {
    await confirmationResult.confirm(code);

    const finalStatus = user.emailVerified ? "active" : "pending_email";

    await setDoc(
      doc(db, "users", user.uid),
      {
        phoneVerified: true,
        status: finalStatus
      },
      { merge: true }
    );

    setText(
      otpSuccess,
      "Xác thực số điện thoại thành công. Hãy mở email để bấm link xác minh rồi đăng nhập."
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    setText(otpError, mapFirebaseError(error));
  } finally {
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.textContent = "Xác thực OTP";
  }
});

/* =========================
   RESEND EMAIL VERIFY
========================= */
resendEmailBtn.addEventListener("click", async () => {
  clearMessages();

  const user = auth.currentUser;
  if (!user) {
    setText(otpError, "Không tìm thấy user hiện tại.");
    return;
  }

  resendEmailBtn.disabled = true;
  resendEmailBtn.textContent = "Đang gửi...";

  try {
    await sendEmailVerification(user);
    setText(otpSuccess, "Đã gửi lại email xác minh.");
  } catch (error) {
    console.error("Resend email error:", error);
    setText(otpError, mapFirebaseError(error));
  } finally {
    resendEmailBtn.disabled = false;
    resendEmailBtn.textContent = "Gửi lại email xác minh";
  }
});
