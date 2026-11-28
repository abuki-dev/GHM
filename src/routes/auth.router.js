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
  changePassword,
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
authRouter.use(authenticate);
authRouter.post(
  "/chekin",
  chekinLimiter,
  requireRole("staff", "admin"),
  chekinUser,
);
authRouter.get("/profile", getProfile);
authRouter.patch(
  "/profile",
  ValidateRegister[0],
  ValidateRegister[1],
  ValidateRegister[4],
  handleValidationErrors,
  updateProfile,
);
authRouter.patch(
  "/change-password",
  ValidateRegister[2],
  ValidateRegister[3],
  handleValidationErrors,
  changePassword,
);
authRouter.post("/logout", logout);
module.exports = authRouter;
