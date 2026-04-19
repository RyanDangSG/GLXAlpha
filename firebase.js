import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyArg95Ub_bK1rbVGO1udrMMpuWZJJ6b0a8",
  authDomain: "galaxyalpha-45df5.firebaseapp.com",
  projectId: "galaxyalpha-45df5",
  storageBucket: "galaxyalpha-45df5.firebasestorage.app",
  messagingSenderId: "640919053590",
  appId: "1:640919053590:web:53189c6d45d7559b0e1c37"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);