const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const { signToken, cookieOptions } = require("../utils/token");
const { Users, Trainer, Member } = require("../migrations");

module.exports.register = async (req, res, next) => {
  try {
    const {
      full_name,
      email,
      password,
      role,
      gender,
      age,
      phone,
      ...extraDetails
    } = req.body;

    const exstingUser = await Users.findOne({ email });
    if (exstingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Users({
      full_name,
      email,
      password: hashedPassword,
      role,
      gender,
      age,
      phone,
    });

    await newUser.save();

    console.log("New user created:", newUser);
    if (role === "member" && extraDetails) {
      await Member.create({
        dateOfBirth: extraDetails.dateOfBirth,
        weight: extraDetails.weight,
        height: extraDetails.height,
      });
    }

    if (role === "trainer" && extraDetails) {
      await Trainer.create({
        specialization: extraDetails.specialization,
        experience: extraDetails.experience,
        salary: extraDetails.salary,
        hireDate: extraDetails.hireDate || new Date(),
      });
    }

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
    if (error.code === 11000) {
      return res.status(400).json({
        message: `Error Cannot use existing value: ${JSON.stringify(error.keyValue)}`,
      });
    }
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Users.findOne({ email });
    if (!user || (await bcrypt.compare(password, user.password)) === false) {
      return res.status(400).json({ message: "Invalid Email or password" });
    }

    if (!user.isActive) {
      return res
        .status(400)
        .json({ message: "User account is inactive contact support" });
    }

    const token = signToken(user);
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
