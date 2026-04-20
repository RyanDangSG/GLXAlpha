import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("Không tìm thấy hồ sơ người dùng trong Firestore.");
  }

  return {
    firebaseUser: userCredential.user,
    profile: userSnap.data()
  };
}

export async function logoutUser() {
  await signOut(auth);
}

export function watchAuth(callback) {
  onAuthStateChanged(auth, callback);
}
