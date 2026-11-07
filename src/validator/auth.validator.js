const { body ,validationResult} = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map((e) => e.msg) });
  }
  next();
};


const ValidateRegister = [
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 3 })
    .withMessage("Full name must be at least 3 characters long")
    .isAlpha("en-US", { ignore: " " })
    .withMessage("Full name must contain only letters and spaces")
    .escape(),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm Password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["admin", "staff", "trainer", "member"])
    .withMessage("Invalid role"),

  body("phone")
    .trim() // 1. Clean spaces at ends
    .blacklist(" ()-") // 2. STRIP symbols out first!
    .notEmpty() // 3. Ensure it's not blank now
    .withMessage("Phone number is required")
    .isMobilePhone("any") // 4. Validate the cleanly stripped string
    .withMessage("Invalid phone number format"), // 5. Error binds to isMobilePhone
];

const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password").trim().notEmpty().withMessage("Password is required"),
];
module.exports = {
  ValidateRegister,
  validateLogin,
  handleValidationErrors,
};
