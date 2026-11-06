const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const authRouter = require("./auth.router");

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.get("/me", authenticate, (req, res) => res.json({ user: req.user }));
router.use("/auth", authRouter);

module.exports = router;
