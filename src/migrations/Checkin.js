const mongoose = require("mongoose");

const checkinSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: "members",
    required: true,
    index: true,
  },
  checkin_time: { type: Date, default: Date.now },
});
const Checkins = mongoose.model("chekins", checkinSchema);
module.exports = Checkins;
