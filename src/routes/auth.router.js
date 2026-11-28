// route the register and login of the user

const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  chekinUser,
  logout,
  getProfile,
  updateProfile,
} = require("../controllers/auth.controller");
const {
  ValidateRegister,
  validateLogin,
  handleValidationErrors,
  validatemembrData,
} = require("../validator/auth.validator");

const {
  requireRole,
  authenticate,
  registrationLimter,
  loginLimiter,
  chekinLimiter,
} = require("../middlewares/auth");

authRouter.post(
  "/register",
  registrationLimter,
  ValidateRegister,
  validatemembrData,
  handleValidationErrors,
  register,
);

authRouter.post(
  "/login",
  loginLimiter,
  validateLogin,
  handleValidationErrors,
  login,
);
authRouter.post(
  "/chekin",
  authenticate,
  chekinLimiter,
  requireRole("staff", "admin"),
  chekinUser,
);
authRouter.get("/profile", authenticate, getProfile);
authRouter.patch("/profile", authenticate, updateProfile);
authRouter.post("/logout", logout);
module.exports = authRouter;
