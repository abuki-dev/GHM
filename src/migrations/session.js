const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  member_id: {
    type: String,
    ref: "members",
    required: true,
  },
  trainer_id: {
    type: String,
    ref: "trainers",
    required: true,
  },
  start_time: { type: Date, default: Date.now },
  end_time: { type: Date },
  calories_burned: { type: Number },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    required: true,
    index: true,
  },
  client_note: { type: String },
  date_duration: { type: Number, required: true },
});
module.exports = mongoose.model("sessions", sessionSchema);
