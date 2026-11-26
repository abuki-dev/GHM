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
const updatePurchases = schedule(
  "0 0 * * *",
  async () => {
    const now = new Date();
    console.log("Running updatePurchases job at", now.toISOString());
    const purchases = await MembershipPurchase.find({ status: "active" });
    for (const purchase of purchases) {
      try {
        const msLeft = purchase.end_date - now; // end_date, not dueDate
        const user = await Users.findOne({ userId: purchase.member_id });
        if (msLeft <= 0) {
          // expire first, then notify
          // Mark purchase as expired and send email to user
          const subject = "Your purchase has expired";
          const text = `Dear ${user.name}, your purchase with ID ${purchase._id} has expired. Please renew your membership.`;
          const html = `<p>Dear ${user.name},</p><p>Your purchase with ID ${purchase._id} has expired. Please renew your membership.</p>`;
          // Send email logic here (using nodemailer or any other email service)
          await MembershipPurchase.updateOne(
            { _id: purchase._id },
            { $set: { status: "expired" } },
          );
          if (user?.email) await sendEmail({ subject, text, html }, user);
        } else {
          const daysLeft = Math.ceil(msLeft / 86400000);

          if (daysLeft <= 5 && user?.email) {
            // Send email to user with remaining days
            const subject = "Your purchase is about to expire";
            const text = `Dear ${user.name}, your purchase with ID ${purchase._id} will expire in ${daysLeft} days. Please renew your membership.`;
            const html = `<p>Dear ${user.name},</p><p>Your purchase with ID ${purchase._id} will expire in ${daysLeft} days. Please renew your membership.</p>`;
            // Send email logic here (using nodemailer or any other email service)
            await sendEmail({ subject, text, html }, user);
          }
        }
      } catch (err) {
        console.error("purchase", purchase.purchaseId, err.message); // keep going
      }
    }
  },
  {
    scheduled: true,
    timezone: "Africa/Addis_Ababa",
  },
);
module.exports = {
  startJob: async () => {
    console.log("The jobs are running");
    updatePurchases.start();
  },
  stopJob: async () => {
    console.log("The jobs are stooping and tremoinating");
    updatePurchases.stop();
  },
};
