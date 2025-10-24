// firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Importamos los servicios de Firebase que serán utilizados en nuestra aplicación

const firebaseConfig = {
  apiKey: "AIzaSyCXnzs2htkuazWpy67Mb8pZ3fCIDBpGCIA",
  authDomain: "quinielagallera-8e8fc.firebaseapp.com",
  projectId: "quinielagallera-8e8fc",
  storageBucket: "quinielagallera-8e8fc.appspot.com",
  messagingSenderId: "249255170604",
  appId: "1:249255170604:android:d4bc928911efd6237bf789"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);

// Inicialización de servicios de Firebase
const auth = getAuth(app);
const db = getFirestore(app);

// Exportamos los servicios para uso en otros modulos de nuestra aplicación
export { auth, db };
