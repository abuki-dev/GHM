const mongoose = require("mongoose");

const checkinSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  member_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  checkin_time: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Checkin", checkinSchema);
