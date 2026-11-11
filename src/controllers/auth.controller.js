const { insertUser, loginUser, createStandard } = require("../services");
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
