import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            "AIzaSyAivN9BfXyc-6Gf3BFCeu5wR8eUauO7_Sw",
  authDomain:        "venoxai2.firebaseapp.com",
  projectId:         "venoxai2",
  storageBucket:     "venoxai2.firebasestorage.app",
  messagingSenderId: "952657948204",
  appId:             "1:952657948204:web:3b068f9f47217605366b89"
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);