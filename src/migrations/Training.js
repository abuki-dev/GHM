const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.JS");

const trainingSchema = new mongoose.Schema({
  trainingId: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
trainingSchema.pre("save", async function () {
  await incrementId(this, "trainingId");
});
module.exports = mongoose.model("trainings", trainingSchema);
