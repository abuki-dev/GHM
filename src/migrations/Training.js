const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema({
  training_id: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Training", trainingSchema);
