const {
  insertUser,
  loginUser,
  createStandard,
  generateUserSession,
} = require("../services");
const {
  logoutUser,
  getMyProfile,
  updateMyProfile,
  changePassword
} = require("../services/auth.service");
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
module.exports.logout = async (req, res, next) => {
  try {
    const result = await logoutUser(res);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
//create every accoutn memebr staff admin trainer subscriotion plan shift traning purchase

//cretae account
// if role memmber insert user
// if role  staff create standard account
// if role trainer
module.exports.cretaeNewaccount = async (req, res, next) => {
  try {
    const account = await createStandard(req.body);
    res.json({ message: "Account created sucussfuly ", account });
  } catch (error) {
    next(error);
  }
};
module.exports.chekinUser = async (req, res, next) => {
  try {
    const session = await generateUserSession(req.body);
    res.status(201).json({ message: "Session generated ", session });
  } catch (error) {
    next(error);
  }
};
module.exports.getProfile = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports.updateProfile = async (req, res, next) => {
  try {
    const user = await updateMyProfile(req.body, req.user);
    res.json(user);
  } catch (error) {
    next(error);
  }
};
module.exports.updatePassword = async (req, res, next) => {
  try {
    const result = await changePassword(req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
