const bcrypt = require("bcrypt");
const {
  Users,
  Staff,
  Trainer,
  Member,
  Shifts,
  Training,
  MembershipPlans,
  Payments,
  MembershipPurchase,
  Checkins,
  Sessions,
  Feedbacks,
} = require("../migrations");

const seedDatabase = async () => {
  try {
    // Skip if an admin already exists
    const adminExists = await Users.findOne({ role: "admin" });
    if (adminExists) {
      return;
    }

    console.log("Database empty. Seeding complete gym dataset...");

    const adminPassword = await bcrypt.hash("Admin@1234", 10);
    const member = await bcrypt.hash("member@1234", 10);
    const staffPassword = await bcrypt.hash("staff@1234", 10);
    const trainerPassword = await bcrypt.hash("trainer@1234", 10);
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // 1. USERS (Admin, Staff, 2 Trainers, 2 Members)
    const adminUser = await Users.create({
      full_name: "Abubeker Admin",
      email: "admin@gym.com",
      password: adminPassword,
      role: "admin",
      gender: "male",
      age: 28,
      phone: "0911000001",
    });

    const staffUser = await Users.create({
      full_name: "Selamawit Bekele",
      email: "staff@gym.com",
      password: staffPassword,
      role: "staff",
      gender: "female",
      age: 24,
      phone: "0911000002",
    });

    const trainerUser1 = await Users.create({
      full_name: "Dawit Tadesse",
      email: "dawit.trainer@gym.com",
      password: trainerPassword,
      role: "trainer",
      gender: "male",
      age: 30,
      phone: "0911000003",
    });

    const trainerUser2 = await Users.create({
      full_name: "Hanna Alemu",
      email: "hanna.trainer@gym.com",
      password: trainerPassword,
      role: "trainer",
      gender: "female",
      age: 27,
      phone: "0911000004",
    });

    const memberUser1 = await Users.create({
      full_name: "Bereket Kebede",
      email: "bereket@gym.com",
      password: member,
      role: "member",
      gender: "male",
      age: 22,
      phone: "0911000005",
    });

    const memberUser2 = await Users.create({
      full_name: "Meron Girma",
      email: "meron@gym.com",
      password: member,
      role: "member",
      gender: "female",
      age: 25,
      phone: "0911000006",
    });

    // 2. ROLE PROFILES (Staff, Trainers, Members)
    await Staff.create({
      userId: staffUser.userId,
      specialization: "Front Desk & Billing",
      experience: 2,
      salary: 8500,
      hireDate: now,
    });

    const trainer1 = await Trainer.create({
      userId: trainerUser1.userId,
      specialization: "Calisthenics & Strength",
      experience: 5,
      salary: 16000,
      hireDate: now,
    });

    const trainer2 = await Trainer.create({
      userId: trainerUser2.userId,
      specialization: "HIIT & Cardio Conditioning",
      experience: 3,
      salary: 14000,
      hireDate: now,
    });

    const member1 = await Member.create({
      userId: memberUser1.userId,
      dateOfBirth: new Date("2004-05-10"),
      weight: 68,
      height: 175,
    });

    const member2 = await Member.create({
      userId: memberUser2.userId,
      dateOfBirth: new Date("2001-09-20"),
      weight: 58,
      height: 164,
    });

    // 3. SHIFTS (Requires trainerId)
    const morningShift = await Shifts.create({
      trainerId: trainer1.trainerId,
      room: "Main hall",
      period: "morning",
      days_of_week: ["MON-WED-FRI"],
      startTime: "07:00",
      endTime: "09:00",
      max_capacity: 25,
    });

    const nightShift = await Shifts.create({
      trainerId: trainer2.trainerId,
      room: "VIP Room",
      period: "night",
      days_of_week: ["TU-TH-SA"],
      startTime: "17:30",
      endTime: "19:30",
      max_capacity: 15,
    });

    // 4. TRAININGS
    const strengthTraining = await Training.create({
      title: "Bodyweight & Strength Mastery",
      category: "Strength",
      description:
        "Progressive calisthenics, pull-ups, dips, and core stability.",
      level: "beginner",
    });

    const hiitTraining = await Training.create({
      title: "High-Intensity Fat Burn",
      category: "Cardio",
      description:
        "Fast-paced circuit intervals for endurance and conditioning.",
      level: "intermediate",
    });

    // 5. MEMBERSHIP PLANS (Requires training_id & shiftId)
    const monthlyPlan = await MembershipPlans.create({
      title: "Monthly Standard Plan",
      description: "30-day full access to Main Hall morning sessions.",
      duration_days: 30,
      price: 1500,
      training_id: strengthTraining.trainingId,
      shiftId: morningShift.shiftId,
    });

    const quarterlyVipPlan = await MembershipPlans.create({
      title: "Quarterly VIP Plan",
      description: "90-day VIP Room access with evening HIIT coaching.",
      duration_days: 90,
      price: 4000,
      training_id: hiitTraining.trainingId,
      shiftId: nightShift.shiftId,
    });

    // 6. PAYMENTS (Requires userId, planId, verifiedBy)
    const payment1 = await Payments.create({
      userId: memberUser1.userId,
      planId: monthlyPlan.planId,
      amount: 1500,
      transactionId: "TXN-CBE-10001",
      method: "CBE",
      category: "new",
      status: "verified",
      reason: "Initial monthly subscription",
      verifiedBy: adminUser.userId,
      date: now,
    });

    const payment2 = await Payments.create({
      userId: memberUser2.userId,
      planId: quarterlyVipPlan.planId,
      amount: 4000,
      transactionId: "TXN-TB-10002",
      method: "teleBirr",
      category: "new",
      status: "verified",
      reason: "Initial quarterly VIP subscription",
      verifiedBy: staffUser.userId,
      date: now,
    });

    // Pending payment example so admin approval routes have data to test
    await Payments.create({
      userId: memberUser1.userId,
      planId: monthlyPlan.planId,
      amount: 1500,
      transactionId: "TXN-BOA-10003",
      method: "BOA",
      category: "renew",
      status: "pending",
      reason: "Early renewal request",
      date: now,
    });

    // 7. MEMBERSHIP PURCHASES (Links member_id, membership_plan_id, payment_id, shiftId)
    await MembershipPurchase.create({
      member_id: memberUser1.userId,
      membership_plan_id: monthlyPlan.planId,
      payment_id: payment1._id.toString(),
      start_date: now,
      end_date: thirtyDaysLater,
      status: "active",
      shiftId: morningShift.shiftId,
    });

    await MembershipPurchase.create({
      member_id: memberUser2.userId,
      membership_plan_id: quarterlyVipPlan.planId,
      payment_id: payment2._id.toString(),
      start_date: now,
      end_date: ninetyDaysLater,
      status: "active",
      shiftId: nightShift.shiftId,
    });

    // 8. CHECKINS (Note: Checkin.js references "members" on userId)
    await Checkins.create({
      userId: member1.memberId,
      checkinTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      chekinTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });

    await Checkins.create({
      userId: member2.memberId,
      checkinTime: now,
      chekinTime: now,
    });

    // 9. SESSIONS (Requires member_id, trainer_id, shiftId)
    await Sessions.create({
      member_id: member1.memberId,
      trainer_id: trainer1.trainerId,
      start_time: "07:00",
      end_time: new Date(now.getTime() + 60 * 60 * 1000),
      calories_burned: 420,
      status: "completed",
      client_note: "Completed 4 sets of pull-ups and wall handstand holds.",
      shiftId: morningShift.shiftId,
    });

    await Sessions.create({
      member_id: member2.memberId,
      trainer_id: trainer2.trainerId,
      start_time: "17:30",
      calories_burned: 0,
      status: "scheduled",
      client_note: "First VIP evening HIIT evaluation.",
      shiftId: nightShift.shiftId,
    });

    // 10. FEEDBACKS (Requires userId)
    await Feedbacks.create({
      userId: memberUser1.userId,
      title: "Great Morning Equipment",
      body: "The pull-up bars and parallettes in the Main Hall are well maintained.",
    });

    await Feedbacks.create({
      userId: memberUser2.userId,
      title: "VIP Room AC",
      body: "Evening sessions are super smooth, though extra water stations would be nice.",
    });

    console.log(
      "Full gym seed completed! Admin login: admin@gym.com / Admin@1234",
    );
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

module.exports = seedDatabase;
