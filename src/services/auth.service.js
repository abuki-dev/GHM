const { hash, compare } = require("bcryptjs");
const { Users, Member, Trainer, Staff } = require("../migrations");
const {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
} = require("../utils/app.errors");
const { signToken } = require("../utils/token");

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
  const user = await Users.create({
    full_name,
    email,
    password: hashedPassword,
    gender,
    age,
    role: "member",
    phone,
  });
  await Member.create({
    userId: user.userId,
    dateOfBirth,
    weight,
    height,
  });

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
