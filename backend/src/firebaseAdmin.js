// src/firebaseAdmin.js
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json"); // or path you use

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "rentit-562ce.appspot.com" // optional: note format (bucket domain sometimes differs)
});

const db = admin.firestore();
module.exports = { admin, db };
