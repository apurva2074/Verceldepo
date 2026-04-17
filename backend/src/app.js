// backend/src/app.js (Add the new properties router)
const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health");
const { admin, db } = require("./firebaseAdmin");
const { errorHandlerMiddleware, notFoundMiddleware } = require("./middleware/errorHandler");
const usersRouter = require("./routes/users")({ admin, db });
const tenantsRouter = require("./routes/tenants")({ admin, db });
const wishlistRouter = require("./routes/wishlist")({ admin, db });
const propertiesRouter = require("./routes/properties")({ admin, db });
const chatsRouter = require("./routes/chats")({ admin, db });
const rentalsRouter = require("./routes/rentals")({ admin, db });
const agreementsRouter = require("./routes/agreements")({ admin, db });
const ownerStatsRouter = require("./routes/ownerStats")({ admin, db });
const ownerAnalyticsRouter = require("./routes/ownerAnalytics")({ admin, db });
const ownerRouter = require("./routes/owner")({ admin, db });
const ownersRouter = require("./routes/owners")({ admin, db });
const bookingsRouter = require("./routes/bookings")({ admin, db });
const tenantRouter = require("./routes/tenant")({ admin, db });
const paymentsRouter = require("./routes/payments");
const verifyDocumentsRouter = require("./routes/verifyDocuments");
const enhancedTenantUploadRouter = require("./routes/enhancedTenantUpload");
const rentPredictionRouter = require("./routes/rentPrediction");

const app = express();

// Temporary: Allow all origins for testing
app.use(cors()); // Allows any origin - not recommended for production but fine for testing
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// routes
app.use("/api/health", healthRoutes);
app.use("/api/users", usersRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/tenant", tenantRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/rentals", rentalsRouter);
app.use("/api/agreements", agreementsRouter);
app.use("/api/owner/stats", ownerStatsRouter);
app.use("/api/owner/analytics", ownerAnalyticsRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/owners", ownersRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/ai", verifyDocumentsRouter);
app.use("/api/tenant", enhancedTenantUploadRouter);
app.use("/api/rent-prediction", rentPredictionRouter);

// Define specific routes BEFORE the 404 handler
app.get("/", (_req, res) => res.redirect("/api/health"));

// Add HEAD route for root path (Render health check)
app.head("/", (_req, res) => {
  res.status(200).end();
});

// 404 handler for undefined routes (must be after all specific routes)
app.use(notFoundMiddleware);

// Global error handler (must be after the 404 handler)
app.use(errorHandlerMiddleware);

module.exports = app;