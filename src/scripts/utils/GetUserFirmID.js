const database = require("../../db/index");

const GetFirmRowId = async (user_guid) => {
  let value = -1;
  text = `select firm_guid from tbl_users where user_guid = $1`;
  try {
    const { rows } = await database.query(text, [user_guid]);
    if (rows.length !== 0) {
      value = rows[0].firm_guid;
    } else console.log("No firm_guid found");
  } catch (error) {
    console.log(error);
  }

  return value;
};

module.exports = GetFirmRowId;
