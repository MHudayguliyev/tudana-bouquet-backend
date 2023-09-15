require("dotenv").config();

const ENV = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  API_PREFIX: process.env.API_PREFIX,
  IMAGE_PATH_PREFIX: process.env.IMAGE_PATH_PREFIX,
  GROUPS_IMAGE_PATH_PREFIX: process.env.GROUPS_IMAGE_PATH_PREFIX,
  ALL_IMAGE_PATH_PREFIX: process.env.ALL_IMAGE_PATH_PREFIX,

  HOSTNAME_LOCAL: process.env.HOSTNAME_LOCAL,
  HOSTNAME_VPS: process.env.HOSTNAME_VPS,

  DB_HOST_LOCAL: process.env.DB_HOST_LOCAL,
  DB_PORT_LOCAL: process.env.DB_PORT_LOCAL,
  DB_PASSWORD_LOCAL: process.env.DB_PASSWORD_LOCAL,
  DB_USER_LOCAL: process.env.DB_USER_LOCAL,
  DB_NAME_LOCAL: process.env.DB_NAME_LOCAL,

  DB_HOST_VPS: process.env.DB_HOST_VPS,
  DB_PORT_VPS: process.env.DB_PORT_VPS,
  DB_PASSWORD_VPS: process.env.DB_PASSWORD_VPS,
  DB_USER_VPS: process.env.DB_USER_VPS,
  DB_NAME_VPS: process.env.DB_NAME_VPS,

  ACCESS_KEY: process.env.ACCESS_KEY,
  REFRESH_KEY: process.env.REFRESH_KEY,

  FRONT_LOCAL_URL: process.env.FRONT_LOCAL_URL,
  FRONT_VPS_URL: process.env.FRONT_VPS_URL,
  
};

module.exports = ENV;
