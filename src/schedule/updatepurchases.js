// select all active purchases
// compute remaining days
// expire if the due date passed
//
// coellct every active purchase
// foreach purchase
// 1 purchase
// comute rmainign day
// get the user email
// if 5>=remainign day>=0  send the remainig date to the user email
// if negative mak it expored and send the users hispurchase is expired

const { schedule } = require("node-cron");
const { MembershipPurchase, Users } = require("../migrations");
const { sendEmail } = require("../utils/sendemail");
// let ususe node-coron to run this function every day at 12:00 am

// let ususe node-coron to run this function every day at 12:00 am

const updatePurchases = schedule("0 0 * * *", async () => {
  try {
    const purchases = await MembershipPurchase.find({ status: "active" });
    for (const purchase of purchases) {
      const remainingDays = Math.ceil(
        (purchase.dueDate - new Date()) / (1000 * 60 * 60 * 24),
      );
      const user = await Users.findOne({ userId: purchase.member_id });
      if (remainingDays >= 0 && remainingDays <= 5) {
        // Send email to user with remaining days
        const subject = "Your purchase is about to expire";
        const text = `Dear ${user.name}, your purchase with ID ${purchase._id} will expire in ${remainingDays} days. Please renew your membership.`;
        const html = `<p>Dear ${user.name},</p><p>Your purchase with ID ${purchase._id} will expire in ${remainingDays} days. Please renew your membership.</p>`;
        // Send email logic here (using nodemailer or any other email service)
        await sendEmail({ subject, text, html }, { user });
      } else if (remainingDays < 0) {
        // Mark purchase as expired and send email to user
        const subject = "Your purchase has expired";
        const text = `Dear ${user.name}, your purchase with ID ${purchase._id} has expired. Please renew your membership.`;
        const html = `<p>Dear ${user.name},</p><p>Your purchase with ID ${purchase._id} has expired. Please renew your membership.</p>`;
        // Send email logic here (using nodemailer or any other email service)
        await sendEmail({ subject, text, html }, { user });
        await MembershipPurchase.findByIdAndUpdate(purchase._id, {
          status: "expired",
        });
      }
    }
  } catch (error) {
    console.error("Error updating purchases:", error);
  }
});
module.exports = updatePurchases;
