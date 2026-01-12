require("dotenv").config();

console.log("PORT =", process.env.PORT);
console.log("CORS =", process.env.CORS_ORIGIN);
console.log("Project ID =", process.env.FIREBASE_PROJECT_ID);
console.log("Client Email =", process.env.FIREBASE_CLIENT_EMAIL);
console.log("Private Key Length =", (process.env.FIREBASE_PRIVATE_KEY_BASE64 || "").length);
