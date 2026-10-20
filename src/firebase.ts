import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBRBpH0_VJ4mVNfblRM5udM5pDkxrnf4i4",
  authDomain: "urnenproduktionsplanung.firebaseapp.com",
  projectId: "urnenproduktionsplanung",
  storageBucket: "urnenproduktionsplanung.firebasestorage.app",
  messagingSenderId: "950820060498",
  appId: "1:950820060498:web:5d56fbd667f8a08f7dce8b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
