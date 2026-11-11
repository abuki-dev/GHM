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
