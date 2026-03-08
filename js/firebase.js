// public/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import { getFirestore }

from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* COLE AQUI AS CHAVES DO SEU PROJETO */
const firebaseConfig = {
  apiKey: "AIzaSyB4Ff3_hQH0HA73AkUtp6YJb51EAVtE3qg",
  authDomain: "silveira-9b1ac.firebaseapp.com",
  projectId: "silveira-9b1ac",
  storageBucket: "silveira-9b1ac.firebasestorage.app",
  messagingSenderId: "134962743519",
  appId: "1:134962743519:web:37be0610cf30b1f489c16a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);