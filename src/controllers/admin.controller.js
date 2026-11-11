const {
  newtraining,
  newshift,
  removeshift,
  removetraining,
  newMembershipPlan,
} = require("../services");

module.exports.createTraining = async (req, res, next) => {
  try {
    const training = await newtraining(req.body);
    res
      .status(201)
      .json({ message: "training created successfully", training });
  } catch (err) {
    next(err);
  }
};
module.exports.deleteTraining = async (req, res, next) => {
  try {
    await removetraining(req.body);
    res.status(200).json({ message: "training deleted successfully" });
  } catch (err) {
    next(err);
  }
};
module.exports.createMembershipPlan = async (req, res, next) => {
  try {
    const membershipPlan = await newMembershipPlan(req.body);
    res
      .status(201)
      .json({ message: "MembershipPlan created successfully", membershipPlan });
  } catch (err) {
    next(err);
  }
};
module.exports.createShifts = async (req, res, next) => {
  try {
    const shift = await newshift(req.body);
    res.status(201).json({ message: "shift successfully", shift });
  } catch (err) {
    next(err);
  }
};

module.exports.deleteShifts = async (req, res, next) => {
  try {
    const shift = await removeshift(req.body);
    res.status(200).json({ message: "shift successfully", shift });
  } catch (err) {
    next(err);
  }
};
