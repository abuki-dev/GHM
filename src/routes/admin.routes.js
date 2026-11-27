const adminRoutes = require("express").Router();
const {
  createTraining,
  deleteTraining,
  createMembershipPlan,
  createShifts,
  deleteMembershipPlan,
  deleteShifts,
  getAllUsers,
  getAllPlans,
  getAllShifts,
  getAllPurchases,
  getAllCheckins,
  getAllTrainings,
  getAllPayments,
  getAllFeedbacks,
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
  validatemembrData,
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
  validatemembrData,
  handleValidationErrors,
  register,
);
adminRoutes.post(
  "/createtraning",
  trainingValidator, //[0,1,2]
  handleValidationErrors,
  createTraining,
);
adminRoutes.delete("/deletetraning", deleteTraining);
adminRoutes.delete("/deletePlan", deleteMembershipPlan);
adminRoutes.post("/createshift", createShifts);
adminRoutes.post(
  "/createMembershipPlan",
  trainingValidator[0],
  trainingValidator[2],
  handleValidationErrors,
  createMembershipPlan,
);
adminRoutes.delete("/deleteshift", deleteShifts);
adminRoutes.get("/users", getAllUsers);
adminRoutes.get("/checkins", getAllCheckins);
adminRoutes.get("/purchases", getAllPurchases);
adminRoutes.get("/plans", getAllPlans);
adminRoutes.get("/payments", getAllPayments);
adminRoutes.get("/shifts", getAllShifts);
adminRoutes.get("/trainings", getAllTrainings);
adminRoutes.get("/feedbacks", getAllFeedbacks);
module.exports = adminRoutes;
