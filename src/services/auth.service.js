const { hash, compare } = require("bcryptjs");
const { Users, Member } = require("../migrations");
const { UnauthorizedError, ConflictError } = require("../utils/app.errors");
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
