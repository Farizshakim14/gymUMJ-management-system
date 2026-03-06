// Firebase v9 COMPAT agar bisa tetap pakai sintaks lama

const firebaseConfig = {
  apiKey: "AIzaSyAMQmONOpiYg6myHYCPf1BMwgOYnJKQi-U",
  authDomain: "aplikasi-gym-ft-umj.firebaseapp.com",
  databaseURL: "https://aplikasi-gym-ft-umj-default-rtdb.firebaseio.com",
  projectId: "aplikasi-gym-ft-umj",
  storageBucket: "aplikasi-gym-ft-umj.firebasestorage.app",
  messagingSenderId: "800194676841",
  appId: "1:800194676841:web:3dbe81c78a771f97bbfaf8"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.database();
