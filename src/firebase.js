// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyBabwrhhTk18F8ji2Tu_6nUqnpEUd_IgmM',
    authDomain: 'xrpdf-3e5d1.firebaseapp.com',
    projectId: 'xrpdf-3e5d1',
    storageBucket: 'xrpdf-3e5d1.appspot.com',
    messagingSenderId: '958178012131',
    appId: '1:958178012131:web:23ca70f84feef3e7910ed6',
    databaseURL: 'https://xrpdf-3e5d1-default-rtdb.firebaseio.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);
export { app, storage, database };
