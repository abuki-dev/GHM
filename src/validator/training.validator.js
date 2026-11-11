const { body } = require("express-validator");
const trainingValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is request")
    .isAlpha("en-US", { ignore: " 0123456789-'&.," })
    .withMessage("title must contain only letters and spaces")
    .escape(),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("catagory is request")
    .isAlpha("en-US", { ignore: " 0123456789-'&." })
    .withMessage("catagory must contain only letters and spaces")
    .escape(),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("description is request")
    .isAlpha("en-US", { ignore: " 01234567894-'&.," })
    .withMessage("description must contain only letters and spaces")
    .escape(),
];
module.exports = {
  trainingValidator,
};
