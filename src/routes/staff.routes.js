const express = require("express");
const staffRouter = express.Router();

const {
  getPendingPayments,
  approvePayment,
  declinePayment,
  markPaymentRefunded,
} = require("../controllers/staff.controller");
const {
  handleValidationErrors,
  ValidateRegister,
  validatemembrData,
  validateTransactionId,
} = require("../validator/auth.validator");
const { register } = require("../controllers/auth.controller");

staffRouter.post(
  "/createmember",
  ValidateRegister,
  validatemembrData,
  handleValidationErrors,
  register,
); // use the auth controller to register a new member account
staffRouter.get("/payment", getPendingPayments);
staffRouter.post("/approvepayment",validateTransactionId, approvePayment);
staffRouter.post("/declinePayment",validateTransactionId, declinePayment);
staffRouter.post("/refundPayment", markPaymentRefunded);
module.exports = staffRouter;
