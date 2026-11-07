const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

module.exports.incrementId = async function (doc, dbmodel) {
  if (doc.isNew) {
    console.log("Incrementing ID for model:", dbmodel);
    try {
      const prefix = dbmodel.replace("Id", "").toUpperCase();
      console.log(dbmodel);
      const counter = await Counter.findOneAndUpdate(
        { _id: dbmodel }, // Finds the doc (e.g., { _id: "userId" })
        { $inc: { sequence_value: 1 } }, // Atomically increments the counter
        {
          upsert: true, // Creates the counter document if it doesn't exist
          returnDocument: "after", // Fixes the deprecation warning (replaces new: true)
        },
      );
      const paddedSeq = String(counter.sequence_value).padStart(3, "0");
      doc[dbmodel] = `${prefix}-${paddedSeq}`;
    } catch (error) {
      throw new Error(
        `Error while incrementing the id for ${dbmodel}: ${error.message}`,
      );
    }
  }
};
