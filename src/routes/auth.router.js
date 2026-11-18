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

const { requireRole } = require("../middlewares/auth");

authRouter.post(
  "/register",
  ValidateRegister,
  validatemembrData,
  handleValidationErrors,
  register,
);

authRouter.post("/login", validateLogin, handleValidationErrors, login);
authRouter.post("/chekin", requireRole("staff", "admin"), chekinUser);
module.exports = authRouter;
