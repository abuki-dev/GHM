const mongoose = require("mongoose");
const { hash, compare } = require("bcryptjs");
const { Users, Member, Trainer, Staff } = require("../migrations");
const {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
} = require("../utils/app.errors");
const { signToken, cookieOptions } = require("../utils/token");

module.exports.insertUser = async ({
  full_name,
  email,
  password,
  gender,
  age,
  phone,
  weight,
  height,
  dateOfBirth,
}) => {
  const existingUser = await Users.findOne({ email });
  if (existingUser) {
    throw new ConflictError("User already exists");
  }
  const hashedPassword = await hash(password, 10);
  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      [user] = await Users.create(
        [
          {
            full_name,
            email,
            password: hashedPassword,
            gender,
            age,
            role: "member",
            phone,
          },
        ],
        { session },
      );

      await Member.create(
        [
          {
            userId: user.userId,
            dateOfBirth,
            weight,
            height,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  return user;
};
module.exports.createStandard = async ({
  full_name,
  email,
  password,
  gender,
  age,
  phone,
  role,
  specialization,
  experience,
  salary,
  hireDate,
}) => {
  // createe trainer or staff
  const isExist = await Users.findOne({ email });
  console.log(isExist);
  if (isExist) {
    throw new ConflictError("Email alredy in use by other person ");
  }
  const hassedpassword = await hash(password, 10);
  const user = await Users.create({
    full_name,
    email,
    gender,
    age,
    phone,
    role,
    password: hassedpassword,
  });

  // let us chek teh role if staff or trainer
  // teh we create for ecah
  if (role === "trainer") {
    await Trainer.create({
      userId: user.userId,
      specialization,
      salary,
      experience,
      hireDate,
    });

    return user;
  }
  // else jsust cerae staff
  if (role === "staff") {
    await Staff.create({
      userId: user.userId,
      specialization,
      salary,
      experience,
      hireDate,
    });
    return user;
  }
  throw new BadRequestError("Invalid role assigniation or account creation");
};
module.exports.loginUser = async ({ email, password }) => {
  // 2. Fetch user by email (include password explicitly if schema has select: false)
  const user = await Users.findOne({ email }).select("+password");
  if (!user) {
    throw new UnauthorizedError("Invalid email or password"); // 401 Unauthorized
  }

  // 3. Compare submitted plaintext password with stored bcrypt hash
  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError("Invalid email or password"); // 401 Unauthorized
  }

  if (!user.isActive) {
    throw new UnauthorizedError("Error Accotn is not active try aganin ");
  }
  // 4. Create signed JWT with identity and role
  const token = signToken(user);

  // 5. Remove password hash from the user document before returning
  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    token,
  };
};
module.exports.logoutUser = async (res) => {
  res.clearCookie("token", cookieOptions);
  return { message: "Logout succuss ", seccuss: true };
};
module.exports.getProfile = async ({ id }) => {
  const user = await Users.findOne({ userId: id })
    .select("userId full_name email phone gender age role")
    .lean();

  if (!user) throw new BadRequestError("Member not found.");
  return user;
};

module.exports.updateProfile = async (
  { full_name, phone, gender, age },
  { id },
) => {
  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;
  if (gender !== undefined) updates.gender = gender;
  if (age !== undefined) updates.age = age;

  const user = await Users.findOneAndUpdate(
    { userId: id, role: "member" },
    { $set: updates },
    { new: true, runValidators: true },
  ).select("userId full_name email phone gender age role");

  if (!user) throw new BadRequestError("Member not found.");
  return user;
};
module.exports.changePassword = async (
  { oldPassword, newPassword },
  { id },
) => {
  const user = await Users.findOne({ userId: id }).select("+password");
  if (!user) throw new BadRequestError("Member not found.");
  const isMatch = await compare(oldPassword, user.password);
  if (!isMatch) throw new BadRequestError("Current password is incorrect.");
  const hashedPassword = await hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  return { message: "Password changed successfully", success: true };
};
