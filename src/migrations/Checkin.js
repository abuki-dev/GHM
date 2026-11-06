const mongoose = require("mongoose");

const checkinSchema = new mongoose.Schema({
  member_id: {
    type: String,
    ref: "Members",
    required: true,
    index: true,
  },
  checkin_time: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Checkin", checkinSchema);
