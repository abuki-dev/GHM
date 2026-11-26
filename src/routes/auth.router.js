// route the register and login of the user

const express = require("express");
const authRouter = express.Router();
const {
  register,
  login,
  chekinUser,
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
module.exports = authRouter;
