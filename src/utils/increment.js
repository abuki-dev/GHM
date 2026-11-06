const mongoose = require("mongoose");

module.exports.incrementId = async function (doc, dbmodel) {
  if (doc.isNew) {
    try {
      const counter = await mongoose.model("counters").findOneAndUpdate(
        { _id: dbmodel },
        { $inc: { sequence_value: 1 } },
        {
          upsert: true,
          new: true,
        },
      );
      dbmodel = dbmodel.replace("Id", ""); // Remove "Id" from the model name
      // Dynamically sets the id field (e.g., doc._id or doc.studentId)
      doc[dbmodel] = `${dbmodel}-${counter.sequence_value}`;
    } catch (error) {
      throw new Error(
        `Error while incrementing the id for ${dbmodel}: ${error.message}`,
      );
    }
  }
};
