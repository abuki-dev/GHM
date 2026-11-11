const { newtraining } = require("../services");
const { removetraining, newMembershipPlan } = require("../services/admin.service");

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
