const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Training", trainingSchema);
