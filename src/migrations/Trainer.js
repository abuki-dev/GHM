const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    profession: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    salary: {
      type: Number,
      required: true,
    },
    hire_date: {
      type: Date,
      required: true,
    },
    training_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Trainer", trainingSchema);
