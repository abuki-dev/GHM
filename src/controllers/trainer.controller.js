const trainerService = require("../services/trainer.service"); // Update path if your service file is named differently

module.exports.MyShifts = async (req, res, next) => {
  try {
    const shifts = await trainerService.getMyShifts(req.user);
    return res.status(200).json({
      success: true,
      data: shifts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.MySessions = async (req, res, next) => {
  try {
    const sessions = await trainerService.getMySessions(req.user);
    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports.UpdateMySession = async (req, res, next) => {
  try {
    const updatedSession = await trainerService.updateMySession(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    next(error);
  }
};
