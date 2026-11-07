const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middlewares/auth");
const authRouter = require("./auth.router");

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
router.use("/auth", authRouter);
router.use(authenticate);
router.use("/member", requireRole("member", "admin"), userRouter);
router.use("/staff", requireRole("staff", "admin"), staffRouter);

module.exports = router;
