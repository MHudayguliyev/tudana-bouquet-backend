const jwt = require("jsonwebtoken");
const ENV = require("../../config");
const crypto = require("crypto");

// 4459D75DA2BC346B03B2CA6E72FAF9B0206AACB9 ===> 123
// Admin1001 ===> 33E7235C293E159D30F8FCB0352503267C37D49F

// console.log(
//   "netije: ",
//   crypto.createHash("sha1").update("Admin1001").digest("hex").toUpperCase()
// );

const ComparePassword = async (password, hashedPassword) => {
  const presentPassword = crypto
    .createHash("sha1")
    .update(password)
    .digest("hex")
    .toUpperCase();
  if (presentPassword === hashedPassword) {
    return true;
  } else {
    return false;
  }
};

const GenerateAccessToken = async (data) => {
  return jwt.sign(data, ENV.ACCESS_KEY, { expiresIn: "30d" });
};

const GenerateRefreshToken = async (data) => {
  return jwt.sign(data, ENV.REFRESH_KEY, { expiresIn: "30d" });
};

const VerifyRefreshToken = async (token) => {
  try {
    return jwt.verify(token, ENV.REFRESH_KEY, async (err, decoded) => {
      if (err) {
        return { status: "Unauthorized" };
      }
      const access_token = await GenerateAccessToken({
        user_guid: decoded.user_guid,
      });
      delete decoded.user_password;
      return { status: "Verified", data: { access_token, user: decoded } };
    });
  } catch (error) {
    console.log("ERROR in VerifyRefreshToken: ", error);
    return { status: "Bad" };
  }
};

module.exports = {
  ComparePassword,
  GenerateAccessToken,
  GenerateRefreshToken,
  VerifyRefreshToken,
};
