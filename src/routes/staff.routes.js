const express = require("express");
const staffRouter = express.Router();

const {
  getPendingPayments,
  approvePayment,
  declinePayment,
  markPaymentRefunded,
  approveRenewal,
  renewalRequests,
} = require("../controllers/staff.controller");
const {
  handleValidationErrors,
  ValidateRegister,
  validatemembrData,
  validateTransactionId,
} = require("../validator/auth.validator");
const { register } = require("../controllers/auth.controller");
// 2. Member Account Creation
staffRouter.post(
  "/create-member",
  ValidateRegister,
  validatemembrData,
  handleValidationErrors,
  register,
);

// 3. Payment & Renewal Management
staffRouter.get("/payments", getPendingPayments);
staffRouter.get("/renewal-requests", renewalRequests);

staffRouter.patch(
  "/approve-payment",
  validateTransactionId,
  handleValidationErrors,
  approvePayment,
);

staffRouter.patch(
  "/decline-payment",
  validateTransactionId,
  handleValidationErrors,
  declinePayment,
);

staffRouter.patch(
  "/refund-payment",
  validateTransactionId,
  handleValidationErrors,
  markPaymentRefunded,
);

staffRouter.patch(
  "/approve-renewal",
  validateTransactionId,
  handleValidationErrors,
  approveRenewal,
);

module.exports = staffRouter;
