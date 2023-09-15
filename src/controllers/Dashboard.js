const db = require("../db");
const status = require("../scripts/utils/status");
const GetDateRange = require("../scripts/utils/GetDateRange");


// checked
const GetGeneralStatistics = async (req, res) => {
  try {
    const getDateRange = GetDateRange(1);
    const getTotalSalesAndIncome = `
    SELECT SUM(o.order_nettotal)::float AS total_income, SUM(o.mat_unit_amount)::float AS total_sales 
    FROM tbl_orders o
    LEFT JOIN tbl_statuses s ON s.status_guid = o.status_guid 
    WHERE
        s.is_assembly_ord_sts = false
        AND o.order_valid_dt BETWEEN to_timestamp( '${getDateRange.dateAgo} 00:00:00', 'YYYY-MM-DD  HH24:MI:SS' ) 
        AND to_timestamp( '${getDateRange.today} 23:59:59', 'YYYY-MM-DD  HH24:MI:SS' )`;

        
    const getTotalOrders = `
    SELECT count(1)::int as total_orders  
    FROM tbl_orders o
    LEFT JOIN tbl_statuses s ON s.status_guid = o.status_guid 
    WHERE
        s.is_assembly_ord_sts = false
        AND o.order_valid_dt BETWEEN to_timestamp( '${getDateRange.dateAgo} 00:00:00', 'YYYY-MM-DD  HH24:MI:SS' ) 
        AND to_timestamp( '${getDateRange.today} 23:59:59', 'YYYY-MM-DD  HH24:MI:SS' )`;

    const getClientsUnique = 
    `SELECT COUNT( DISTINCT p.partner_guid ) :: INT as partners_count
    FROM tbl_orders o
    LEFT JOIN tbl_partners p ON p.partner_guid = o.partner_guid 
    WHERE o.order_valid_dt BETWEEN to_timestamp( '${getDateRange.dateAgo} 00:00:00', 'YYYY-MM-DD  HH24:MI:SS' ) AND to_timestamp( '${getDateRange.today} 23:59:59', 'YYYY-MM-DD  HH24:MI:SS' )`

    const responseSI = await db.query(getTotalSalesAndIncome);
    const responseO = await db.query(getTotalOrders);
    const responseClients = await db.query(getClientsUnique)
    const response = Object.assign(responseSI.rows[0], responseO.rows[0], responseClients.rows[0]);
    const keys = Object.keys(response);
    keys.forEach((item) => {
      if (response[item] === null) {
        return (response[item] = 0);
      }
    });

    return res.status(status.success).send(response);
  } catch (error) {
    console.log("ERROR: ", error);
    res.status(status.error).send("Unknown error");
  }
};

// checked
const GetLatestOrders = async (req, res) => {
  try {
    const getLatestOrders = `
      SELECT o.order_code, p.partner_name, o.order_nettotal, o.order_valid_dt, s.status_name, s.status_code 
      FROM tbl_orders o
      left join tbl_partners p on p.partner_guid = o.partner_guid
      left join tbl_statuses s on s.status_guid = o.status_guid
      ORDER BY order_valid_dt DESC LIMIT 5`;

    const { rows } = await db.query(getLatestOrders, []);
    if (!rows) {
      return res.status(status.notfound).send("Not found");
    }

    return res.status(status.success).send(rows);
  } catch (error) {
    res.status(status.error).send("Unknown error");
  }
};

// checked, not sure
const GetTopCustomers = async (req, res) => {
  const newDate = new Date();
  const validDate = `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${newDate.getDate()}`
  const dateSubtraction = (newDate.getDate() - newDate.getDate()) + 1
  var validDateOld;

  if(newDate.getMonth() === 0 && dateSubtraction === 1){  //// note: if works only in january when new year comes 
    validDateOld = `${newDate.getFullYear()}-${newDate.getMonth() + 1}-${dateSubtraction}`
  }else {
    validDateOld = `${newDate.getFullYear()}-${newDate.getMonth()}-${newDate.getDate()}`
  }

  try {
    const getTopCustomers = `
    SELECT DISTINCT partner_name, mat_unit_amount::float, max(order_nettotal) as order_nettotal
    FROM
      ( SELECT p.partner_name as partner_name, SUM ( o.mat_unit_amount ) AS mat_unit_amount, SUM ( o.order_nettotal ) AS order_nettotal FROM tbl_orders o 
        left join tbl_partners p on p.partner_guid  = o.partner_guid
        where o.order_valid_dt between '${validDate} 00:00:00' and '${validDateOld} 23:59:59' 
        GROUP BY p.partner_name
      ) as sub
  GROUP BY partner_name, mat_unit_amount, order_nettotal
  order by order_nettotal desc limit 5
    `;

    const { rows } = await db.query(getTopCustomers, []);
    if (!rows) {
      return res.status(status.notfound).send("Not found");
    }

    return res.status(status.success).send(rows);
  } catch (error) {
    console.log(error)
    return res.status(status.error).send('Unknown error');
  }
};

// checked 
const GetDashboardStatistics = async (req, res) => {
  const {status_id} = req.query

  try {
    let stats = [];
    const newDate = new Date();
    const monthLimit = getDates(newDate.getFullYear(), newDate.getMonth() + 1)
    const statusPart = status_id !== '' ? ` and status_guid = '${status_id}'` : ''

    for (let i = 1; i < monthLimit; i++) {
      const { rows } = await db.query(
        `select count(*)::int from tbl_orders o 
         ${status_id !== '' ? 'left join tbl_statuses st on st.status_guid = o.status_guid' : ''} 
         WHERE order_valid_dt between '${newDate.getFullYear()}-${
          newDate.getMonth() + 1
        }-${i} 00:00:00' and '${newDate.getFullYear()}-${
          newDate.getMonth() + 1
        }-${i} 23:59:59' ${statusPart}`
      );
      stats = [...stats, rows[0].count];
    }
    
    return res.status(status.success).send(stats);
  } catch (error) {
    console.log("ERROR: ", error);
    return res.status(status.error).send("Unknown error");
  }
};


// checked
const GetCalendarData = async (req, res) => {
  const {minDate, maxDate, status_id} = req.query

  const statusPart = status_id !== '' ? ` and status_guid = '${status_id}'` : ''

  const queryText = `
  SELECT 
    CAST(order_valid_dt as date) as dt,
    COUNT(order_guid) as ord_count
  FROM
  tbl_orders o 
  ${status_id !== '' ? 'LEFT JOIN tbl_statuses st on st.status_guid = o.status_guid' : ''}
  WHERE order_valid_dt BETWEEN cast('${minDate}' as date) AND cast('${maxDate}' as date) ${statusPart} and not mark_for_deletion
  GROUP BY CAST(order_valid_dt as date)
	ORDER BY dt`

  try {
      const { rows } = await db.query(queryText, []);
      return res.status(status.success).send(rows)

  } catch (error) {
      return res.status(status.error).send('Unknown error occured')
  }
}


function getDates (year, month){
  return new Date(year, month, 0).getDate()
}




module.exports = {
  GetGeneralStatistics,
  GetLatestOrders,
  GetTopCustomers,
  GetDashboardStatistics,
  GetCalendarData
};
