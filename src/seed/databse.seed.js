/**
 * Titans Gym: database seed
 *
 * WHAT IT DOES
 *   Development / staging (NODE_ENV != production):
 *     Creates a small but complete demo gym: 1 admin, 2 staff, 3 trainers,
 *     9 members, 4 trainings, 4 shifts, 6 plans, payments in every state,
 *     purchases (active, expiring, expired, frozen), check-ins, sessions and
 *     feedback. Everything is written in ONE transaction: it is all or nothing.
 *
 *   Production (NODE_ENV = production):
 *     Never creates demo data and never creates accounts with known passwords.
 *     It only creates the FIRST admin, from environment variables:
 *       ADMIN_EMAIL, ADMIN_PASSWORD (12+ chars), ADMIN_PHONE (10 digits),
 *       and optionally ADMIN_NAME.
 *
 * SAFETY RULES
 *   - If any admin already exists, the seed does nothing (an existing
 *     database is never touched).
 *   - SEED_DATABASE=false turns the demo seed off in development.
 *   - Demo accounts all use one password: SEED_PASSWORD (default below).
 *     Passwords are never printed to the log.
 *   - Demo e-mails use example.com (a reserved domain), so the daily
 *     reminder job can never send mail to a real person.
 *
 * REQUIRES a MongoDB replica set (transactions), the same as the app itself.
 *
 * The data follows the same rules as the API:
 *   - one active-or-frozen purchase per member
 *   - normal plans have no shift; VIP shifts hold 15 or fewer, VVIP 5 or fewer
 *   - a trainer or a room is never booked twice at the same time
 *   - every verified payment equals its plan price
 *   - check-ins and sessions store the user's userId (USER-xxx), like the app
 */
const mongoose = require("mongoose");
const { hash } = require("bcryptjs");
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
const env = require("../config/env");
const DEMO_PASSWORD = env.SEED_PASSWORD || "Passw0rd!";
const DAY = 24 * 60 * 60 * 1000;
const ADDIS_OFFSET = 3 * 60 * 60 * 1000; // Africa/Addis_Ababa = UTC+3, no daylight saving

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const daysAgoDate = (n) => new Date(Date.now() - n * DAY);
const pad2 = (n) => String(n).padStart(2, "0");

// Ethiopian calendar parts of a moment
const addisParts = (date) => {
  const l = new Date(date.getTime() + ADDIS_OFFSET);
  return {
    y: l.getUTCFullYear(),
    m: l.getUTCMonth(),
    d: l.getUTCDate(),
    dow: l.getUTCDay(), // 0 = Sunday
    hh: l.getUTCHours(),
    mm: l.getUTCMinutes(),
  };
};
const addisHHMM = (date) => {
  const p = addisParts(date);
  return `${pad2(p.hh)}:${pad2(p.mm)}`;
};
// The moment "HH:MM" Addis time, `daysAgo` days ago, as a real Date
const addisTime = (daysAgo, hhmm) => {
  const p = addisParts(daysAgoDate(daysAgo));
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(p.y, p.m, p.d, h - 3, m));
};
const addisDow = (daysAgo) => addisParts(daysAgoDate(daysAgo)).dow;
const hhmmPlus = (hhmm, minutes) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + minutes;
  return `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`;
};
const ageFrom = (dob) =>
  Math.floor((Date.now() - dob.getTime()) / (365.25 * DAY));

// Deterministic "random" in [0,1): the same seed run always gives the same data
const rnd = (n) => {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const PATTERN_DAYS = { "MON-WED-FRI": [1, 3, 5], "TU-TH-SA": [2, 4, 6] };

/* ------------------------------------------------------------------ */
/* Demo data definitions                                               */
/* ------------------------------------------------------------------ */

const ADMIN = {
  name: "Abubeker Mohammed",
  email: "admin@example.com",
  phone: "0911000001",
  gender: "male",
  dob: "1990-03-12",
};

const STAFF = [
  {
    key: "selamawit",
    name: "Selamawit Bekele",
    email: "selamawit.staff@example.com",
    phone: "0911000002",
    gender: "female",
    dob: "1999-06-21",
    specialization: "Front desk and billing",
    experience: 3,
    salary: 9000,
  },
  {
    key: "yared",
    name: "Yared Haile",
    email: "yared.staff@example.com",
    phone: "0911000003",
    gender: "male",
    dob: "1996-11-02",
    specialization: "Front desk and memberships",
    experience: 2,
    salary: 8500,
  },
];

const TRAINERS = [
  {
    key: "dawit",
    name: "Dawit Tadesse",
    email: "dawit.trainer@example.com",
    phone: "0911000004",
    gender: "male",
    dob: "1993-02-14",
    specialization: "Strength and conditioning",
    experience: 6,
    salary: 16000,
  },
  {
    key: "hanna",
    name: "Hanna Alemu",
    email: "hanna.trainer@example.com",
    phone: "0911000005",
    gender: "female",
    dob: "1996-08-30",
    specialization: "HIIT and cardio",
    experience: 4,
    salary: 15000,
  },
  {
    key: "samuel",
    name: "Samuel Girma",
    email: "samuel.trainer@example.com",
    phone: "0911000006",
    gender: "male",
    dob: "1989-12-05",
    specialization: "Personal coaching",
    experience: 9,
    salary: 22000,
  },
];

const MEMBERS = [
  {
    key: "bereket",
    name: "Bereket Kebede",
    email: "bereket@example.com",
    phone: "0911000010",
    gender: "male",
    dob: "2000-05-10",
    weight: 68,
    height: 175,
  },
  {
    key: "meron",
    name: "Meron Girma",
    email: "meron@example.com",
    phone: "0911000011",
    gender: "female",
    dob: "2001-09-20",
    weight: 58,
    height: 164,
  },
  {
    key: "yonas",
    name: "Yonas Assefa",
    email: "yonas@example.com",
    phone: "0911000012",
    gender: "male",
    dob: "1988-01-25",
    weight: 82,
    height: 180,
  },
  {
    key: "sosina",
    name: "Sosina Tadesse",
    email: "sosina@example.com",
    phone: "0911000013",
    gender: "female",
    dob: "1997-04-18",
    weight: 61,
    height: 168,
  },
  {
    key: "tigist",
    name: "Tigist Worku",
    email: "tigist@example.com",
    phone: "0911000014",
    gender: "female",
    dob: "1994-07-07",
    weight: 64,
    height: 162,
  },
  {
    key: "abel",
    name: "Abel Mekonnen",
    email: "abel@example.com",
    phone: "0911000015",
    gender: "male",
    dob: "1999-10-03",
    weight: 74,
    height: 178,
  },
  {
    key: "hana",
    name: "Hana Desta",
    email: "hana@example.com",
    phone: "0911000016",
    gender: "female",
    dob: "1995-03-29",
    weight: 56,
    height: 160,
  },
  {
    key: "kaleb",
    name: "Kaleb Tesfaye",
    email: "kaleb@example.com",
    phone: "0911000017",
    gender: "male",
    dob: "2002-12-11",
    weight: 70,
    height: 176,
  },
  {
    key: "liya",
    name: "Liya Berhanu",
    email: "liya@example.com",
    phone: "0911000018",
    gender: "female",
    dob: "1998-06-15",
    weight: 59,
    height: 166,
  },
];

const TRAININGS = [
  {
    key: "strength",
    title: "Strength and Conditioning",
    category: "Strength",
    level: "beginner",
    description:
      "Progressive barbell and bodyweight strength work for all levels.",
  },
  {
    key: "hiit",
    title: "High Intensity Interval Training",
    category: "Cardio",
    level: "intermediate",
    description: "Fast paced circuits that build endurance and burn fat.",
  },
  {
    key: "personal",
    title: "Personal Coaching",
    category: "Coaching",
    level: "advanced",
    description:
      "One on one coaching with a custom plan and weekly progress checks.",
  },
  {
    key: "yoga",
    title: "Yoga and Mobility",
    category: "Wellness",
    level: "beginner",
    description: "Flexibility, balance and recovery sessions.",
  },
];

// Normal plans have no shift (the API stores shiftId = null for them).
// "main" is a shift no plan uses: handy to test that an unused shift CAN be deleted.
const SHIFTS = [
  {
    key: "main",
    trainer: "dawit",
    room: "Main hall",
    period: "morning",
    days: "MON-WED-FRI",
    start: "06:00",
    end: "08:00",
    cap: 30,
  },
  {
    key: "vipMwf",
    trainer: "hanna",
    room: "VIP Room",
    period: "night",
    days: "MON-WED-FRI",
    start: "17:30",
    end: "19:30",
    cap: 15,
  },
  {
    key: "vipTts",
    trainer: "hanna",
    room: "VIP Room",
    period: "night",
    days: "TU-TH-SA",
    start: "17:30",
    end: "19:30",
    cap: 15,
  },
  {
    key: "vvip",
    trainer: "samuel",
    room: "VVIP Room",
    period: "morning",
    days: "MON-WED-FRI",
    start: "08:00",
    end: "09:30",
    cap: 5,
  },
];

const PLANS = [
  {
    key: "stdMonthly",
    title: "Standard Monthly",
    tier: "normal",
    days: 30,
    price: 1500,
    training: "strength",
    description: "30 days of full gym floor access.",
  },
  {
    key: "stdQuarterly",
    title: "Standard Quarterly",
    tier: "normal",
    days: 90,
    price: 4000,
    training: "strength",
    description: "90 days of full gym floor access at a lower monthly price.",
  },
  {
    key: "vipMwf",
    title: "VIP Evening Mon Wed Fri",
    tier: "vip",
    days: 30,
    price: 2500,
    training: "hiit",
    shift: "vipMwf",
    description: "VIP room evening coaching on Monday, Wednesday and Friday.",
  },
  {
    key: "vipTts",
    title: "VIP Evening Tue Thu Sat",
    tier: "vip",
    days: 30,
    price: 2500,
    training: "hiit",
    shift: "vipTts",
    description: "VIP room evening coaching on Tuesday, Thursday and Saturday.",
  },
  {
    key: "vvip",
    title: "VVIP Private Coaching",
    tier: "vvip",
    days: 30,
    price: 5000,
    training: "personal",
    shift: "vvip",
    description: "Private room with a dedicated trainer, small group of five.",
  },
  // closed plan: stays in the database but members cannot see or buy it
  {
    key: "oldPromo",
    title: "Launch Promo Closed",
    tier: "normal",
    days: 30,
    price: 999,
    training: "yoga",
    active: false,
    description: "Old launch offer, no longer on sale.",
  },
];

/**
 * One entry per member who has (or had) a membership.
 * start = days ago the purchase began. state decides the rest.
 */
const MEMBERSHIPS = [
  {
    member: "bereket",
    plan: "stdMonthly",
    start: 12,
    state: "active",
    method: "CBE",
  },
  {
    member: "meron",
    plan: "vipMwf",
    start: 20,
    state: "active",
    method: "teleBirr",
  },
  { member: "yonas", plan: "vvip", start: 6, state: "active", method: "BOA" },
  {
    member: "sosina",
    plan: "stdQuarterly",
    start: 40,
    state: "active",
    method: "Dashen",
  },
  // ends in 3 days: the daily job will send the "3 days left" reminder
  {
    member: "tigist",
    plan: "stdMonthly",
    start: 27,
    state: "expiring",
    method: "teleBirr",
  },
  // ended 5 days ago: renewing now must become a NEW purchase
  {
    member: "abel",
    plan: "stdMonthly",
    start: 35,
    state: "expired",
    method: "CBE",
  },
  // froze 3 days ago for 7 days
  { member: "hana", plan: "vipTts", start: 12, state: "frozen", method: "BOA" },
];

const FEEDBACKS = [
  {
    member: "bereket",
    title: "Clean gym floor",
    body: "The equipment is well maintained and the floor is always clean in the morning.",
  },
  {
    member: "meron",
    title: "VIP room evenings",
    body: "Evening sessions with Hanna are great. More water stations would be nice.",
  },
  {
    member: "yonas",
    title: "Private coaching",
    body: "Samuel built a plan around my knee injury. Very professional.",
  },
  {
    member: "sosina",
    title: "Opening hours",
    body: "Could the gym open a little earlier on Saturdays?",
  },
];

/* ------------------------------------------------------------------ */
/* Production: only the first admin, from environment variables        */
/* ------------------------------------------------------------------ */

async function createFirstAdminFromEnv() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_PHONE, ADMIN_NAME } = env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE) {
    console.warn(
      "No admin account exists. Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_PHONE to create the first admin.",
    );
    return;
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters in production.",
    );
  }
  await Users.create({
    full_name: ADMIN_NAME || "System Admin",
    email: ADMIN_EMAIL.toLowerCase().trim(),
    password: await hash(ADMIN_PASSWORD, 10),
    role: "admin",
    phone: ADMIN_PHONE,
  });
  console.log("First admin account created for", ADMIN_EMAIL);
}

/* ------------------------------------------------------------------ */
/* Development: the full demo gym, in one transaction                  */
/* ------------------------------------------------------------------ */

async function seedDemoData() {
  console.log("Empty database found. Seeding the demo gym...");

  // Make sure collections and indexes exist before the transaction starts
  await Promise.all(
    [
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
    ].map((M) => M.init()),
  );

  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const summary = {};

  await mongoose.connection.transaction(async (session) => {
    // the callback may be retried by MongoDB, so everything is built fresh in here
    Object.keys(summary).forEach((k) => delete summary[k]);
    const count = (name, n = 1) => {
      summary[name] = (summary[name] || 0) + n;
    };
    const create = async (Model, doc, name) => {
      const [created] = await Model.create([doc], { session });
      count(name || Model.modelName);
      return created;
    };
    let txnCounter = 0;
    const txn = (method) => {
      const prefix = {
        CBE: "FT26",
        teleBirr: "TB26",
        BOA: "BOA26",
        Dashen: "DSH26",
        manual: "CASH26",
      }[method];
      txnCounter += 1;
      return `${prefix}${String(txnCounter * 7919).padStart(7, "0")}`;
    };

    /* ---- users and role profiles ---- */
    const userDoc = (p, role, createdDaysAgo) => ({
      full_name: p.name,
      email: p.email,
      password: passwordHash,
      role,
      gender: p.gender,
      age: ageFrom(new Date(p.dob)),
      phone: p.phone,
      createdAt: daysAgoDate(createdDaysAgo),
    });

    const adminUser = await create(
      Users,
      userDoc(ADMIN, "admin", 120),
      "users",
    );

    const staff = {};
    for (const p of STAFF) {
      const user = await create(Users, userDoc(p, "staff", 100), "users");
      await create(Staff, {
        userId: user.userId,
        specialization: p.specialization,
        experience: p.experience,
        salary: p.salary,
        hireDate: daysAgoDate(300),
      });
      staff[p.key] = user;
    }

    const trainers = {};
    for (const p of TRAINERS) {
      const user = await create(Users, userDoc(p, "trainer", 100), "users");
      const profile = await create(Trainer, {
        userId: user.userId,
        specialization: p.specialization,
        experience: p.experience,
        salary: p.salary,
        hireDate: daysAgoDate(400),
      });
      trainers[p.key] = { user, trainerId: profile.trainerId };
    }

    const members = {};
    for (const p of MEMBERS) {
      const user = await create(Users, userDoc(p, "member", 60), "users");
      await create(Member, {
        userId: user.userId,
        dateOfBirth: new Date(p.dob),
        weight: p.weight,
        height: p.height,
      });
      members[p.key] = user;
    }

    /* ---- trainings, shifts, plans ---- */
    const trainings = {};
    for (const t of TRAININGS) {
      trainings[t.key] = await create(Training, {
        title: t.title,
        category: t.category,
        level: t.level,
        description: t.description,
      });
    }

    const shifts = {};
    for (const s of SHIFTS) {
      const doc = await create(Shifts, {
        trainerId: trainers[s.trainer].trainerId,
        room: s.room,
        period: s.period,
        days_of_week: [s.days],
        startTime: s.start,
        endTime: s.end,
        max_capacity: s.cap,
      });
      shifts[s.key] = { doc, def: s };
    }

    const plans = {};
    for (const p of PLANS) {
      const doc = await create(MembershipPlans, {
        title: p.title,
        tier: p.tier,
        description: p.description,
        duration_days: p.days,
        price: p.price,
        training_id: trainings[p.training].trainingId,
        shiftId: p.shift ? shifts[p.shift].doc.shiftId : null,
        isActive: p.active !== false,
      });
      plans[p.key] = { doc, def: p };
    }

    /* ---- payments and purchases (one verified payment per purchase) ---- */
    const staffA = staff.selamawit.userId;
    const staffB = staff.yared.userId;
    const purchases = {};

    for (const m of MEMBERSHIPS) {
      const user = members[m.member];
      const plan = plans[m.plan];
      const startDate = daysAgoDate(m.start);
      const endDate = new Date(startDate.getTime() + plan.def.days * DAY);

      const payment = await create(Payments, {
        userId: user.userId,
        planId: plan.doc.planId,
        amount: plan.def.price, // always equal to the plan price
        transactionId: txn(m.method),
        method: m.method,
        category: "new",
        status: "verified",
        reason: "Payment verified successfully",
        verifiedBy: m.start % 2 === 0 ? staffA : staffB,
        date: startDate,
        createdAt: startDate,
        updatedAt: startDate,
      });

      const purchaseDoc = {
        member_id: user.userId,
        membership_plan_id: plan.doc.planId,
        payment_id: payment._id.toString(),
        start_date: startDate,
        end_date: endDate,
        status: "active",
        shiftId: plan.doc.shiftId || null,
        createdAt: startDate,
        updatedAt: startDate,
      };

      if (m.state === "expiring") {
        purchaseDoc.remindersSent = [5]; // the 5-day reminder already went out
      }
      if (m.state === "expired") {
        purchaseDoc.status = "expired";
        purchaseDoc.remindersSent = [5, 3, 1];
        purchaseDoc.expiredNotifiedAt = endDate;
      }
      if (m.state === "frozen") {
        const frozenAt = daysAgoDate(3);
        const frozenUntil = daysFromNow(4); // a 7-day freeze
        purchaseDoc.status = "frozen";
        purchaseDoc.freezeStartedAt = frozenAt;
        purchaseDoc.freezeUntil = frozenUntil;
        purchaseDoc.freezeUntill = frozenUntil; // legacy spelling, kept in step with the app
      }

      purchases[m.member] = await create(MembershipPurchase, purchaseDoc);
    }

    // Payment history and open payments for the staff queue
    const stdMonthly = plans.stdMonthly.doc;
    const vipMwf = plans.vipMwf.doc;
    const vvip = plans.vvip.doc;

    // abel: tried VIP first, the shift was full, staff refunded him; then bought Standard
    await create(Payments, {
      userId: members.abel.userId,
      planId: vipMwf.planId,
      amount: plans.vipMwf.def.price,
      transactionId: txn("CBE"),
      method: "CBE",
      category: "new",
      status: "refunded",
      reason: "Shift is full",
      verifiedBy: staffA,
      date: daysAgoDate(38),
      createdAt: daysAgoDate(38),
      updatedAt: daysAgoDate(37),
    });

    // kaleb: an old declined payment, then a new one waiting for approval
    await create(Payments, {
      userId: members.kaleb.userId,
      planId: stdMonthly.planId,
      amount: plans.stdMonthly.def.price,
      transactionId: txn("teleBirr"),
      method: "teleBirr",
      category: "new",
      status: "failed",
      reason: "Invalid reference number",
      verifiedBy: staffB,
      date: daysAgoDate(6),
      createdAt: daysAgoDate(6),
      updatedAt: daysAgoDate(6),
    });
    await create(Payments, {
      userId: members.kaleb.userId,
      planId: vipMwf.planId,
      amount: plans.vipMwf.def.price,
      transactionId: txn("CBE"),
      method: "CBE",
      category: "new",
      status: "pending",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    // bereket: renewing his active plan early (pending, category renew)
    await create(Payments, {
      userId: members.bereket.userId,
      planId: stdMonthly.planId,
      amount: plans.stdMonthly.def.price,
      transactionId: txn("teleBirr"),
      method: "teleBirr",
      category: "renew",
      status: "pending",
      date: new Date(Date.now() - 45 * 60 * 1000),
    });

    // liya: paid the wrong amount for VVIP; staff marked it for refund
    await create(Payments, {
      userId: members.liya.userId,
      planId: vvip.planId,
      amount: 4000,
      transactionId: txn("BOA"),
      method: "BOA",
      category: "new",
      status: "refund_pending",
      reason: `Amount 4000 does not match the plan price ${plans.vvip.def.price}`,
      verifiedBy: staffA,
      date: daysAgoDate(1),
      createdAt: daysAgoDate(1),
      updatedAt: daysAgoDate(1),
    });

    /* ---- check-ins and sessions ---- */
    const checkins = [];
    const sessions = [];
    const notes = [
      "Good form on squats and deadlifts. Increase weight next week.",
      "Strong interval work. Heart rate recovered well.",
      "Focused on mobility and core stability.",
      "Hit a new personal best on the bench press.",
      "Light day, technique work and stretching.",
    ];
    const trainerOf = (shiftDef) => trainers[shiftDef.trainer].trainerId;

    MEMBERSHIPS.forEach((m, idx) => {
      const user = members[m.member];
      const plan = plans[m.plan];
      const shiftEntry = plan.def.shift ? shifts[plan.def.shift] : null;
      const startedAgo = m.start;

      // activity window, in "days ago": from the oldest day to the newest day with visits
      const from = Math.min(13, startedAgo);
      let to = 0;
      if (m.state === "expired") to = Math.max(0, startedAgo - plan.def.days); // no visits after it ended
      if (m.state === "frozen") to = 3; // no visits while frozen

      for (let daysAgo = from; daysAgo >= to; daysAgo--) {
        if (
          shiftEntry &&
          !PATTERN_DAYS[shiftEntry.def.days].includes(addisDow(daysAgo))
        )
          continue;
        const chance = shiftEntry ? 0.85 : 0.5;
        if (rnd(idx * 101 + daysAgo * 7 + 1) > chance) continue;

        const when = shiftEntry
          ? addisTime(
              daysAgo,
              hhmmPlus(
                shiftEntry.def.start,
                5 + Math.floor(rnd(idx * 53 + daysAgo) * 25),
              ),
            )
          : addisTime(
              daysAgo,
              hhmmPlus(
                "00:00",
                6 * 60 + Math.floor(rnd(idx * 37 + daysAgo) * 14 * 60),
              ),
            );
        if (when.getTime() > Date.now()) continue;

        checkins.push({
          userId: user.userId,
          checkinTime: when,
          createdAt: when,
          updatedAt: when,
        });

        if (shiftEntry && daysAgo >= 1) {
          sessions.push({
            member_id: user.userId,
            trainer_id: trainerOf(shiftEntry.def),
            shiftId: shiftEntry.doc.shiftId,
            start_time: addisHHMM(when),
            end_time: new Date(when.getTime() + 60 * 60 * 1000),
            calories_burned: 250 + Math.floor(rnd(idx * 17 + daysAgo) * 270),
            status: "completed",
            client_note: notes[(idx + daysAgo) % notes.length],
            createdAt: when,
            updatedAt: when,
          });
        }
      }
    });

    // one cancelled session for meron, so every status exists
    const meronSession = sessions.find(
      (s) => s.member_id === members.meron.userId,
    );
    if (meronSession) {
      meronSession.status = "cancelled";
      meronSession.calories_burned = 0;
      meronSession.client_note = "Member cancelled: travelling.";
    }

    // "Today" demo data, so the staff attendance and trainer views are not empty
    const justNow = (minutesAgo) =>
      new Date(Date.now() - minutesAgo * 60 * 1000);
    [
      ["bereket", 90],
      ["sosina", 25],
      ["yonas", 35],
    ].forEach(([key, minutesAgo]) => {
      const when = justNow(minutesAgo);
      checkins.push({
        userId: members[key].userId,
        checkinTime: when,
        createdAt: when,
        updatedAt: when,
      });
    });
    const yonasWhen = justNow(35);
    sessions.push({
      member_id: members.yonas.userId,
      trainer_id: trainerOf(shifts.vvip.def),
      shiftId: shifts.vvip.doc.shiftId,
      start_time: addisHHMM(yonasWhen),
      calories_burned: 0,
      status: "in_progress",
      client_note: "Private session under way.",
      createdAt: yonasWhen,
      updatedAt: yonasWhen,
    });

    await Checkins.insertMany(checkins, { session });
    count("checkins", checkins.length);
    await Sessions.insertMany(sessions, { session });
    count("sessions", sessions.length);

    /* ---- feedback ---- */
    const feedbackDocs = FEEDBACKS.map((f, i) => ({
      userId: members[f.member].userId,
      title: f.title,
      body: f.body,
      createdAt: daysAgoDate(10 - i * 2),
    }));
    await Feedbacks.insertMany(feedbackDocs, { session });
    count("feedbacks", feedbackDocs.length);

    summary.adminEmail = adminUser.email;
  });

  console.log("Demo gym seeded:", JSON.stringify(summary));
  console.log("Demo logins (same password for all, see SEED_PASSWORD):");
  console.log(`  admin   ${ADMIN.email}`);
  console.log(`  staff   ${STAFF[0].email}`);
  console.log(`  trainer ${TRAINERS[1].email}`);
  console.log(`  member  ${MEMBERS[0].email}`);
  console.log("Test scenarios in the data:");
  console.log("  bereket: active plan + a pending RENEW payment (approve it)");
  console.log(
    "  kaleb:   a pending NEW payment for VIP, and an older declined one",
  );
  console.log("  liya:    a refund_pending payment (wrong amount)");
  console.log("  tigist:  plan ends in 3 days (reminder job)");
  console.log(
    "  abel:    expired 5 days ago (renewal must become a new purchase)",
  );
  console.log("  hana:    frozen membership (resume it)");
  console.log(
    "  Main hall shift has no plan: safe to delete; VIP/VVIP shifts are blocked",
  );
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

const seedDatabase = async () => {
  try {
    // never touch a database that already has an admin
    if (await Users.exists({ role: "admin" })) return;

    if (env.NODE_ENV === "production") {
      await createFirstAdminFromEnv();
      return;
    }
    if (env.SEED_DATABASE === "false") {
      console.log("SEED_DATABASE=false: demo seed skipped.");
      return;
    }
    await seedDemoData();
  } catch (error) {
    console.error("Seeding failed, nothing was saved:", error.message);
  }
};

module.exports = seedDatabase;
