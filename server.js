const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Inisialisasi Firebase Admin
const serviceAccount = require('./serviceAccountKeygym.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aplikasi-gym-ft-umj-default-rtdb.firebaseio.com"
});

const app = express();
app.use(cors());
app.use(express.json());

const db = admin.database();

// 2. Endpoint POST /api/users (Membuat User)
app.post('/api/users', async (req, res) => {
  const { nama, email, password, nim, bb, tb, tanggal_lahir, tujuan, gender } = req.body;

  if (!email || !password || !nama) {
    return res.status(400).json({ error: "Nama, Email, dan Password wajib diisi!" });
  }

  try {
    // Buat user di Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: nama,
    });

    const uid = userRecord.uid;

    // Simpan data ke Realtime Database
    await db.ref("users/" + uid).set({
      nama,
      email,
      nim: nim || "",
      bb: bb || "",
      tb: tb || "",
      tanggal_lahir: tanggal_lahir || "",
      tujuan: tujuan || "",
      gender: gender || "",
      role: "member"
    });

    res.status(201).json({ message: "User berhasil dibuat!", uid: uid });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Endpoint DELETE /api/users/:uid (Menghapus User)
app.delete('/api/users/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    // Hapus dari Authentication
    await admin.auth().deleteUser(uid);

    // Hapus dari Database
    await db.ref("users/" + uid).remove();

    res.status(200).json({ message: "User berhasil dihapus total!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend Server berjalan di http://localhost:${PORT}`);
});
