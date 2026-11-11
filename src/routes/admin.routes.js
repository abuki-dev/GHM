const adminRoutes = require("express").Router();
const {
  register,
  cretaeNewaccount,
} = require("../controllers/auth.controller");

const {
  ValidateRegister,
  handleValidationErrors,
  ValidateRole,
  valdatextraData,
} = require("../validator/auth.validator");

adminRoutes.post(
  "/createstandarduser",
  ValidateRegister,
  ValidateRole,
  valdatextraData,
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
module.exports = adminRoutes;
