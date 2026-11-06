// route the register and login of the user

const express = require("express");
const authRouter = express.Router();
const { register, login } = require("../controllers/auth.controller");
const {
  ValidateRegister,
  validateLogin,
} = require("../validator/auth.validator");
const { body, validationResult } = require('express-validator');


const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  }
  next();
};

authRouter.post("/register", ValidateRegister, handleValidationErrors, register);

authRouter.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  login,
);
module.exports =authRouter;