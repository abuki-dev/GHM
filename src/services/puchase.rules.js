const { MembershipPurchase } = require("../migrations");

async function expireStalePurchase(memberId) {
  await MembershipPurchase.updateMany(
    {
      member_id: memberId,
      status: "active",
      end_date: { $lte: new Date() },
    },
    { $set: { status: "expired" } },
  );
}

async function getActivePurchase(memberId) {
  await expireStalePurchase(memberId);

  return MembershipPurchase.findOne({
    member_id: memberId,
    status: {$in: ["active", "frozen"]},
  }).sort({end_date:-1});
}
module.exports = {expireStalePurchase, getActivePurchase};
