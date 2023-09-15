const database = require('../../db/index')


const GetClientsQuery = async (clientGuid = '', search = '') => {
    wherePart = `WHERE main.client_guid = '${clientGuid}'`;
    search = search?.replaceAll(' ', '%')
    const searchPart = ` WHERE LOWER (CONCAT(client_code, client_name, client_full_name, contact_telephone, contact_address, tel.contact_value, adrs.contact_value, tel.contact_value, contact_address, contact_telephone, client_full_name, client_name, client_code)) LIKE LOWER (N'%${search}%') `;
  
    
    const getTotalRowCount = `
    SELECT 
    count(*)::int as totalRowCount
    FROM(
      SELECT
        c.client_guid, c.client_code, c.client_name, c.client_full_name, c.crt_upd_dt, c.client_balans,
        MAX ( CASE WHEN ( T.contact_type_name = 'ТелефонКонтрагента' ) AND ( is_main ) THEN i.contact_value ELSE NULL END ) AS contact_telephone,
        MAX ( CASE WHEN ( T.contact_type_name = 'ФактАдресКонтрагента' ) AND ( is_main ) THEN i.contact_value ELSE NULL END ) AS contact_address
      FROM
        tbl_clients c
        LEFT JOIN tbl_contact_info i ON c.client_guid = i.parent_guid
        LEFT JOIN tbl_contact_type T ON i.contact_type_guid = T.contact_type_guid 
       
      GROUP BY
        c.client_guid, client_code, client_name, client_full_name, c.crt_upd_dt, c.client_balans
        order by client_name
    ) AS main
    LEFT JOIN
    (
      SELECT
        c.client_guid,
        STRING_AGG(i.contact_value, '; ') as contact_value
      FROM
        tbl_clients c
        LEFT JOIN tbl_contact_info i ON c.client_guid = i.parent_guid
        LEFT JOIN tbl_contact_type t ON i.contact_type_guid = T.contact_type_guid 
      WHERE contact_type_name = 'ТелефонКонтрагента' AND NOT is_main
      GROUP BY c.client_guid
    ) tel ON main.client_guid = tel.client_guid
    LEFT JOIN
    (
      SELECT
        c.client_guid,
        STRING_AGG(i.contact_value, '; ') as contact_value
      FROM
        tbl_clients c
        LEFT JOIN tbl_contact_info i ON c.client_guid = i.parent_guid
        LEFT JOIN tbl_contact_type t ON i.contact_type_guid = T.contact_type_guid 
      WHERE contact_type_name = 'ФактАдресКонтрагента' AND NOT is_main
      GROUP BY c.client_guid
    ) adrs ON main.client_guid = adrs.client_guid
    ${clientGuid !== '' ? wherePart : searchPart}
    `

    queryText = `
      SELECT 
      json_agg
      (
         jsonb_build_object 
        (
          'client_guid',
          main.client_guid,
                'client_balans',
                main.client_balans,
          'client_code',
          client_code,
          'client_name',
          client_name,
          'client_full_name',
          client_full_name,
          'client_telephone',
          contact_telephone,
          'client_address',
          contact_address,
          'addition_telephones',
          tel.contact_value,
          'addition_addresses',
          adrs.contact_value,
          'crt_upd_dt',
          main.crt_upd_dt
        )
        ORDER BY client_code asc
      )
      FROM(
        SELECT
          c.client_guid, c.client_code, c.client_name, c.client_full_name, c.crt_upd_dt, c.client_balans,
          MAX ( CASE WHEN ( T.contact_type_name = 'ТелефонКонтрагента' ) AND ( is_main ) THEN i.contact_value ELSE NULL END ) AS contact_telephone,
          MAX ( CASE WHEN ( T.contact_type_name = 'ФактАдресКонтрагента' ) AND ( is_main ) THEN i.contact_value ELSE NULL END ) AS contact_address
        FROM
          tbl_clients c
          LEFT JOIN tbl_contact_info i ON c.client_guid = i.parent_guid
          LEFT JOIN tbl_contact_type T ON i.contact_type_guid = T.contact_type_guid 
        GROUP BY
          c.client_guid, client_code, client_name, client_full_name, c.crt_upd_dt, c.client_balans
          order by client_name
      ) AS main


      LEFT JOIN
      (
        SELECT
          c.client_guid,
          STRING_AGG(i.contact_value, '; ') as contact_value
        FROM
          tbl_clients c
          LEFT JOIN tbl_contact_info i ON c.client_guid = i.parent_guid
          LEFT JOIN tbl_contact_type t ON i.contact_type_guid = T.contact_type_guid 
        WHERE contact_type_name = 'ТелефонКонтрагента' AND NOT is_main
        GROUP BY c.client_guid
      ) tel ON main.client_guid = tel.client_guid


      LEFT JOIN
      (
        SELECT
          c.client_guid,
          STRING_AGG(i.contact_value, '; ') as contact_value
        FROM
          tbl_clients c
          LEFT JOIN tbl_contact_info i ON c.client_guid = i.parent_guid
          LEFT JOIN tbl_contact_type t ON i.contact_type_guid = T.contact_type_guid 
        WHERE contact_type_name = 'ФактАдресКонтрагента' AND NOT is_main
        GROUP BY c.client_guid
      ) adrs ON main.client_guid = adrs.client_guid
    ${clientGuid !== '' ? wherePart : searchPart} 

  `;
  const rowCount = await database.query(getTotalRowCount, [])
  let totalRowCount = rowCount?.rows[0]?.totalrowcount
  const {rows} = await database.query(queryText, [])
  console.log('rows', rows)
  return {response: rows[0]?.json_agg, totalRowCount}
}

module.exports = GetClientsQuery