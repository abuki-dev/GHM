const adminRoutes = require("express").Router();
const { cretaeNewaccount } = require("../controllers/admin.controller");
const { register } = require("../controllers/auth.controller");

const {
  ValidateRegister,
  handleValidationErrors,
  ValidateRole,
} = require("../validator/auth.validator");

adminRoutes.post(
  "/createstandarduser",
  ValidateRegister,
  ValidateRole,

  handleValidationErrors,
  cretaeNewaccount,
);
adminRoutes.post(
  "/createmember",
  ValidateRegister,
  ValidateRole,
  handleValidationErrors,
  register,
);
