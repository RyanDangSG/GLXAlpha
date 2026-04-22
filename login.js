import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

function mapAuthError(error) {
  const code = error?.code || "";

  if (code === "auth/invalid-credential") return "Email hoặc mật khẩu không đúng.";
  if (code === "auth/user-not-found") return "Không tìm thấy tài khoản.";
  if (code === "auth/wrong-password") return "Sai mật khẩu.";
  if (code === "auth/invalid-email") return "Email không hợp lệ.";

  return error?.message || "Đăng nhập thất bại.";
}

export async function loginUser(email, password) {
  try {
    if (!email || !password) {
      throw new Error("Vui lòng nhập email và mật khẩu.");
    }

    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const userRef = doc(db, "users", cred.user.uid);
    const userSnap = await getDoc(userRef);

    const profile = userSnap.exists()
      ? userSnap.data()
      : {
          uid: cred.user.uid,
          email: cred.user.email || "",
          role: "free"
        };

    return {
      user: cred.user,
      profile
    };
  } catch (error) {
    console.error("LOGIN ERROR FULL:", error);
    throw new Error(mapAuthError(error));
  }
}
