const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment.js");
const staffSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "users",
    index: true,
    unique: true,
  },
  staffId: { type: String, required: true, unique: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  salary: { type: Number, required: true },
  hireDate: { type: Date, required: true },
});
staffSchema.pre("validate", async function () {
  await incrementId(this, "staffId");
});
const Staff = mongoose.model("staff", staffSchema);
module.exports = Staff;
