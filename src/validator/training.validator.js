const { body } = require("express-validator");
const trainingValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is request")
    .isAlpha("en-US", { ignore: " " })
    .withMessage("title must contain only letters and spaces")
    .escape(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("catagory is request")
    .isAlpha("en-US")
    .withMessage("catagory must contain only letters and spaces")
    .escape(),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("description is request")
    .isAlpha("en-US", { ignore: " " })
    .withMessage("description must contain only letters and spaces")
    .escape(),
];
module.exports = {
  trainingValidator,
};
