const { default: rateLimit } = require("express-rate-limit");
const passport = require("../config/passport");
const { UnauthorizedError } = require("../utils/app.errors");

// Use on any route that needs a logged-in user: router.get("/x", authenticate, handler)
const authenticate = passport.authenticate("jwt", { session: false });

// Use after authenticate: router.delete("/x", authenticate, requireRole("admin"), handler)
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    throw new UnauthorizedError(
      "You do not have permission to perform this action",
    );
  };
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
const registrationLimter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
});
const chekinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = {
  authenticate,
  requireRole,
  loginLimiter,
  chekinLimiter,
  registrationLimter,
};
