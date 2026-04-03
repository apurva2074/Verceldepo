// backend/src/routes/activityLogs.js
// Activity logging system for audit trail

const { verifyTokenMiddleware } = require("../middleware/auth");
const { logActivity } = require("../utils/activityLogger");

module.exports = ({ admin, db }) => {
  const router = require("express").Router();

  // GET /api/activity-logs - Get user's activity logs
  router.get("/", verifyTokenMiddleware, async (req, res) => {
    try {
      const userId = req.auth.uid;
      const { limit = 50, offset = 0, action, resourceType } = req.query;

      let query = db.collection("activity_logs")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(parseInt(limit));

      // Apply filters
      if (action) {
        query = query.where("action", "==", action);
      }
      if (resourceType) {
        query = query.where("resourceType", "==", resourceType);
      }

      const snapshot = await query.get();
      
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.json({
        logs,
        total: logs.length,
        filters: { action, resourceType }
      });
    } catch (error) {
      console.error("Get activity logs error:", error);
      return res.status(500).json({
        message: "Failed to fetch activity logs",
        error: error.message
      });
    }
  });

  // POST /api/activity-logs/log - Manual log endpoint (for testing or special cases)
  router.post("/log", verifyTokenMiddleware, async (req, res) => {
    try {
      const userId = req.auth.uid;
      const { action, resourceType, resourceId, details, metadata } = req.body;

      if (!action || !resourceType) {
        return res.status(400).json({
          message: "Action and resourceType are required"
        });
      }

      await logActivity(userId, action, resourceType, resourceId, details, {
        ...metadata,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip || req.connection.remoteAddress
      });

      return res.json({
        message: "Activity logged successfully"
      });
    } catch (error) {
      console.error("Manual log error:", error);
      return res.status(500).json({
        message: "Failed to log activity",
        error: error.message
      });
    }
  });

  // Export the logActivity function for use in other routes
  return {
    router,
    logActivity
  };
};
