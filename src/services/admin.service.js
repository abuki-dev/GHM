const {Training} = require("../migrations");
module.exports.newtraining = async function ({
                                                 title,
                                                 description,
                                                 level,
                                                 category,
                                             }) {
    const training = await Training.create({
        title: title,
        description: description,
        level: level,
        category: category,
    });
    return training;
};
module.exports.removetraining = async function ({trainingId}) {
}