const adminRoutes = require("express").Router();
const {
  createTraining,
  deleteTraining,
  createMembershipPlan,
  createShifts,
  deleteMembershipPlan,
  deleteShifts,
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
adminRoutes.delete("/deleteshift/:shiftId", deleteShifts);
// get all users
// get all members with email
// get all tarinig
// get all purchase
// get all plans
// get all trainers with email
module.exports = adminRoutes;
