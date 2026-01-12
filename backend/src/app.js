// backend/src/app.js (Add the new properties router)
const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health");
const { admin, db } = require("./firebaseAdmin");
const usersRouter = require("./routes/users")({ admin, db });
// --- NEW LINE ---
const propertiesRouter = require("./routes/properties")({ admin, db }); 
// ----------------

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());

// routes
app.use("/api/health", healthRoutes);
app.use("/api/users", usersRouter);
// --- NEW LINE ---
app.use("/api/properties", propertiesRouter); 
// ----------------

app.get("/", (_req, res) => res.redirect("/api/health"));

module.exports = app;