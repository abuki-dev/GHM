const { Payments, Member } = require("../migrations");
const { BadRequestError } = require("../utils/app.errors");

module.exports.approve = async ({ paymentId }, { id }) => {
  const payment = await Payments.findOne({ paymentId });
  if (!payment) {
    throw new BadRequestError("Payment Not Found try again");
  }
  payment.status = "verified";
  payment.verifiedBy = id;
  await payment.save();
 

  const member = await Member.findOne({
     memberId: payment.userId 
  });

  //member_id panid start end payment_id
  if (member) {
    member.subscriptions = member.subscriptions || [];
    const pendingSub = member.subscriptions.find(
      (sub) => sub.status === "pending",
    );

    if (pendingSub) {
      pendingSub.status = "active";
    } else {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (payment.duration || 1));
    }
    await member.save();
  }
  return payment;
};
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
