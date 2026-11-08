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

module.exports = { authenticate, requireRole };
