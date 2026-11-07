// route the register and login of the user

const express = require("express");
const authRouter = express.Router();
const { register, login } = require("../controllers/auth.controller");
const {
  ValidateRegister,
  validateLogin,
  handleValidationErrors,
} = require("../validator/auth.validator");

authRouter.post(
  "/register",
  ValidateRegister,
  handleValidationErrors,
  register,
);

authRouter.post("/login", validateLogin, handleValidationErrors, login);
module.exports = authRouter;
