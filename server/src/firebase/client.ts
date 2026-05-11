import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyB3G8mTuJgOTwHJPN56sV2ca7JhxN7eluY",
  authDomain: "sonicx-aafee.firebaseapp.com",
  projectId: "sonicx-aafee",
  storageBucket: "sonicx-aafee.firebasestorage.app",
  messagingSenderId: "739589186628",
  appId: "1:739589186628:web:d5ab4dc5de1734a8a74811",
  measurementId: "G-85E4VEBNWJ",
};

const currentApps = getApps();
let auth: Auth;

if (!currentApps.length) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  const app = currentApps[0];
  auth = getAuth(app);
}

export { auth };
