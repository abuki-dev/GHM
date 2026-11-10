const { Payments } = require("../migrations");
const { BadRequestError } = require("../utils/app.errors");

module.exports.decline = async ({ paymentId }, { id }) => {
  const payment = await Payments.findOne({ paymentId });
  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }
  payment.status = "failed";
  payment.verifiedBy = id;
  await payment.save();
};
