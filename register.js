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

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  await setDoc(doc(db, "users", uid), {
    name,
    phone,
    email,
    role: "free",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  try {
    await submitToSheet({ name, phone, email });
  } catch (error) {
    console.error("Lỗi đẩy data sang Google Sheet:", error);
  }

  return userCredential.user;
}
