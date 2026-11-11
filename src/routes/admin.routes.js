const adminRoutes = require("express").Router();
const {
  createTraining,
  deleteTraining,
  createMembershipPlan,
  createShifts,
  deleteMembershipPlan,
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
const { trainingValidator } = require("../validator/training.validator");

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
adminRoutes.post(
  "/createtraning",
  trainingValidator,
  handleValidationErrors,
  createTraining,
);
adminRoutes.delete("/deletetraning/:trainingId", deleteTraining);
adminRoutes.delete("/deletePlan/:planId", deleteMembershipPlan);
adminRoutes.post("/createshift", createShifts);
adminRoutes.post(
  "/createMembershipPlan",
  handleValidationErrors,
  createMembershipPlan,
);
module.exports = adminRoutes;
