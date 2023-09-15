const database = require('../../db/index')



const GetClientsQuery = async ({partnerGuid = '', limitOffset = '', search = ''}) => {
    const wherePart = ` WHERE main.partner_guid = '${partnerGuid}'`
    const searchReplace = search.replaceAll(' ', '%')
    const searchPart = ` WHERE LOWER (CONCAT(partner_code, partner_name, partner_full_name, partner_telephone, partner_address, tel.contact_value, adrs.contact_value, tel.contact_value, partner_address, partner_telephone, partner_full_name, partner_name, partner_code)) LIKE LOWER (N'%${searchReplace}%') `;

    const getTotalRowCount = `
    SELECT 
    count(*)::int as totalRowCount
    FROM(
      SELECT
        p.partner_guid, p.partner_code, p.partner_name, p.partner_full_name, p.crt_upd_dt, p.partner_balance,
        MAX ( CASE WHEN ( T.contact_type_id = 2 ) AND ( i.is_contact_main ) THEN substring(i.contact_value, 6, length(i.contact_value)) ELSE NULL END ) AS partner_telephone,
        MAX ( CASE WHEN ( T.contact_type_id = 1 ) AND ( i.is_contact_main ) THEN i.contact_value ELSE NULL END ) AS partner_address
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
        STRING_AGG(substring(i.contact_value, 6, length(i.contact_value)), '; ') as contact_value
      FROM
        tbl_partners p
        LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid
        LEFT JOIN tbl_contact_types t ON i.contact_type_id = T.contact_type_id 
      WHERE t.contact_type_id = 2 AND NOT is_contact_main
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
      WHERE t.contact_type_id = 1 AND NOT is_contact_main
      GROUP BY p.partner_guid
    ) adrs ON main.partner_guid = adrs.partner_guid
    ${partnerGuid === '' ? searchPart : wherePart}`

    queryText = `
    SELECT 
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
        partner_telephone,
        'partner_address',
        partner_address,
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
        MAX ( CASE WHEN ( T.contact_type_id =  2 ) AND ( i.is_contact_main ) THEN substring(i.contact_value, 6, length(i.contact_value)) ELSE NULL END )
        AS partner_telephone,
        MAX ( CASE WHEN ( T.contact_type_id = 1 ) AND ( i.is_contact_main ) THEN i.contact_value ELSE NULL END ) 
        AS partner_address
      FROM
        tbl_partners p
        LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid
        LEFT JOIN tbl_contact_types T ON i.contact_type_id = T.contact_type_id 
      GROUP BY
        p.partner_guid, p.partner_code, p.partner_name, p.partner_full_name, p.crt_upd_dt, p.partner_balance
        order by p.partner_name
        ${limitOffset === '' ? '' : limitOffset}
    ) AS main

    LEFT JOIN
    (
      SELECT
        p.partner_guid,
        STRING_AGG(substring(i.contact_value, 6, length(i.contact_value)), '; ') as contact_value
      FROM
        tbl_partners p
        LEFT JOIN tbl_contact_info i ON p.partner_guid = i.parent_guid
        LEFT JOIN tbl_contact_types t ON i.contact_type_id = T.contact_type_id 
      WHERE t.contact_type_id = 2 AND NOT i.is_contact_main
      GROUP BY p.partner_guid, i.contact_value
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
      WHERE t.contact_type_id = 2 AND NOT i.is_contact_main
      GROUP BY p.partner_guid
    ) adrs ON main.partner_guid = adrs.partner_guid
    ${partnerGuid === '' ? searchPart : wherePart}`

    const rowCount = await database.query(getTotalRowCount, [])
    let totalRowCount = rowCount?.rows[0]?.totalrowcount
    const {rows} = await database.query(queryText, [])
    return {response: rows[0]?.data, totalRowCount}
}


module.exports = GetClientsQuery