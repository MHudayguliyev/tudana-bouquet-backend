const database = require('../../db/index')


const GetClientFirmID = async (partner_guid) => {
    let value = -1;
    text = `SELECT firm_guid FROM tbl_partners WHERE partner_guid = $1`;
    try {
      const { rows } = await database.query(text, [partner_guid]);
      if (rows.length !== 0) {
        value = rows[0]["firm_guid"];
      } else {
        console.log("no firm row id found");
      }
    } catch (error) {
      console.log(error);
    }
    return value;
}

module.exports = GetClientFirmID