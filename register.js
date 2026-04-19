import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function registerUser(name, phone, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  await setDoc(doc(db, "users", uid), {
    name: name,
    phone: phone,
    email: email,
    role: "free",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return userCredential.user;
}