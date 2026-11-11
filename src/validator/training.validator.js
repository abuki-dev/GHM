const { body} = require("express-validator");
const trainingValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is request")
    .isAlpha("en-US")
    .withMessage("title must contain only letters and spaces")
    .escape(),

  body("catagory")
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
    .isAlpha("en-US")
    .withMessage("description must contain only letters and spaces")
    .escape(),
];

const validateMembershipPlan = [
  body("Title").trim().notEmpty().withMessage("Title is required"),

  body("description").trim().notEmpty().withMessage("Description is required"),

  body("duration_days")
    .notEmpty()
    .withMessage("Duration in days is required")
    .isNumeric()
    .withMessage("Duration days must be a number"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price cannot be negative"),
];
module.exports = {
  trainingValidator,
  validateMembershipPlan,
};
