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
  trainingValidator, //[0,1,2]
  handleValidationErrors,
  createTraining,
);
adminRoutes.delete("/deletetraning/:trainingId", deleteTraining);
adminRoutes.delete("/deletePlan/:planId", deleteMembershipPlan);
adminRoutes.post("/createshift", createShifts);
adminRoutes.post(
  "/createMembershipPlan",
  trainingValidator[0],
  trainingValidator[2],
  handleValidationErrors,
  createMembershipPlan,
);
module.exports = adminRoutes;
