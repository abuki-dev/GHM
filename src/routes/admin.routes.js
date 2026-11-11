const adminRoutes = require("express").Router();
const {
  createTraining,
  deleteTraining,
  createMembershipPlan,
} = require("../controllers/admin.controller");
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
const { trainingValidator, validateMembershipPlan } = require("../validator/training.validator");

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
adminRoutes.post("/createtraning", trainingValidator, createTraining);
adminRoutes.delete("/deletetraning/:trainingId", deleteTraining);
adminRoutes.post("/createMembershipPlan",validateMembershipPlan,createMembershipPlan)
module.exports = adminRoutes;
