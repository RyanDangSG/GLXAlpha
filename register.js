import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { submitToSheet } from "./sheet-submit.js";

export async function registerUser(name, phone, email, password) {
  if (!name || !phone || !email || !password) {
    throw new Error("Vui lòng nhập đầy đủ họ tên, số điện thoại, email và mật khẩu.");
  }

  // 1) Tạo tài khoản Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // 2) Lưu user vào Firestore
  await setDoc(doc(db, "users", uid), {
    name: name,
    phone: phone,
    email: email,
    role: "free",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // 3) Đẩy data qua Google Sheet
  try {
    console.log("Data gui sang sheet:", { name, phone, email });
    const sheetResult = await submitToSheet({ name, phone, email });
    console.log("Sheet result:", sheetResult);
  } catch (error) {
    console.error("Lỗi đẩy data sang Google Sheet:", error);
  }

  return userCredential.user;
}
