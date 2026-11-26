const mongoose = require("mongoose");
const { incrementId } = require("../utils/increment");
const feedbackSchema = new mongoose.Schema({
  userId: { type: String, required: true, ref: "users" },
  title: { type: String, required: true },
  body: { type: String, required: true },
});
feedbackSchema.pre("validate", async function () {
  await incrementId(this, "feedbackId");
});
const Feedback = mongoose.model("feedbacks", feedbackSchema);
module.exports = Feedback;
