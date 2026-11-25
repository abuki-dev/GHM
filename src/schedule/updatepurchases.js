const { schedule } = require("node-cron");
const { MembershipPurchase, Users } = require("../migrations");
const { sendEmail } = require("../utils/sendemail");

const DAY_MS = 24 * 60 * 60 * 1000;

async function updatePurchases() {
  const now = new Date();

  // Resume freezes that have reached their scheduled end.
  const expiredFreezes = await MembershipPurchase.find({
    status: "frozen",
    freezeUntil: { $type: "date", $lte: now },
    freezeStartedAt: { $type: "date" },
  });

  for (const purchase of expiredFreezes) {
    try {
      const remainingFreezeDays = Math.max(
        0,
        30 - (purchase.freezeDaysUsed || 0),
      );
      const scheduledFreezeMs = Math.max(
        0,
        purchase.freezeUntil.getTime() - purchase.freezeStartedAt.getTime(),
      );
      const extensionMs = Math.min(
        scheduledFreezeMs,
        remainingFreezeDays * DAY_MS,
      );

      await MembershipPurchase.updateOne(
        {
          _id: purchase._id,
          status: "frozen",
          freezeUntil: purchase.freezeUntil,
          freezeStartedAt: purchase.freezeStartedAt,
        },
        {
          $set: {
            status: "active",
            freezeUntil: null,
            freezeStartedAt: null,
            end_date: new Date(purchase.end_date.getTime() + extensionMs),
          },
          $inc: { freezeDaysUsed: extensionMs / DAY_MS },
        },
      );
    } catch (error) {
      console.error(
        `Could not resume frozen purchase ${purchase.purchaseId}:`,
        error,
      );
    }
  }

  // Expire past-due active memberships.
  await MembershipPurchase.updateMany(
    { status: "active", end_date: { $lte: now } },
    { $set: { status: "expired" } },
  );

  // Send expiry notices. The schema marker ensures a successful notice isn't resent.
  const expiredPurchases = await MembershipPurchase.find({
    status: "expired",
    end_date: { $lte: now },
    expiredNotifiedAt: null,
  });

  for (const purchase of expiredPurchases) {
    try {
      const user = await Users.findOne({ userId: purchase.member_id })
        .select("email full_name")
        .lean();

      if (!user?.email) {
        console.error(
          `Cannot send expiry notice for purchase ${purchase.purchaseId}: member email not found.`,
        );
        continue;
      }

      await sendEmail(
        {
          subject: "Your membership has expired",
          text: `Hello ${user.full_name}, your membership has expired. Please renew to continue using the gym.`,
          html: `<p>Hello ${user.full_name}, your membership has expired. Please renew to continue using the gym.</p>`,
        },
        user,
      );

      await MembershipPurchase.updateOne(
        { _id: purchase._id, expiredNotifiedAt: null },
        { $set: { expiredNotifiedAt: new Date() } },
      );
    } catch (error) {
      console.error(
        `Expiry notice failed for purchase ${purchase.purchaseId}:`,
        error,
      );
    }
  }

  // Send each reminder once, and only mark it sent after email succeeds.
  const activePurchases = await MembershipPurchase.find({
    status: "active",
    end_date: { $gt: now },
  });

  for (const purchase of activePurchases) {
    try {
      const daysLeft = Math.ceil((purchase.end_date.getTime() - now.getTime()) / DAY_MS);

      if (![1, 3, 5].includes(daysLeft)) continue;
      if ((purchase.remindersSent || []).includes(daysLeft)) continue;

      const user = await Users.findOne({ userId: purchase.member_id })
        .select("email full_name")
        .lean();

      if (!user?.email) {
        console.error(
          `Cannot send reminder for purchase ${purchase.purchaseId}: member email not found.`,
        );
        continue;
      }

      await sendEmail(
        {
          subject: `Your membership expires in ${daysLeft} day(s)`,
          text: `Hello ${user.full_name}, your membership expires in ${daysLeft} day(s). Please renew your membership.`,
          html: `<p>Hello ${user.full_name}, your membership expires in ${daysLeft} day(s). Please renew your membership.</p>`,
        },
        user,
      );

      await MembershipPurchase.updateOne(
        { _id: purchase._id },
        { $addToSet: { remindersSent: daysLeft } },
      );
    } catch (error) {
      console.error(
        `Reminder failed for purchase ${purchase.purchaseId}:`,
        error,
      );
    }
  }
}

const updatePurchasesJob = schedule(
  "5 0 * * *",
  () => {
    updatePurchases().catch((error) => {
      console.error("Purchase update job failed:", error);
    });
  },
  { timezone: "Africa/Addis_Ababa" },
);

module.exports = {
  startJob: async () => {
    console.log("The jobs are running");
    updatePurchasesJob.start();
  },
  stopJob: async () => {
    console.log("The jobs are stopping");
    updatePurchasesJob.stop();
  },
};