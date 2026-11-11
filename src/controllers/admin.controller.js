const {newtraining} = require("../services");

module.exports.createTraining = async (req, res, next) => {
    try {
        const traning = await newtraining(req.body);
        res.status(201).json({message: "training successfully", traning});
    } catch (err) {
        next(err);
    }
};
module.exports.deleteTraining = async (req, res, next) => {
    try {
        awiat removetraining(req.body);
    } catch (err) {
        next(err);
    }
}
