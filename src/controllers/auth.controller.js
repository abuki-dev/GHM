const { insertUser, loginUser } = require("../services");
const { cookieOptions } = require("../utils/token");

module.exports.register = async (req, res, next) => {
  try {
    const newUser = await insertUser(req.body);
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: newUser.userId,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { user, token } = await loginUser(req.body);
    res.cookie("token", token, cookieOptions);
    return res.json({
      success: true,
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};
