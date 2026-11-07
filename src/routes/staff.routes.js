const express = require("express");
const staffRouter = express.Router();
const { requireRole } = require("../middlewares/auth");
const {
  getPendingPayments,
  approvePayment,
  SubscribeToMembership,
} = require("../controllers/staff.controller");
const {
  handleValidationErrors,
  ValidateRegister,
} = require("../validator/auth.validator");
const { register } = require("../controllers/auth.controller");

staffRouter.post(
  "/newaccount",
  ValidateRegister,
  handleValidationErrors,
  register,
);
staffRouter.get("/payment", handleValidationErrors, getPendingPayments);
staffRouter.post("/approvepayment", handleValidationErrors, approvePayment);
staffRouter.post(
  "/subscribemembership",
  SubscribeToMembership,
  handleValidationErrors,
);

module.exports = staffRouter;
