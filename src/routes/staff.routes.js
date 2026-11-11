const express = require("express");
const staffRouter = express.Router();

const {
  getPendingPayments,
  approvePayment,
  declinePayment,
} = require("../controllers/staff.controller");
const {
  handleValidationErrors,
  ValidateRegister,
  validatemembrData,
} = require("../validator/auth.validator");
const { register } = require("../controllers/auth.controller");

staffRouter.post(
  "/createmember",
  ValidateRegister,
  validatemembrData,
  handleValidationErrors,
  register,
); // use the auth controller to register a new member account
staffRouter.get("/payment", handleValidationErrors, getPendingPayments);
staffRouter.post("/approvepayment", handleValidationErrors, approvePayment);
staffRouter.get("/payment", getPendingPayments);
staffRouter.post("/approvepayment", approvePayment);
staffRouter.post("/declinePayment", declinePayment);

module.exports = staffRouter;
