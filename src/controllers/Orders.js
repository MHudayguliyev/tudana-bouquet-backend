const db = require("../db");
const status = require("../scripts/utils/status");
const ForPostgresIN = require("../scripts/utils/ForPostgresIN");
const moment = require('moment')




const GetAllOrders = async (req, res) => {
  let {
    page,
    limit,
    startDate,
    endDate,
    warehouseGuids,
    userGuids,
    partnerGuids,
    statusGuids,
    calculateValue,
    calculateMin,
    calculateMax,
    search,
    mfd,
  } = req.query;
  const startOfYear = moment().startOf('year').format('YYYY-MM-DD');
  const endOfYear = moment().endOf('year').format('YYYY-MM-DD');
  try {
    calculateMin = calculateMin || 0;
    calculateMax = calculateMax || 99999999999999;
    startDate = startDate || startOfYear;
    endDate = endDate || endOfYear;
    search = search.length ? search?.replaceAll(' ', '%') : search
    let calculateFilter = ``;
    let wherePart = ``;
    const warehouseIN = await ForPostgresIN(warehouseGuids);
    const UserIN = await ForPostgresIN(userGuids);
    const clientIN = await ForPostgresIN(partnerGuids);
    const statusIN = await ForPostgresIN(statusGuids);

    
    
    switch (calculateValue) {
      case "all":
        calculateFilter = ` AND (o.mat_unit_amount BETWEEN ${calculateMin} AND  ${calculateMax}) OR  (o.order_nettotal BETWEEN  ${calculateMin} AND  ${calculateMax}) `;
        break;
      case "mat_unit_amount":
        calculateFilter = ` AND o.mat_unit_amount BETWEEN ${calculateMin} AND  ${calculateMax} `;
        break;
      case "order_nettotal":
        calculateFilter = ` AND o.order_nettotal BETWEEN ${calculateMin} AND  ${calculateMax} `;
        break;
    }
   
    
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = page * limit;
    const dateFilterPart = ` o.order_valid_dt BETWEEN TO_TIMESTAMP('${startDate} 00:00:00', 'YYYY-MM-DD  HH24:MI:SS') AND TO_TIMESTAMP('${endDate} 23:59:59', 'YYYY-MM-DD HH24:MI:SS') `
    const searchPart = `AND LOWER (CONCAT(o.order_code, o.order_desc, w.wh_name, p.partner_code, p.partner_name, p.partner_full_name, p.contact_telephone, 
      p.contact_address, p.contact_telephone, p.partner_full_name, p.partner_name, 
      p.partner_code, w.wh_name, o.order_desc, o.order_code )) LIKE LOWER (N'%${search}%') `
    const partnersPart = ` AND p.partner_guid in (${clientIN.lslice}) `
    const usersPart = ` AND u.user_guid in (${UserIN.lslice}) `
    const warehousesPart = ` AND w.wh_guid in (${warehouseIN.lslice}) `
    const statusesPart = ` AND s.status_guid in (${statusIN.lslice}) `
    const mfdPart = ` AND ${Number(mfd) === 0  ? "not mark_for_deletion" : "mark_for_deletion" } `
    const limitAndOffPart = ` LIMIT ${limit} OFFSET ${offset} `

    wherePart = ` ${dateFilterPart}  ${searchPart}  ${calculateFilter}  ${clientIN.llength === true ? partnersPart : ''}   ${UserIN.llength === true ? usersPart : '' }  ${warehouseIN.llength === true ? warehousesPart : ''}  ${statusIN.llength === true ? statusesPart : ''}  ${Number(mfd) !== 2  ? mfdPart : ''} `;


    
    let getAllRowsCount = `
    WITH vtbl_partners AS (
      SELECT
        p.partner_guid, p.partner_code, p.partner_name, p.partner_full_name,
        MAX ( CASE T.contact_type_code WHEN 'Телефон' THEN i.contact_value ELSE NULL END ) AS contact_telephone,
        MAX ( CASE T.contact_type_code WHEN 'Адрес' THEN i.contact_value ELSE NULL END ) AS contact_address
      FROM
        tbl_partners
        p LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid AND i.is_contact_main
        LEFT JOIN tbl_contact_types T ON i.contact_type_id = T.contact_type_id
      GROUP BY p.partner_guid,  p.partner_code, p.partner_name, p.partner_full_name
    )
    
    SELECT
      count(1)::int as totalRowCount
    FROM
      tbl_orders o
      LEFT JOIN tbl_statuses s ON s.status_guid = o.status_guid and s.is_assembly_ord_sts = false
      LEFT JOIN tbl_users u ON u.user_guid = o.user_guid
      LEFT JOIN tbl_warehouses w ON w.wh_guid = o.warehouse_guid
      LEFT JOIN vtbl_partners AS p ON o.partner_guid = p.partner_guid
    
      WHERE ${wherePart}
    
    `

    const getOrdersAll = `
    WITH vtbl_partners AS (
      SELECT
        p.partner_guid, p.partner_code, p.partner_name, p.partner_full_name,
        MAX ( CASE T.contact_type_code WHEN 'Телефон' THEN i.contact_value ELSE NULL END ) AS contact_telephone,
        MAX ( CASE T.contact_type_code WHEN 'Адрес' THEN i.contact_value ELSE NULL END ) AS contact_address
      FROM
        tbl_partners
        p LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid AND i.is_contact_main
        LEFT JOIN tbl_contact_types T ON i.contact_type_id = T.contact_type_id
      GROUP BY p.partner_guid,  p.partner_code, p.partner_name, p.partner_full_name
    )
 
 
 SELECT 
      o.order_guid, o.order_code, o.order_valid_dt,  o.mat_unit_amount, o.order_total, o.order_nettotal, o.order_desc, o.order_delivery_dt, p.partner_name, p.partner_guid, p.partner_code,
      p.contact_telephone, p.contact_address, s.status_name, s.status_code, s.status_guid, u.user_guid, u.user_name, w.wh_name, false as isSelected
    FROM
      tbl_orders o
      LEFT JOIN tbl_statuses s ON s.status_guid = o.status_guid and s.is_assembly_ord_sts = false
      LEFT JOIN tbl_users u ON u.user_guid = o.user_guid
      LEFT JOIN tbl_warehouses w ON w.wh_guid = o.warehouse_guid
      LEFT JOIN vtbl_partners AS p ON o.partner_guid = p.partner_guid
      
      WHERE ${wherePart}  ${limitAndOffPart}
      
    `
    const result = await db.query(getAllRowsCount);
    const response = await db.query(getOrdersAll);

    
    if (!response.rows.length > 0) {
      return res.status(status.notfound).send([]);
    } 
    const ordersTotalAmount = Number(
      response.rows
        .reduce((acc, item) => {
          return acc + Number(item.mat_unit_amount);
        }, 0)
        .toFixed(2)
    );
    const ordersTotalNettotal = Number(
      response.rows
        .reduce((acc, item) => {
          return acc + Number(item.order_nettotal);
        }, 0)
        .toFixed(2)
    );
  
    const data = {
      totalRowCount: result.rows[0].totalrowcount ?? 0,
      orders: response.rows ?? [],
      ordersCount: response.rows.length ?? 0,
      ordersTotalAmount: ordersTotalAmount ?? 0,
      ordersTotalNettotal: ordersTotalNettotal ?? 0,
    };
    
    // console.log('res', data)
    return res.status(status.success).send(data);

  } catch (error) {
    console.log("Error: ", error);
    res.status(status.error).send("Unknown error");
  }
};

const GetStatusList = async (req, res) => {
  try {
    let getStatusList = `
        SELECT
        json_agg(
            json_build_object(
                'value', status_guid,
                'label', status_name,
                'edit_ord_allowed', edit_ord_allowed,
                'isChecked', false::bool
            )
        ) as status_list
    FROM
        "tbl_statuses" 
    WHERE
        is_assembly_ord_sts = false
`;

    const response = await db.query(getStatusList);
    if (!response.rows[0].status_list.length > 0) {
      return res.status(status.notfound).send("Not found status list");
    } else {
      return res.status(status.success).send(response.rows[0].status_list);
    }
  } catch (error) {
    res.status(status.error).send("Unknown error");
  }
};

const GetClientList = async (req, res) => {
  try {
    let getClientList = `
      SELECT
        main.partner_list
      FROM
      (select json_agg(
          json_build_object(
            'value', pt.partner_guid,
            'label', CONCAT(partner_name, ': ', tel.partner_telephone),
            'partner_code', partner_code,
            'partner_full_name', partner_full_name,
            'isChecked', true::bool
          )
          ) as partner_list
        from tbl_partners pt
        left join (
                SELECT partner_guid, i.contact_value as partner_telephone
                FROM tbl_partners p
                LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid
                LEFT JOIN tbl_contact_types t ON i.contact_type_id = t.contact_type_id
                WHERE t.contact_type_id = 2 AND is_contact_main
              
        ) as tel on pt.partner_guid = tel.partner_guid
      )as main 
  
`;
    const response = await db.query(getClientList);
    if (!response.rows[0].partner_list.length) {
      return res.status(status.notfound).send("Not found client list");
    } else {
      return res.status(status.success).send(response.rows[0].partner_list);
    }
  } catch (error) {
    res.status(status.error).send("Unknown error");
  }
};

const GetUserList = async (req, res) => {
  try {
    let getUserList = `
            select json_agg(
              json_build_object(
                  'value', user_guid,
                  'label', user_name,
                  'isChecked', true::bool
              )
          ) as user_list
          from tbl_users
`;

    const response = await db.query(getUserList);
    if (!response.rows[0].user_list.length > 0) {
      return res.status(status.notfound).send("Not found user list");
    } else {
      return res.status(status.success).send(response.rows[0].user_list);
    }
  } catch (error) {
    res.status(status.error).send("Unknown error");
  }
};

const GetWarehouseList = async (req, res) => {
  try {
    let getWarehouseList = `
        SELECT 
        json_agg(
            json_build_object(
                'value', wh_guid,
                'label', wh_name,
                'isChecked', true::bool
            )
        ) as warehouse_list
    FROM "tbl_warehouses"
`;

    const response = await db.query(getWarehouseList);
    if (!response.rows[0].warehouse_list.length > 0) {
      return res.status(status.notfound).send("Not found warehouse list");
    } else {
      return res.status(status.success).send(response.rows[0].warehouse_list);
    }
  } catch (error) {
    res.status(status.error).send("Unknown error");
  }
};

const GetMaterialByOrder = async (req, res) => {
  const { ord_guid } = req.query;
  if (!ord_guid)
    return res.status(status.bad).send("Error occured with this request");
  try {
    let getMaterialByOrder = `
            SELECT
            l.ord_line_guid, M.mtrl_name, A.attribute_name, l.ord_line_amount, 
            l.ord_line_total, l.ord_line_disc_percent, l.ord_line_nettotal, l.ord_line_desc, l.line_row_id_front
        FROM
            tbl_orders_line l
            JOIN tbl_orders o ON l.ord_parent_guid = o.order_guid
            LEFT JOIN tbl_mtrl_attr_unit u ON l.mtrl_attr_unit_row_id = u.row_id
            LEFT JOIN tbl_materials M ON u.mtrl_guid = M.mtrl_guid
            LEFT JOIN tbl_attributes A ON u.attr_guid = A.attribute_guid 
        WHERE  o.order_guid    = '${ord_guid}' 
`;
    const response = await db.query(getMaterialByOrder);
    if (!response.rows.length > 0) {
      return res.status(status.notfound).send("Not found materials");
    } else {
      return res.status(status.success).send(response.rows);
    }
  } catch (error) {
    res.status(status.error).send("Unknown error");
  }
};

const GetPrintDatas = async (req, res) => {
  const { order_guids, client_guids } = req.query;
  try {
    const orderGuids = await ForPostgresIN(order_guids);
    const partnerGuids = await ForPostgresIN(client_guids);
    let getPrintDatas = `
                          SELECT
                          o.ord_guid, COALESCE ( f.firm_full_name, f.firm_name ) AS firm_full_name,
                          o.ord_code, COALESCE ( C.client_full_name, C.client_name ) AS client_full_name,
                          o.ord_delivery_date, C.client_code, w.warehouse_name, o.ord_desc, C.contact_telephone, C.contact_address,
                          json_agg ( json_build_object ( 'mtr_name', M.mtrl_name, 'ord_line_amount', l.ord_line_amount, 'ord_line_price_value', l.ord_line_price_value, 'ord_line_nettotal', l.ord_line_nettotal ) ) AS products_data 
                      FROM
                          tbl_orders o
                          INNER JOIN tbl_orders_line l ON o.ord_guid = l.ord_parent_guid
                          LEFT JOIN tbl_warehouses w ON w.warehouse_guid = o.ord_warhouse_guid
                          LEFT JOIN tbl_firms f ON f.row_id = o.firm_row_id
                          LEFT JOIN tbl_mtrl_attr_unit u ON l.mtrl_attr_unit_row_id = u.row_id
                          LEFT JOIN tbl_materials M ON u.mtrl_guid = M.mtrl_guid
                          LEFT JOIN tbl_attributes A ON u.attr_guid = A.attribute_guid
                          LEFT JOIN (
                          SELECT 
                              C.client_guid, C.client_code, C.client_name, C.client_full_name,
                              MAX ( CASE T.contact_type_name WHEN 'ТелефонКонтрагента' THEN i.contact_value ELSE NULL END ) AS contact_telephone,
                              MAX ( CASE T.contact_type_name WHEN 'ФактАдресКонтрагента' THEN i.contact_value ELSE NULL END ) AS contact_address 
                          FROM
                              tbl_clients
                              C LEFT JOIN tbl_contact_info i ON C.client_guid = i.parent_guid 
                              AND i.is_main
                              JOIN tbl_contact_types T ON i.contact_type_guid = T.contact_type_guid 
                          WHERE
                              C.client_guid IN (${
                                partnerGuids.llength
                                  ? partnerGuids.lslice
                                  : "3f53ed2d-41f6-11ec-837b-480fcf4eb3ef"
                              }) 
                          GROUP BY
                              C.client_guid,  C.client_code, C.client_name, C.client_full_name 
                          ) AS C ON o.ord_client_guid = C.client_guid 
                      WHERE
                          o.ord_guid IN (${
                            orderGuids.llength
                              ? orderGuids.lslice
                              : "d91a4ffb-4a1e-4da8-b87b-a5decb46d180"
                          }) 
                      GROUP BY
                          f.firm_name, o.ord_guid, o.ord_desc, f.firm_full_name, C.client_full_name, C.client_name, C.client_code, w.warehouse_name, C.contact_telephone,C.contact_address
`;
    const response = await db.query(getPrintDatas);
    if (!response.rows.length > 0) {
      return res.status(status.notfound).send("Not found print datas");
    } else {
      return res.status(status.success).send(response.rows);
    }
  } catch (error) {
    res.status(status.error).send("Unknown error");
  }
};

module.exports = {
  GetAllOrders,
  GetStatusList,
  GetClientList,
  GetUserList,
  GetWarehouseList,
  GetMaterialByOrder,
  GetPrintDatas,
};
