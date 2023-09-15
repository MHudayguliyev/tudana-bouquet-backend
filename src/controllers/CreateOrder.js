const database = require("../db");
const uuid = require("uuid");
const status = require("../scripts/utils/status");
const SearchForClients = require('../scripts/utils/SearchForClients')
const GetFirmRowId = require("../scripts/utils/GetUserFirmID");
const UpdateValue = require("../scripts/utils/UpdateValue");
const CrtUpdDt = require('../scripts/utils/GetCrtUpdDt')
const { GetCTGA, GetCTGP } = require('../scripts/utils/GetCTG')
const GetClientsQuery = require('../scripts/utils/GetClientsQuery')


//  gozden gechirmeli
const GetGroups = async (req, res) => {
  let { where } = req.query
  let isDropdown = where === 'dropdown'

  try {
    let text = isDropdown ? `
    SELECT g.group_guid as value, g.group_name as label
    FROM tbl_groups g JOIN tbl_mtrl_attr_unit u on g.group_guid = u.group_guid
    --JOIN tbl_material_types t on u.row_id = t.mtrl_type_row_id
    --WHERE t.mtrl_type_row_id = 1
    GROUP BY g.group_guid, g.group_name
    ORDER by g.group_name
    ` : `
    SELECT g.group_guid, g.group_name, COUNT(DISTINCT u.mtrl_guid) as attrs_count
    FROM tbl_groups g JOIN tbl_mtrl_attr_unit u on g.group_guid = u.group_guid
    --JOIN tbl_material_types t on u.row_id = t.mtrl_type_row_id
    --WHERE t.mtrl_type_row_id = 1
    GROUP BY g.group_guid, g.group_name
    ORDER by g.group_name
    `;

    const { rows } = await database.query(text);
    if (rows.length != 0) {
      return res.status(status.success).json(rows);
    }
    return res.status(status.notfound).json("Not found data");
  } catch (error) {
    console.log(error);
    return res.status(status.error).send('Unknown error')
  }
};

const GetCategories = async (req, res) => {
  const { group_guid } = req.query;

  try {
    let text = `
    SELECT DISTINCT m.mtrl_guid, m.mtrl_code, m.mtrl_name, count(*) as count, 0::int as amount_selected
      FROM tbl_materials m JOIN tbl_mtrl_attr_unit u ON m.mtrl_guid = u.mtrl_guid
      JOIN tbl_groups g on u.group_guid = g.group_guid
      WHERE u.group_guid = $1
      GROUP BY m.mtrl_guid, m.mtrl_code, m.mtrl_name, 
      g.group_name, g.group_guid ORDER BY m.mtrl_code
    `;

    const { rows } = await database.query(text, [group_guid]);
    if (rows.length !== 0) {
      return res.status(status.success).json(rows);
    } else {
      return res.status(status.notfound).send("Unknown error occured");
    }
  } catch (error) {
    return res.status(status.error).send(error);
  }
};

const GetallCategories = async (req, res) => {
  try {
    let text = `SELECT DISTINCT
      count(*) as count, m.mtrl_guid, m.mtrl_name,
      g.group_name, g.group_guid, 0::int as amountSelected, i.image_name, mi.is_image_main
      FROM
      tbl_materials m
      JOIN tbl_mtrl_attr_unit u ON m.mtrl_guid = u.mtrl_guid
      LEFT JOIN tbl_groups g on u.group_guid = g.group_guid
      LEFT JOIN tbl_mtrl_images mi on mi.mtrl_attr_unit_row_id = u.row_id
      LEFT JOIN tbl_images i on mi.image_guid = i.image_guid
      GROUP BY m.mtrl_guid, m.mtrl_name, g.group_name, g.group_guid, i.image_name, mi.is_image_main
      order by m.mtrl_name`;

    const { rows } = await database.query(text);
    if (rows.length !== 0) {
      return res.status(status.success).json(rows);
    }
    return res.status(status.notfound).send("Not found data");
  } catch (error) {
    console.log("🚀 ~ file: CreateOrder.js:75 ~ GetallCategories ~ error:", error)
    return res.status(status.error).send('Unknown error');
  }
};

const GetMaterials = async (req, res) => {
  const { mtrl_guid } = req.query;

  try {
    let text = `
      SELECT DISTINCT
      u.row_id,
      u.mtrl_guid,
      M.mtrl_code,
      M.mtrl_name,
      M.mtrl_full_name,
      y.mtrl_type_code,
      M.mtrl_desc,
      u.group_guid,
      COALESCE ( A.attribute_guid, uuid_nil ( ) ) AS attribute_guid,
      COALESCE ( A.attribute_name, M.mtrl_name ) AS attribute_name,
      d.unit_det_name,
      d.unit_det_numerator,
      d.unit_det_dominator,
      COALESCE (p.price_guid, uuid_nil()) AS price_guid,
      COALESCE (p.price_value, 0) AS price_value,
      COALESCE (p.price_type_guid, uuid_nil()) AS price_type_guid,
      COALESCE (t.price_type_name, '--n/a--' ) AS price_type_name,
      COALESCE (s.stock_amount, 0) AS stock_amount,
      '0' AS line_amount,
      '0' AS line_nettotal,
      i.image_name,
      mi.is_image_main
    FROM
      tbl_mtrl_attr_unit u
      JOIN tbl_materials M ON u.mtrl_guid = M.mtrl_guid
      LEFT JOIN tbl_attributes A ON u.attr_guid = A.attribute_guid
      LEFT JOIN tbl_groups G ON u.group_guid = G.group_guid
      LEFT JOIN tbl_prices P ON u.row_id = P.mtrl_attr_unit_row_id
      LEFT JOIN tbl_price_types T ON P.price_type_guid = T.price_type_guid 
      LEFT JOIN tbl_unit_details d ON d.unit_det_guid = u.unit_det_guid
      LEFT JOIN tbl_material_types y ON u.row_id = y.mtrl_type_row_id
      LEFT JOIN tbl_stock_by_wh s ON u.row_id = s.mtrl_attr_unit_row_id
      LEFT JOIN tbl_mtrl_images mi on mi.mtrl_attr_unit_row_id = u.row_id
      LEFT JOIN tbl_images i on mi.image_guid = i.image_guid
    WHERE COALESCE (t.pt_used_in_sale, true) AND u.mtrl_guid = $1
    ORDER BY M.mtrl_name`;

    const { rows } = await database.query(text, [mtrl_guid]);
    if (rows.length !== 0) {
      return res.status(status.success).json(rows);
    }
    return res.status(status.notfound).send("Unknown error occured");
  } catch (error) {
    return res.status(status.error).send(error);
  }
};

const GetAllMaterials = async (req, res) => {
  try {
    let text = `SELECT DISTINCT u.row_id, a.attribute_guid, a.attribute_name,
        u.mtrl_guid, m.mtrl_code, m.mtrl_name, m.mtrl_full_name, y.mtrl_type_code, m.mtrl_desc,
        d.unit_det_name, d.unit_det_numerator, d.unit_det_dominator,
        p.price_guid, p.price_value, '0' as price_total, '0' as amount, t.price_type_guid, t.price_type_name,
        u.group_guid, i.image_name
        FROM
        tbl_attributes a
        JOIN tbl_mtrl_attr_unit u ON u.attr_guid = a.attribute_guid
        LEFT JOIN tbl_materials m on u.mtrl_guid = m.mtrl_guid
        LEFT JOIN tbl_groups g on u.group_guid = g.group_guid
        LEFT JOIN tbl_prices p on u.row_id = p.mtrl_attr_unit_row_id
        LEFT JOIN tbl_price_types t ON p.price_type_guid = t.price_type_guid
        LEFT JOIN tbl_unit_details d ON d.unit_det_guid = u.unit_det_guid
        LEFT JOIN tbl_material_types y on u.row_id = y.mtrl_type_row_id
        LEFT JOIN tbl_mtrl_images mi on mi.mtrl_attr_unit_row_id = u.row_id
        LEFT JOIN tbl_images i on mi.image_guid = i.image_guid
        ORDER BY m.mtrl_name`;

    const { rows } = await database.query(text);
    if (rows.length !== 0) {
      return res.status(status.success).json(rows);
    }
    return res.status(status.notfound).send("Unknown error occured");
  } catch (error) {
    return res.status(status.error).send(error);
  }
};

const GetClients = async (req, res) => {
  try {
    let text = `SELECT 
    json_agg
    (
       jsonb_build_object 
      (
        'partner_guid',
        main.partner_guid,
        'partner_balance',
        main.partner_balance,
        'partner_code',
        partner_code,
        'partner_name',
        partner_name,
        'partner_full_name',
        partner_full_name,
        'partner_telephone',
        contact_telephone,
        'partner_address',
        contact_address,
        'addition_telephones',
        tel.contact_value,
        'addition_addresses',
        adrs.contact_value,
        'crt_upd_dt',
        main.crt_upd_dt
      )
      ORDER BY partner_code DESC
    ) as data
    FROM(
      SELECT
        p.partner_guid, p.partner_code, p.partner_name, p.partner_full_name, p.crt_upd_dt, p.partner_balance,
        MAX ( CASE WHEN ( T.contact_type_id = 2 ) AND ( is_contact_main ) THEN i.contact_value ELSE NULL END ) AS contact_telephone,
        MAX ( CASE WHEN ( T.contact_type_id = 1 ) AND ( is_contact_main ) THEN i.contact_value ELSE NULL END ) AS contact_address
      FROM
        tbl_partners p
        LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid
        LEFT JOIN tbl_contact_types T ON i.contact_type_id = T.contact_type_id 
      GROUP BY
        p.partner_guid, p.partner_code, p.partner_name, p.partner_full_name, p.crt_upd_dt, p.partner_balance
        order by p.partner_name
    ) AS main


    LEFT JOIN
    (
      SELECT
        p.partner_guid,
        STRING_AGG(i.contact_value, '; ') as contact_value
      FROM
        tbl_partners p
        LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid
        LEFT JOIN tbl_contact_types t ON i.contact_type_id = T.contact_type_id 
      WHERE t.contact_type_id = 2 AND NOT i.is_contact_main
      GROUP BY p.partner_guid
    ) tel ON main.partner_guid = tel.partner_guid


    LEFT JOIN
    (
      SELECT
        p.partner_guid,
        STRING_AGG(i.contact_value, '; ') as contact_value
      FROM
        tbl_partners p
        LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid
        LEFT JOIN tbl_contact_types t ON i.contact_type_id = T.contact_type_id 
      WHERE t.contact_type_id = 1 AND NOT i.is_contact_main
      GROUP BY p.partner_guid
    ) adrs ON main.partner_guid = adrs.partner_guid`;

    const { rows } = await database.query(text);

    if (rows.length !== 0) {
      return res.status(status.success).json(rows[0]?.data);
    }
    return res.status(status.notfound).send("Not found data");
  } catch (error) {
    console.log("🚀 ~ file: CreateOrder.js:236 ~ GetClients ~ error:", error)
    return res.status(status.error).send('Unknown error ');
  }
};




const AddNewClient = async (req, res) => {
  const {
    partner_code,
    partner_name,
    partner_full_name,
    partner_telephone,
    partner_address,
    addition_telephones,
    addition_addresses
  } = req.body

  
  const user_guid = req.user.user_guid
  const partner_guid = uuid.v4();
  const firm_guid = await GetFirmRowId(user_guid)
  const crt_upd_dt = CrtUpdDt()
  const phoneFixed = `+993 ${partner_telephone}`
  const addPhoneFixed = `+993 ${addition_telephones}`

  const contact_type_id_for_phone = await GetCTGP();
  const contact_type_id_for_address = await GetCTGA();

  const queryText = `WITH cl_parent AS (
    INSERT INTO tbl_partners(partner_guid, firm_guid, partner_name, partner_code, partner_full_name, pnr_name_for_print, partner_balance, is_data_synchronized, mark_for_deletion,  crt_upd_dt)
    VALUES('${partner_guid}','${firm_guid}','${partner_name}','${partner_code}','${partner_full_name}','${partner_full_name}', '0', 'f', 'f', '${crt_upd_dt}') RETURNING partner_guid
  )
  INSERT INTO tbl_contact_info(parent_guid, contact_type_id, contact_value, is_contact_main, crt_upd_dt) 
  VALUES((select partner_guid from cl_parent), '${contact_type_id_for_phone}','${phoneFixed}','t', '${crt_upd_dt}'), ((select partner_guid from cl_parent), '${contact_type_id_for_address}','${partner_address}','t', '${crt_upd_dt}')
  `

  const additionInfoQuery = `INSERT INTO tbl_contact_info(parent_guid, contact_type_id, contact_value, is_contact_main, crt_upd_dt) VALUES($1,$2,$3,$4,$5)`
  try {
    await database.queryTransaction([{ queryText, params: [] }])
    if (addition_telephones) {
      await database.queryTransaction([{ queryText: additionInfoQuery, params: [partner_guid, contact_type_id_for_phone, addPhoneFixed, false, crt_upd_dt] }])
    }
    if (addition_addresses) {
      await database.queryTransaction([{ queryText: additionInfoQuery, params: [partner_guid, contact_type_id_for_address, addition_addresses, false, crt_upd_dt] }])
    }

    const result = await GetClientsQuery({ partnerGuid: partner_guid })
    
    return res.status(status.created).send({ msg: "New client successfully added", status: status.created, response: result.response });
  } catch (error) {
    console.log('error', error)
    console.log('Unknown error with add new client', error);
  }
};


const GetWhouse = async (req, res) => {
  try {
    let text = `SELECT * FROM tbl_warehouses`;

    const { rows } = await database.query(text);
    if (rows.length !== 0) {
      return res.status(status.success).json(rows);
    }
    return res.status(status.notfound).send("Not found data");
  } catch (error) {
    console.log("🚀 ~ file: CreateOrder.js:305 ~ GetWhouse ~ error:", error)
    return res.status(status.error).send('Unknown error');
  }
};


const ConfirmOrder = async (req, res) => {
  const {
    order_code,
    order_valid_dt,
    mat_unit_amount,
    order_total,
    order_desc,
    partner_guid,
    warehouse_guid,
    order_delivery_dt,
    orders_line,
    status_guid
  } = req.body;

  const order_guid = uuid.v4();
  const order_nettotal = order_total;
  const user_guid = req.user.user_guid
  const is_ord_synchronized = false
  const firm_guid = await GetFirmRowId(user_guid)
  const crt_upd_dt = CrtUpdDt()



  queryText = `WITH line_parent AS(
    INSERT INTO tbl_orders (order_guid, order_code, order_valid_dt, 
      mat_unit_amount, order_total, order_nettotal, status_guid, order_desc, is_ord_synchronized, partner_guid,
      user_guid,warehouse_guid, order_delivery_dt, firm_guid, mark_for_deletion,crt_upd_dt) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING order_guid
  )
  INSERT INTO tbl_orders_line(ord_line_guid, ord_parent_guid, mtrl_attr_unit_row_id, ord_line_amount, ord_line_total, ord_line_nettotal, ord_line_desc,
    ord_line_price, ord_line_price_type_guid, ord_line_disc_percent, ord_line_disc_amount, line_row_id_front, crt_upd_dt)
    VALUES ${orders_line.map(item => `(
      '${uuid.v4()}', (select order_guid from line_parent), ${item['row_id']}, ${item['ord_line_amount']}, ${item['ord_line_price_total']}, ${item['ord_line_price_nettotal']}, '${item['ord_line_desc'] ?? ''}',
      ${item['ord_line_price']}, '${item['price_type_guid']}', ${item['ord_line_disc_percent']}, ${item['ord_line_disc_amount']},  ${item['line_row_id_front']}, '${crt_upd_dt}'
    )`).join(',')
    }
  `;

  params = [order_guid, order_code, order_valid_dt, mat_unit_amount, order_total, order_nettotal, status_guid, order_desc, is_ord_synchronized,
    partner_guid, user_guid, warehouse_guid, order_delivery_dt, firm_guid, 'f', crt_upd_dt]

  quickCheck = `SELECT * FROM tbl_orders WHERE order_code = '${order_code}'`

  try {
    const response = await database.query(quickCheck, [])
    if (response.rows.length !== 0) {
      return res.status(status.conflict).send('Order code should be unique, hint: newify order code!')
    }

    ///////////////////////////////////////  order_transaction
    try {
      await database.queryTransaction([{ queryText, params }])
    } catch (error) {
      console.log('error in transaction ', error)
      return
    }
    //////////////////////////////////////////

    res.status(status.created).send('Successfully added order!')

  } catch (error) {
    console.log("🚀 ~ file: CreateOrder.js:375 ~ ConfirmOrder ~ error:", error)
    return res.status(status.error).send('Unknown error')
  }
};

const GenerateOrderCode = async (req, res) => {
  const { code } = req.query;
  let inc_type_value = "";
  if (!code === "order" || !code === "client") {
    return res.status(status.bad).send("Code value is incorrect");
  }
  switch (code) {
    case "order":
      inc_type_value = "ORD_";
      break;
    case "client":
      inc_type_value = "PNR_";
      break;
    case "assembly-order":
      inc_type_value = "AORD_";
      break;

    default:
      break;
  }
  try {
    const getCodeGenerate = `SELECT inc_type, inc_value FROM "tbl_increments" WHERE inc_type = $1`;
    const { rows } = await database.query(getCodeGenerate, [inc_type_value]);
    const inc_type = rows[0].inc_type;
    const inc_value = rows[0].inc_value;
    let nulls = "000000";
    const value = inc_value + 1;
    switch (value.toString().length) {
      case 2:
        nulls = "00000";
        break;
      case 3:
        nulls = "0000";
        break;
      case 4:
        nulls = "000";
        break;
      case 5:
        nulls = "00";
        break;
      case 6:
        nulls = "0";
        break;
      case 7:
        nulls = "";
        break;
      default:
        break;
    }
    const updateValue = `update tbl_increments set inc_value = $1, crt_upd_dt = $2 WHERE inc_type = $3`;
    const result = inc_type + nulls + value.toString();
    await database.query(updateValue, [value, new Date(), inc_type_value]);
    console.log('result', result)
    return res.status(status.success).send(result);
  } catch (error) {
    console.log("ERROR: ", error);
    return res.status(status.error).send("Unknown error");
  }
};

module.exports = {
  GenerateOrderCode,
  GetGroups,
  GetCategories,
  GetallCategories,
  GetAllMaterials,
  GetMaterials,
  GetClients,
  GetWhouse,
  AddNewClient,
  ConfirmOrder,
};
