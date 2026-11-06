const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const { validationResult } = require("express-validator");

const { signToken } = require("../utils/token");
const Users = require("../migrations/Users");
const Trainer = require("../migrations/Trainer");
const Member = require("../migrations/Member");

module.exports.register = async (req, res, next) => {
  try {
    const {
      userId,
      full_name,
      email,
      password,
      role,
      gender,
      age,
      phone,
      extraDetails,
    } = req.body;

    const exstingUser = await Users.findOne({ email });
    if (exstingUser) {
      return res.json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Users({
      userId: req.body.userId || (await incrementId("USR")),
      full_name,
      email,
      password: hashedPassword,
      role,
      gender,
      age,
      phone,
    });

    await newUser.save();

    if (role === "member" && extraDetails) {
      await Member.create({
        memberId: newUser.userId,
        dateOfBirth: extraDetails.dateOfBirth,
        weight: extraDetails.weight,
        height: extraDetails.height,
      });
    }

    if (role === "trainer" && extraDetails) {
      await Trainer.create({
        trainerId: newUser.userId,
        specialization: extraDetails.specialization,
        experience: extraDetails.experience,
        salary: extraDetails.salary,
        hireDate: extraDetails.hireDate || new Date(),
      });
    }

    return res.json({
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((err) => err.msg),
      });
    }

    const { email, password } = req.body;
    const user = await Users.findOne({ email });
    if (!user) {
      return res.json({ message: "Invalid Email or password" });
    }
    if (!user.isActive) {
      return res.json({ message: "User account is inactive" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ message: "Invalid Email or password" });
    }

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1d" },
    );
    return res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};
