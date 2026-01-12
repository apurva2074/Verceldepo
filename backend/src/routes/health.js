const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is live!" });
});

module.exports = router;
