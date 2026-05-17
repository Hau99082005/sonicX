import {
  API_KEY_FIREBASE,
  AppId,
  AUTHDOMAIN,
  MeasurementId,
  MessagingSenderId,
  ProjectID,
  StorageBucket,
} from "#/utils/variables";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: API_KEY_FIREBASE,
  authDomain: AUTHDOMAIN,
  projectId: ProjectID,
  storageBucket: StorageBucket,
  messagingSenderId: MessagingSenderId,
  appId: AppId,
  measurementId: MeasurementId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
