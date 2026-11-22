const { Checkins, MembershipPurchase } = require("../migrations");

module.exports.toMinutes = (timeStr) => {
  // Handles both "10:30" strings and plain numbers like 10
  if (typeof timeStr === "number") return timeStr * 60;
  const [h, m] = String(timeStr).split(":").map(Number);
  return h * 60 + (m || 0);
};
module.exports.formatHours = (date) => {
  if (typeof date === "number") {
    return `${String(date).padStart(2, "0")}:00`;
  }
  const [h, m] = String(date).split(":").map(Number);
  return `${String(h).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`;
};
module.exports.createChekin = async (userId, chekinTime) => {
  return await Checkins.create({ userId, chekinTime });
};

module.exports.isPurchaseaAllowed = async (userId, Plan, session) => {
  //let us chek first if the user have the purchase
  // purchases that already ended but are still marked active
  const now = new Date();
  await MembershipPurchase.updateMany(
    { member_id: userId, status: "active", end_date: { $lte: now } },
    { $set: { status: "expired" } },
    { session },
  );

  const active = await MembershipPurchase.findOne({
    member_id: userId,
    status: "active",
  }).session(session);
  if (!active) {
    return "allowed";
  }
  console.log(active);
  // if the purchase is founded let us chek if the plan is the same
  if (active.membership_plan_id === Plan.planId) {
    // here we going to ectend it not more
    const updatedDate = new Date(active.end_date);
    updatedDate.setDate(updatedDate.getDate() + Plan.duration_days);
    active.end_date = updatedDate;
    await active.save({ session });
    return "extended";
  }
  // if not same let use chake the remaining dates
  const remainigDate = Math.ceil(
    (active.end_date - now) / (1000 * 60 * 60 * 24),
  );

  if (remainigDate >= 0 && remainigDate <= 5) {
    // here we are bout to  expire the existign and
    // let us expire the existing purchase
    active.status = "expired";
    await active.save({ session });
    // then the user is procceded to create new purchase
    return "allowed";
  }

  return "notallowed";
  // if same checke the remainig date is 5 or les
  // extend teh purchase by teh plans durasion day
  // if not return not allowed then you will mark this ass pennndng refeund later
};
