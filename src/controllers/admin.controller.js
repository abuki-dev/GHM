module.exports.Training = async (req, res, next) => {
  try {
    const newTraining = await insertTraning(req.body);
    return res.json({
      message: "training created successfully",
      traning: {
        traningId: newTraining.traningId,
        title: newTraining.title,
        catagory: newTraining.catagory,
        description: newTraining.description,
        level: newTraining.level,
      },
    });
  } catch (error) {
    next(error);
  }
};
