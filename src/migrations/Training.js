const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");

const trainingSchema = new mongoose.Schema({
  trainingId: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
trainingSchema.pre("validate", async function () {
  await incrementId(this, "trainingId");
});
const Training = mongoose.model("trainings", trainingSchema);
module.exports = Training;
