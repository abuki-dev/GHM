const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  trainer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trainer",
    required: true,
  },
  start_time: { type: Date, default: Date.now },
  end_time: { type: Date },
  calories_burned: { type: Number },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    required: true,
  },
  client_note: { type: String },
  date_duration: { type: Number, required: true },
});
module.exports = mongoose.model("Session", sessionSchema);
