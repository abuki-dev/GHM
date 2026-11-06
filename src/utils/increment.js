const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

module.exports.incrementId = async function (doc, dbmodel) {
  if (doc.isNew) {
    try {
      const prefix = dbmodel === "userId" ? "USR" : dbmodel.toUpperCase();
      const counter = await Counter.findOneAndUpdate(
        { _id: dbmodel },
        { $inc: { sequence_value: 1 } },
        {
          upsert: true,
          new: true,
        },
      );
      // dbmodel = dbmodel.replace("Id", ""); // Remove "Id" from the model name
      // // Dynamically sets the id field (e.g., doc._id or doc.studentId)
      // doc[dbmodel] = `${dbmodel}-${counter.sequence_value}`;

      const paddedSeq = String(counter.sequence_value).padStart(3, "0");
      doc[dbmodel] = `${prefix}-${paddedSeq}`;
    } catch (error) {
      throw new Error(
        `Error while incrementing the id for ${dbmodel}: ${error.message}`,
      );
    }
  }
};
