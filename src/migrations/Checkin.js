const mongoose = require("mongoose");

const checkinSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "members",
      required: true,
      index: true,
    },
    chekinTime: { type: Date, default: Date.now, required: true, index: true },
  },
  { timestamps: true },
);
const Checkins = mongoose.model("chekins", checkinSchema);
module.exports = Checkins;
