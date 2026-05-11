import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";

const serviceAccount: ServiceAccount = {
  projectId: "sonicx-aafee",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
};

const currentApps = getApps();
let auth: Auth;

if (!currentApps.length) {
  const app = initializeApp({ credential: cert(serviceAccount) });
  auth = getAuth(app);
} else {
  auth = getAuth(currentApps[0]);
}

export { auth };
