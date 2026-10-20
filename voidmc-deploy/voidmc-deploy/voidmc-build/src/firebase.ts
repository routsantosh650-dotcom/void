import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// One read at start-up is enough to tell a wrong database id from a rules mistake: an offline
// client means the id in firebase-applet-config.json does not exist in this Firebase project.
void getDocFromServer(doc(db, 'test', 'connection'))
  .then(() => undefined)
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('offline')) {
      console.error('Firestore probe failed: check firestoreDatabaseId in firebase-applet-config.json.');
    }
  });
