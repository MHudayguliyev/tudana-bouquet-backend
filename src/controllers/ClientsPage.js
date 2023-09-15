const database = require("../db/index");
const status = require("../scripts/utils/status");
const GetClientForDeletion = require("../scripts/utils/GetClientForDeletion");
const GetClientBalans = require("../scripts/utils/GetClientBalans");
const DataVersion = require("../scripts/utils/GetDataVersion");
const ClientFirmID = require("../scripts/utils/GetClientFirmID");
const CrtUpdDt = require("../scripts/utils/GetCrtUpdDt");
const GetClientsQuery = require('../scripts/utils/GetClientsQuery')
const { GetCTGP, GetCTGA } = require("../scripts/utils/GetCTG");

const GetClients = async (req, res) => {
  let { limit, page, search } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  const limitOffset = ` LIMIT ${limit} OFFSET ${page * limit}` 

  try {
    let result;
    if(search === ''){
      result = await GetClientsQuery({limitOffset: limitOffset, search: search})
    }else {
      result = await GetClientsQuery({search: search})
    }
    return res.status(status.success).send(result);
  } catch (error) {
    console.log(error)
    return res.status(status.error).send('Unknown error occured')
  }
};


const EditClient = async (req, res) => {
  const {
    partner_guid,
    partner_name,
    partner_code,
    partner_full_name,
    partner_address,
    partner_telephone,
    addition_addresses,
    addition_telephones,
  } = req.body;


  const cache_guid = partner_guid;
  const mfd = await GetClientForDeletion(partner_guid);
  const cl_balans = await GetClientBalans(cache_guid);
  const firm_guid = await ClientFirmID(cache_guid);
  const crt_upd_dt = CrtUpdDt();
  const phoneFixed = `+993 ${partner_telephone}`
  const addPhoneFixed = `+993 ${addition_telephones}`

  const contact_type_guid_for_phone = await GetCTGP();
  const contact_type_guid_for_address = await GetCTGA();

  deleteQuery = `WITH dv AS (
    DELETE FROM tbl_partners WHERE partner_guid = $1 RETURNING partner_guid
  )
  DELETE FROM tbl_contact_info WHERE parent_guid IN (SELECT partner_guid FROM dv)`
  
  queryText = `WITH cl_parent AS (
      INSERT INTO tbl_partners(partner_guid, firm_guid, partner_name, partner_code, partner_full_name, pnr_name_for_print, partner_balance, is_data_synchronized, mark_for_deletion, crt_upd_dt)
      VALUES('${cache_guid}','${firm_guid}','${partner_name}','${partner_code}','${partner_full_name}','${partner_full_name}',${cl_balans},'f',${mfd}, '${crt_upd_dt}') RETURNING partner_guid
  )
  INSERT INTO tbl_contact_info(parent_guid, contact_type_id, contact_value, is_contact_main, crt_upd_dt) 
  VALUES((select partner_guid from cl_parent), '${contact_type_guid_for_phone}','${phoneFixed}','t', '${crt_upd_dt}'), ((select partner_guid from cl_parent), '${contact_type_guid_for_address}','${partner_address}','t', '${crt_upd_dt}')
  `;


  additionInfoQuery = `INSERT INTO tbl_contact_info(parent_guid, contact_type_id, contact_value, is_contact_main, crt_upd_dt) VALUES($1,$2,$3,$4,$5)`;
  quickCheck = `SELECT * FROM tbl_partners WHERE partner_guid = '${cache_guid}'`;
  


  try {
    const { rows } = await database.query(quickCheck, []);
    if (!rows.length) {
      console.log("No partner guid found! hint: look at the database!");
      return;
    }

    await database.queryTransaction([
      { queryText: deleteQuery, params: [partner_guid] },
      { queryText, params: [] },
    ]);

    if (addition_telephones) {
      await database.queryTransaction([
        {
          queryText: additionInfoQuery,
          params: [
            cache_guid,
            contact_type_guid_for_phone,
            addPhoneFixed,
            "f",
            crt_upd_dt,
          ],
        },
      ]);
    }
    if (addition_addresses) {
      await database.queryTransaction([
        {
          queryText: additionInfoQuery,
          params: [
            cache_guid,
            contact_type_guid_for_address,
            addition_addresses,
            "f",
            crt_upd_dt,
          ],
        },
      ]);
    }

    const result = await GetClientsQuery({partnerGuid: cache_guid})  /// no need for the second/... argument

    return res.status(status.success).send({msg: "Partner Successfully edited!", response: result.response});
  } catch (error) {
    console.log('Error: ', error)
    return res.status(status.error).send('Unkown error')
  }
};

module.exports = { GetClients, EditClient };
