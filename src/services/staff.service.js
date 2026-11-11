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
  return payment;
};
module.exports.sendPayments = async (page = 1) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = 5;
  const skip = (currentPage - 1) * limit;
  const filteredPayments = await Payments.aggregate([
    { $sort: { Date: -1 } },
    { $match: { status: "pending" } },
    { $skip: skip },
    { $limit: limit },

    {
      $project: {
        _id: 0,
        paymentId: 1,
        amount: 1,
        status: 1,
        verifiedBy: 1,
        transactionId: 1,
        date: 1,
      },
    },
  ]);
  return filteredPayments;
};
