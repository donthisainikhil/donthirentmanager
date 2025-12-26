import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBTzeVOn_SQzkZsbg_FoKarMgUnj3v3hIE",
  authDomain: "rent-manager-4edc1.firebaseapp.com",
  databaseURL: "https://rent-manager-4edc1-default-rtdb.firebaseio.com",
  projectId: "rent-manager-4edc1",
  storageBucket: "rent-manager-4edc1.firebasestorage.app",
  messagingSenderId: "195559113818",
  appId: "1:195559113818:web:e37b925b973392add24463",
  measurementId: "G-RJ1V1N5PQ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
