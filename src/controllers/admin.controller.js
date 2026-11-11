const { newtraining } = require("../services");

module.exports.createTraining = async (req, res, next) => {
  try {
    const traning = await newtraining(req.body);
    res.status(201).json({ message: "training successfully", traning });
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
