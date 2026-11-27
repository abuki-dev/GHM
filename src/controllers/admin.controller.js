const {
  newtraining,
  newshift,
  removeshift,
  removeTraining,
  newMembershipPlan,
} = require("../services");
const {
  removePlan,
  allDatabaseUsers,
  allDatabasePlans,
  allDatabaseShifts,
  allDatabasePurchases,
  allDatabaseTrainings,
} = require("../services/admin.service");

module.exports.createTraining = async (req, res, next) => {
  try {
    const result = await newtraining(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
module.exports.deleteTraining = async (req, res, next) => {
  try {
    const result = await removeTraining(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
module.exports.createMembershipPlan = async (req, res, next) => {
  try {
    const result = await newMembershipPlan(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
module.exports.deleteMembershipPlan = async (req, res, next) => {
  try {
    const result = await removePlan(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
module.exports.createShifts = async (req, res, next) => {
  try {
    const result = await newshift(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports.deleteShifts = async (req, res, next) => {
  try {
    const result = await removeshift(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
module.exports.getAllUsers = async (req, res, next) => {
  try {
    const result = await allDatabaseUsers(req.query.page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
module.exports.getAllPlans = async (req, res, next) => {
  try {
    const result = await allDatabasePlans(req.query.page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
module.exports.getAllShifts = async (req, res, next) => {
  try {
    const result = await allDatabaseShifts(req.query.page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
module.exports.getAllPurchases = async (req, res, next) => {
  try {
    const result = await allDatabasePurchases(req.query.page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
module.exports.getAllTrainings = async (req, res, next) => {
  try {
    const result = await allDatabaseTrainings(req.query.page);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
