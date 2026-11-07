const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middlewares/auth");
const authRouter = require("./auth.router");
const staffRouter = require("./staff.routes")

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
router.use("/auth", authRouter);
router.use(authenticate);
router.use("/staff", requireRole("staff", "admin"), staffRouter);

module.exports = router;
