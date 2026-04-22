import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

function mapAuthError(error) {
  const code = error?.code || "";

  if (code === "auth/email-already-in-use") return "Email này đã được sử dụng.";
  if (code === "auth/weak-password") return "Mật khẩu quá yếu. Hãy dùng ít nhất 6 ký tự.";
  if (code === "auth/invalid-email") return "Email không hợp lệ.";
  if (code === "auth/operation-not-allowed") return "Bạn chưa bật Email/Password trong Firebase Authentication.";
  if (code.includes("permission-denied")) return "Firestore Rules đang chặn quyền ghi dữ liệu.";

  return error?.message || "Đăng ký thất bại.";
}

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

export async function registerUser(name, phone, email, password) {
  try {
    if (!email || !password) {
      throw new Error("Vui lòng nhập email và mật khẩu.");
    }

    const cred = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    await createUserProfile(cred.user, {
      name: name || "",
      phone: phone || ""
    });

    return {
      user: cred.user
    };
  } catch (error) {
    console.error("REGISTER ERROR FULL:", error);
    throw new Error(mapAuthError(error));
  }
}
