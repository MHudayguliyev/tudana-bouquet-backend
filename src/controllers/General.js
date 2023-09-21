const database = require("../db");
const status = require("../scripts/utils/status");
const GetFirmRowId = require("../scripts/utils/GetUserFirmID");
const uuid = require("uuid");
const GetMarkForDeletion = require("../scripts/utils/GetForMarkDeletion");
const CheckTblNames = require("../scripts/utils/CheckTblNames");
const CrtUpdDt = require('../scripts/utils/GetCrtUpdDt')
const SetTimeZone = require('../scripts/utils/SetTimeZone')
const sharp = require('sharp')
const getImageName = require('../scripts/utils/GetImageName')
const ENV = require('../config')
const { getImageNameFromPath, deleteFile } = require('../scripts/utils/GeneralUtilFunctions')
const { globSync } = require('glob')
const fs = require('fs')
const imageUploader = require('../scripts/utils/ImageUploader');
const multer = require("multer");
const guid = require('uuid').v4()



const GetFirms = async (req, res) => {
  try {
    const getFirms = ` SELECT firm_guid, firm_name, firm_full_name FROM "tbl_firms" order by firm_name  `;
    const { rows } = await database.query(getFirms, []);
    if (!rows.length > 0)
      return res.status(status.notfound).send("Not found firms");
    else res.status(status.success).send(rows);
  } catch (error) {
    console.log("🚀 ~ file: General.js:18 ~ GetFirms ~ error:", error)
    return res.status(status.error).send("Unknown error");
  }
};

const GetOrdersDataForEdit = async (req, res) => {
  const { order_guid } = req.query;
  try {
    if (!order_guid) {
      return res.status(status.bad).send("Missing order guid!");
    }
    const getOrderDataForEdit = `
            SELECT
            o.order_guid,
            o.order_code,
            o.order_valid_dt,
            o.order_delivery_dt,
            o.mat_unit_amount::float,
            o.order_nettotal::FLOAT,
            o.order_desc,
            w.wh_guid,
            w.wh_name,
            p.partner_guid,
            p.partner_name,
            o.user_guid,
            s.status_guid,
            s.status_name
          FROM
            tbl_orders o 
            LEFT JOIN tbl_warehouses w on w.wh_guid = o.warehouse_guid
            LEFT JOIN tbl_partners p on p.partner_guid = o.partner_guid
            LEFT JOIN tbl_statuses s on s.status_guid = o.status_guid
          WHERE
            o.order_guid = $1
        `;

    let getMaterialList = `
          SELECT distinct
          mau.row_id,
          l.line_row_id_front,
          COALESCE ( A.attribute_guid, uuid_nil ( ) ) AS attribute_guid,
          COALESCE ( A.attribute_name, M.mtrl_name ) AS attribute_name,
          m.mtrl_guid,
          m.mtrl_code,
          m.mtrl_name,
          m.mtrl_full_name,
          l.ord_line_desc as mtrl_desc,
          mt.mtrl_type_code,
          ud.unit_det_name,
          ud.unit_det_numerator,
          ud.unit_det_dominator,
          l.ord_line_price_type_guid as price_type_guid,
          l.ord_line_price::float as price_value,
          g.group_guid,
          i.image_name,
          l.ord_line_guid,
          l.ord_line_amount::FLOAT as amount,
          l.ord_line_nettotal::FLOAT as price_total
          
        FROM
          tbl_orders_line l 
          LEFT JOIN tbl_mtrl_attr_unit mau on mau.row_id = l.mtrl_attr_unit_row_id
          LEFT JOIN tbl_attributes a on a.attribute_guid = mau.attr_guid
          LEFT JOIN tbl_materials m on m.mtrl_guid = mau.mtrl_guid
          LEFT JOIN tbl_material_types mt on mt.mtrl_type_row_id = mau.row_id
          LEFT JOIN tbl_unit_details ud on ud.unit_det_guid = mau.unit_det_guid
          LEFT JOIN tbl_prices p on p.mtrl_attr_unit_row_id = mau.row_id
          LEFT JOIN tbl_groups g on g.group_guid = mau.group_guid
          LEFT JOIN tbl_images i on i.parent_guid = mau.mtrl_guid   
        WHERE
          l.ord_parent_guid = $1
    `;

    const { rows } = await database.query(getOrderDataForEdit, [order_guid]);
    const response = await database.query(getMaterialList, [order_guid]);

    const data = { ...rows[0], order_products: response.rows };
    return res.status(status.success).send(data);
  } catch (error) {
    console.log("ERROR: ", error);
    return res.status(status.error).send("Unknown error");
  }
};

const EditOrder = async (req, res) => {
  const { order_guid, order_code, order_valid_dt, mat_unit_amount, order_total, order_desc, partner_guid, warehouse_guid, order_delivery_dt, status_guid, orders_line } = req.body;


  const cached_order_guid = order_guid  ///// note: we cache it, beacause we will use it to insert on update
  const ord_nettotal = order_total;
  const user_guid = req.user.user_guid
  const is_ord_synchronized = false
  const mark_for_deletion = await GetMarkForDeletion(cached_order_guid)
  const firm_guid = await GetFirmRowId(user_guid)
  const crt_upd_dt = CrtUpdDt()

  console.log(req.body)
  // return
  deleteQuery = `DELETE FROM tbl_orders WHERE order_guid = $1`
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

  params = [cached_order_guid, order_code, order_valid_dt, mat_unit_amount, order_total, ord_nettotal, status_guid, order_desc, is_ord_synchronized,
    partner_guid, user_guid, warehouse_guid, order_delivery_dt, firm_guid, mark_for_deletion, crt_upd_dt]

  quickCheck = `SELECT * FROM tbl_orders WHERE order_guid = $1`


  try {
    const response = await database.query(quickCheck, [order_guid])
    if (response.rows.length === 0) {
      return res.status(status.notfound).send('Order guid for deletion not found, hint: probably deleted beforehand!')
    }

    /// transaction begin
    try {
      await database.queryTransaction([{ queryText: deleteQuery, params: [order_guid] }, { queryText, params }])
    } catch (error) {
      console.log("Transaction error ", error)
      return
    }


    return res.status(status.success).send('Successfully edited order!')
  } catch (error) {
    console.log("error occured", error)
  }
}

const GetSyncData = async (req, res) => {
  const { type, table, maxDate } = req.query;
  let hasTableName = CheckTblNames(table);
  let getData = ``;

  try {
    if (
      !type === "max" ||
      !type === "data" ||
      !type ||
      !table ||
      !hasTableName
    ) {
      return res.status(status.bad).send("Bad request");
    } else {
      if (type === "max") {
        getData = `select COALESCE(max(crt_upd_dt), '2000-01-01 00:00:00') as max_crt_upd_dt from ${table}`;
      } else if (type === "data") {
        getData = `select * from ${table}  WHERE crt_upd_dt >= TO_TIMESTAMP('${maxDate || '2000-01-01 00:00:00'}' , 'YYYY-MM-DD HH24:MI:SS')`;
      }

      const { rows } = await database.query(getData, [])
      if (!rows.length) {
        return res.status(status.notfound).send('Not found')
      }

      let result = []

      if (type === 'max') {
        const d = rows[0].max_crt_upd_dt
        const date = SetTimeZone(d, 'increment')
        result = [...result, { max_crt_upd_dt: date }]
      } else {
        for (let row of rows) {
          if (row.crt_upd_dt) {
            const d = row.crt_upd_dt
            row.crt_upd_dt = SetTimeZone(d, 'increment')
          }
        }
        result = rows
      }
      return res.status(status.success).send(result);
    }
  } catch (error) {
    return res.status(status.error).send("Unknown error"), error;
  }
};


const GetAllMaterials = async (req, res) => {
  let { start, size, filters, globalFilter, sorting } = req.query
  sorting = JSON.parse(sorting)[0]
  filters = JSON.parse(filters)



  let sort_column = sorting !== undefined ? sorting?.id : 'mtrl_name'
  let sort_order = sorting !== undefined ? sorting?.desc ? 'DESC' : 'ASC' : 'ASC'
  const search = globalFilter.length > 0 ? globalFilter?.replaceAll(' ', '%') : globalFilter
  const results = filters?.map((item) => {
    const lowerLike = ` lower(${item.id}) like lower(N'%${item.value?.replaceAll(' ', '%')}%')`;
    return lowerLike;
  });

  const finalResult = results.join(' and ');

  const searchPart = `
    AND LOWER (CONCAT(u.row_id, u.mtrl_guid,  u.group_guid,  u.group_guid, u.attr_guid, u.attr_guid,  m.mtrl_code, m.mtrl_name, d.unit_det_code, g.group_name, a.attribute_name, p.price_type_guid, price_value, p.price_type_guid, a.attribute_name, g.group_name, d.unit_det_code, m.mtrl_name,  m.mtrl_code, u.mtrl_guid, u.row_id )) LIKE LOWER (N'%${search}%')
    `
  const limitAndOffsetPart = ` limit ${size} offset ${start}`
  const wherePart = ` where not m.mark_for_deletion  ${searchPart}
  ${filters?.length > 0 ? ' and ' + finalResult : ''}
  -- and t.pt_used_in_sale `
  const get_total_row_count_query = `
        select count(*)::int as total_row_count
        from tbl_mtrl_attr_unit u
        join tbl_materials m on u.mtrl_guid = m.mtrl_guid
        join tbl_unit_details d on d.unit_det_guid = u.unit_det_guid
        left join tbl_attributes a on u.attr_guid = a.attribute_guid
        left join tbl_groups g on u.group_guid = g.group_guid
        left join tbl_prices p on u.row_id = P.mtrl_attr_unit_row_id
        left join tbl_price_types t on p.price_type_guid = t.price_type_guid
       ${wherePart}
  `

  const get_query = `
        select row_number() over (order by u.row_id)::int as row_num,
        u.row_id as mtrl_attr_unit_row_id,
        u.mtrl_guid,
        u.group_guid,
        u.attr_guid,
        m.mtrl_code,
        m.mtrl_name,
        m.mtrl_desc,
        d.unit_det_code,
        g.group_name,
        a.attribute_name,
        coalesce(p.price_type_guid, uuid_nil()) as price_type_guid,
        coalesce(p.price_value, 0)::float as price_value
      from tbl_mtrl_attr_unit u
      join tbl_materials m on u.mtrl_guid = m.mtrl_guid
      join tbl_unit_details d on d.unit_det_guid = u.unit_det_guid
      left join tbl_attributes a on u.attr_guid = a.attribute_guid
      left join tbl_groups g on u.group_guid = g.group_guid
      left join tbl_prices p on u.row_id = P.mtrl_attr_unit_row_id
      left join tbl_price_types t on p.price_type_guid = t.price_type_guid
      ${wherePart}
      order by ${sort_column}  ${sort_order}
      ${limitAndOffsetPart}
     
    `


  try {
    const total_row_count_res = await database.query(get_total_row_count_query, [])
    const all_materials = await database.query(get_query, [])
    if (all_materials?.rowCount === 0 || total_row_count_res?.rowCount === 0) {
      return res.status(status.notfound).send('Not found data')
    }
    const data_for_send = {
      total_row_count: total_row_count_res.rows[0]?.total_row_count,
      data: all_materials?.rows
    }
    return res.status(status.success).send(data_for_send)

  } catch (e) {
    console.log(e)
    return res.status(status.error).send('Unknown error')
  }
}


const EditMaterial = async (req, res) => {
  const {
    mtrl_attr_unit_row_id,
    mtrl_guid,
    mtrl_code,
    mtrl_name,
    mtrl_desc,
    changed_group_name,
    changed_attr_name,
    purchase_price,
    sales_price,
    purchase_price_types,
    sales_price_types
  } = req.body

  const get_price_types_query = `
    select p.price_type_guid,  pt.price_type_name,  pt.pt_used_in_sale from tbl_prices p
    left join tbl_price_types pt on pt.price_type_guid = p.price_type_guid
    where mtrl_attr_unit_row_id = $1
  `
  const price_types = (await database.query(get_price_types_query, [mtrl_attr_unit_row_id])).rows
  const purchase_price_type = price_types.find(item => !item.pt_used_in_sale).price_type_guid
  const sales_price_type = price_types.find(item => item.pt_used_in_sale).price_type_guid
  if (price_types.length > 0) {
    const mtrl_update_query = `
    update tbl_materials set mtrl_code = $1, mtrl_name = $2, mtrl_desc = $3 where mtrl_guid = $4
    `

    const price_value_update_query = `
        update tbl_prices  set price_value = case 
      when price_type_guid = '${purchase_price_type}' then ${purchase_price} 
      when price_type_guid = '${sales_price_type}' then ${sales_price}
      end,
      price_type_guid = case 
      when price_type_guid = '${purchase_price_type}' then uuid('${purchase_price_types.value}')
      when price_type_guid = '${sales_price_type}' then uuid('${sales_price_types.value}')
      end
      where mtrl_attr_unit_row_id = ${mtrl_attr_unit_row_id} and  price_type_guid in ('${purchase_price_type}', '${sales_price_type}')
      returning price_guid
    `
    const mtrl_attr_unit_update_query = `
    update tbl_mtrl_attr_unit  set attr_guid = $1,  group_guid = $2 where row_id = $3
    `

    try {
      const result = await database.queryTransaction([
        {
          queryText: mtrl_update_query,
          params: [mtrl_code, mtrl_name, mtrl_desc, mtrl_guid]
        },
        {
          queryText: price_value_update_query,
          params: []
        },
        {
          queryText: mtrl_attr_unit_update_query,
          params: [changed_attr_name.value, changed_group_name.value, mtrl_attr_unit_row_id]
        }
      ])
      return res.status(status.success).json({
        status: 'success',
        message: 'Successfully updated material!'
      })
    } catch (e) {
      console.log("🚀 ~ file: General.js:366 ~ EditMaterial ~ e:", e)
      return res.status(status.error).json({
        status: 'error',
        message: 'Unknown error'
      })
    }
  }

}


const UploadMaterialImages = async (req, res) => {
  let { mtrl_attr_unit_row_id, main_image_name, server_image_names, assigned_image_names } = req.query
  server_image_names = JSON.parse(server_image_names)
  assigned_image_names = JSON.parse(assigned_image_names)
  try {
    const uploader = imageUploader('productImages', 5)
    uploader(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.log(`Multer err: `, err)
      } else {
        console.log(`Err: `, err)
      }
      const images = req.files
      const compressedImages = globSync(['src/images/compressed/*.{png,jpg,jpeg,webp}'])

      const update_is_image_main_query = `
        WITH updated_to_true AS (
          update tbl_mtrl_images  set is_image_main = TRUE 
          where image_guid in (
            Select mi.image_guid FROM tbl_images i
            LEFT JOIN tbl_mtrl_images mi on i.image_guid = mi.image_guid 
            WHERE mi.mtrl_attr_unit_row_id = $1 and i.image_name = $2
          )
            RETURNING mtrl_attr_unit_row_id as row_id
          )
          update tbl_mtrl_images  set is_image_main = false 
          where image_guid  in (
            Select mi.image_guid FROM tbl_images i
            LEFT JOIN tbl_mtrl_images mi on i.image_guid = mi.image_guid 
            WHERE mi.mtrl_attr_unit_row_id = (select row_id from updated_to_true) and not i.image_name = $3
          )
        `
      if (server_image_names.length > 0) {
        const get_image_guids_query = `
        select image_guid, image_name from tbl_images where image_name in (${server_image_names.map(item => `'${item}'`)})
        `
        let server_images_res = (await database.query(get_image_guids_query, [])).rows
        
        const assign_images_to_material_query = `
        insert into tbl_mtrl_images (image_guid, mtrl_attr_unit_row_id, is_image_main) values ${server_images_res.map(img => `(
          '${img.image_guid}',  ${mtrl_attr_unit_row_id}, ${img.image_name === main_image_name ? true : false}
        )`)}
        on conflict (image_guid) 
        do update set image_guid = excluded.image_guid returning  mtrl_attr_unit_row_id as id, row_id      
        `


        const assigned_images = await database.query(assign_images_to_material_query, [])
        await database.query(update_is_image_main_query, [mtrl_attr_unit_row_id, main_image_name, main_image_name])
        if (assigned_image_names.length > 0) {
          const joined = assigned_image_names.concat(server_image_names)
          const delete_asssigned_images_query = `
            delete from tbl_mtrl_images using tbl_images  where 
            tbl_mtrl_images.image_guid =  tbl_images.image_guid and tbl_mtrl_images.mtrl_attr_unit_row_id = ${mtrl_attr_unit_row_id} and 
            tbl_images.image_name not in (${joined.map(aimg => `'${aimg}'`)
            }) returning row_id
        `
          const deleted_images = await database.query(delete_asssigned_images_query, [])
        }

        if (images.length === 0) {
          return res.status(status.success).send('Success')
        }
      }
      if (images.length === 0 && server_image_names.length === 0 && assigned_image_names.length > 0) {
        const delete_asssigned_images_query = `
          delete from tbl_mtrl_images using tbl_images  where 
          tbl_mtrl_images.image_guid =  tbl_images.image_guid and tbl_mtrl_images.mtrl_attr_unit_row_id = ${mtrl_attr_unit_row_id} and 
          tbl_images.image_name not in (${assigned_image_names.map(aimg => `'${aimg}'`)
          })
        `

        await database.query(delete_asssigned_images_query, [])
        await database.query(update_is_image_main_query, [mtrl_attr_unit_row_id, main_image_name, main_image_name])
        return res.status(status.success).send('Success')
      } else if (images.length === 0 && server_image_names.length === 0) {
        const delete_all_asssigned_images_query = `
        delete from tbl_mtrl_images where mtrl_attr_unit_row_id = ${mtrl_attr_unit_row_id}
      `
        await database.query(delete_all_asssigned_images_query, [])
        return res.status(status.success).send('Success')
      }



      if (images.length > 0) {
        if (compressedImages.length > 0) {
          for (const image of images) {
            for (const compressedImage of compressedImages) {
              const compressName = getImageNameFromPath(compressedImage)
              if (image.filename === compressName) {
                fs.unlink(`${process.cwd()}\\${compressedImage}`, (err) => {
                  if (err) {
                    console.log(err)
                  }
                  console.log('Successfully deleted: ', compressName)
                })
              }
            }
          }
        }

        for await (const image of images) {
          sharp(image.path).toFile(process.cwd() + `${ENV.IMAGE_PATH_PREFIX}/${getImageName(image.filename)}.webp`)
        }
        for await (const image of images) {
          sharp(image.path).toFile(process.cwd() + `${ENV.GROUPS_IMAGE_PATH_PREFIX}/${getImageName(image.filename)}.webp`)
        }

        const queryText = `
             insert into tbl_images (image_name, image_size) values ${images.map(item => `(
               '${getImageName(item.filename)}.webp', ${item.size}
             )`)}
             on conflict (image_name) 
             do update set image_name = excluded.image_name returning image_guid, image_name
         `
        const response = await database.queryTransaction([{ queryText, params: [] }])
        for (const respon of response) {
          for (const img of images) {
            if (getImageName(img.filename) === getImageName(respon.image_name)) {
              img.image_guid = respon.image_guid
            }
          }
        }
        const assign_images_to_material_query = `
        insert into tbl_mtrl_images (image_guid, mtrl_attr_unit_row_id, is_image_main) values ${images.map(img => `(
            '${img.image_guid}',  ${mtrl_attr_unit_row_id}, ${img.filename === main_image_name ? true : false}
          )`)
          }
        on conflict (image_guid) 
        do update set image_guid = excluded.image_guid returning row_id
      `
        let row_ids_res = await database.queryTransaction([{ queryText: assign_images_to_material_query, params: [] }])
        row_ids_res = row_ids_res.map((id => id.row_id))


        if (assigned_image_names.length > 0 || images.length > 0) {
          const image_names = images.map(img => `${getImageName(img.filename)}.webp`)
          const joined = assigned_image_names.concat(image_names)

          const delete_asssigned_images_query = `
            delete from tbl_mtrl_images using tbl_images  where 
            tbl_mtrl_images.image_guid =  tbl_images.image_guid and tbl_mtrl_images.mtrl_attr_unit_row_id = ${mtrl_attr_unit_row_id} and 
            tbl_images.image_name not in (${joined.map(aimg => `'${aimg}'`)
            })
        `
          await database.query(delete_asssigned_images_query, [])
        }
        await database.queryTransaction([{ queryText: update_is_image_main_query, params: [mtrl_attr_unit_row_id, main_image_name, main_image_name] }])
        return res.status(status.success).send('Success')
      }

    })
  } catch (error) {
    console.log('Image upload catch error: ', error)
    return res.status(status.error).json({
      status: 'error',
      message: 'Unknown error'
    })
  }

}


const GetImagesByMaterial = async (req, res) => {
  const { mtrl_attr_unit_row_id } = req.query
  const query = `
    select mi.row_id, mi.image_guid, mi.mtrl_attr_unit_row_id, i.image_name, mi.is_image_main from tbl_mtrl_images mi
    left join tbl_images i on i.image_guid = mi.image_guid
    where mi.is_image_active and mi.mtrl_attr_unit_row_id = $1
  `
  try {
    const { rows } = await database.query(query, [mtrl_attr_unit_row_id])
    if (rows.length === 0) {
      return res.status(status.success).json({
        status: 'notfound',
        data: rows,
        imagesPath: ENV.IMAGE_PATH_PREFIX
      })
    } else {
      return res.status(status.success).json({
        status: 'success',
        data: rows,
        imagesPath: ENV.IMAGE_PATH_PREFIX
      })
    }
  } catch (e) {
    console.log("🚀 ~ file: General.js:378 ~ GetImagesByMaterial ~ e:", e)
    return res.status(status.error).json({
      status: 'error',
      message: 'Unknown error'
    })
  }
}

const GetAllAttributes = async (req, res) => {
  const query = `
  SELECT attribute_guid as value, attribute_name as label FROM "tbl_attributes"
  `
  try {
    const { rows } = await database.query(query, [])
    if (rows.length === 0) {
      return res.status(status.notfound).send('Not found')
    } else {
      return res.status(status.success).send(rows)
    }
  } catch (e) {
    console.log("🚀 ~ file: General.js:434 ~ GetAllAttributes ~ e:", e)
    return res.status(status.error).send('Unknown error')
  }
}


const GetAllImages = async (req, res) => {
  const {is_materials} =req.query
  const query = `
  select image_guid, image_name from tbl_images
  `
  try {
    const { rows } = await database.query(query, [])
    return res.status(status.success).send({
      status: status.success,
      data: rows,
      imagesPath: is_materials === undefined ? ENV.GROUPS_IMAGE_PATH_PREFIX : ENV.IMAGE_PATH_PREFIX
    })
  } catch (e) {
    console.log("🚀 ~ file: General.js:452 ~ GetAllImages ~ e:", e)
    return res.status(status.error).send('Unknown error')
  }
}



const GetAllImagesMaterials = async (req, res) => {
  const query = `
  select image_guid, image_name from tbl_images
  `
  try {
    const { rows } = await database.query(query, [])
    return res.status(status.success).send({
      status: status.success,
      data: rows,
      imagesPath: ENV.IMAGE_PATH_PREFIX
    })
  } catch (e) {
    console.log("🚀 ~ file: General.js:452 ~ GetAllImages ~ e:", e)
    return res.status(status.error).send('Unknown error')
  }
}



const GetPriceTypes = async (req, res) => {
  try {
    const query = `
      select   price_type_guid, price_type_name, pt_used_in_sale from tbl_price_types  where pt_is_active
    `
    let price_types = (await database.query(query, [])).rows

    return res.status(status.success).send({
      purchase_price_types: price_types.filter(item => !item.pt_used_in_sale).map(item => {
        return {
          value: item.price_type_guid,
          label: item.price_type_name
        }
      }),
      sales_price_types: price_types.filter(item => item.pt_used_in_sale).map(item => {
        return {
          value: item.price_type_guid,
          label: item.price_type_name
        }
      })
    })

  } catch (err) {
    console.log(err)
    return res.status(status.error).send('Unknown error')
  }
}


const GetMaterialEditData = async (req, res) => {
  const { mtrl_attr_unit_row_id, price_type_guid } = req.query
  try {
    const query = `
        select row_number() over (order by u.row_id)::int as row_num,
        u.row_id as mtrl_attr_unit_row_id,
        u.mtrl_guid,
        u.group_guid,
        u.attr_guid,
        m.mtrl_code,
        m.mtrl_name,
        m.mtrl_desc,
        d.unit_det_code,
        g.group_name,
        a.attribute_name,
        coalesce(p.price_type_guid, uuid_nil()) as price_type_guid,
        coalesce(p.price_value, 0)::float as price_value
      from tbl_mtrl_attr_unit u
      join tbl_materials m on u.mtrl_guid = m.mtrl_guid
      join tbl_unit_details d on d.unit_det_guid = u.unit_det_guid
      left join tbl_attributes a on u.attr_guid = a.attribute_guid
      left join tbl_groups g on u.group_guid = g.group_guid
      left join tbl_prices p on u.row_id = P.mtrl_attr_unit_row_id
      left join tbl_price_types t on p.price_type_guid = t.price_type_guid
      where  u.row_id  = $1 and p.price_type_guid = $2
    `
    let material_edit_data_res = (await database.query(query, [mtrl_attr_unit_row_id, price_type_guid])).rows
    return res.status(status.success).send(material_edit_data_res[0])
  } catch (err) {
    console.log(err)
    return res.status(status.error).send('Unknown error')
  }
}

const GetPriceValuesByPT = async (req, res) => {
  const { mtrl_attr_unit_row_id } = req.query
  try {
    const query = `
    select  p.price_type_guid, p.price_value::float, pt.price_type_name,   pt.pt_used_in_sale from tbl_prices p
    left join tbl_price_types pt on pt.price_type_guid = p.price_type_guid
    where p.mtrl_attr_unit_row_id = $1
    `
    let price_values_res = (await database.query(query, [mtrl_attr_unit_row_id])).rows
    return res.status(status.success).send(price_values_res)
  } catch (err) {
    console.log(err)
    return res.status(status.error).send('Unknown error')
  }
}

const GetGroupsWithImages = async (req, res) => {
  try {
    const query = `
    select g.group_guid, g.group_name, i.image_name from tbl_groups g
left join tbl_groups_images gi on gi.parent_guid = g.group_guid 
left join tbl_images i on i.image_guid = gi.image_guid
order by i.image_name asc
    `
    let groups_with_images_res = (await database.query(query, [])).rows
    const sendData = {
      images_path: ENV.GROUPS_IMAGE_PATH_PREFIX,
      data: groups_with_images_res
    }
    return res.status(status.success).send(sendData)
  } catch (err) {
    console.log(err)
    return res.status(status.error).send('Unknown error')
  }
}

const UploadGroupsImage = async (req, res) => {
  const { group_guid, is_server_image } = req.query
  if (!group_guid) {
    return res.status(status.bad).send('Missing group guid')
  }
  
  const uploader = imageUploader('groupImage', 1)
  uploader(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.log(`Multer err: `, err)
    } else {
      console.log(`Err: `, err)
    }
    try {
      const images = req.files
      if (is_server_image === true) {
        console.log('S E R V E R        I M A G E >>>>>>>>>>>>>>>>>>>>>>>')
        // Server image here...
        const get_server_image_query = `select image_guid from tbl_images where image_name = $1`
        const server_image_res = await database.query(get_server_image_query, [images[0].filename])
        const img_guid = server_image_res.rows[0].image_guid
        const assign_groups_images_query = `
        insert into tbl_groups_images (image_guid, parent_guid, is_image_main) values (
          '${img_guid}', '${group_guid}', ${true}
        )
        on conflict (parent_guid) 
        do update set image_guid = excluded.image_guid returning  row_id  
        `
        const assign_group_images_res = await database.query(assign_groups_images_query, [])
        if (assign_group_images_res.rows[0].row_id) {
          return res.status(status.success).send('SUCCESS')
        }


      } else {
        // New uploaded image here...
        console.log('N E W      I M A G E  <<<<<<<<<<<<<<<<<<<<<<<<< ')

        const groupsImages = globSync(['src/images/groups/*.{png,jpg,jpeg,webp}'])
        for await (const imgName of groupsImages) {
          if (getImageNameFromPath(imgName) === images[0].filename) {
            await deleteFile(`${process.cwd()}\\src\\images\\groups`, images[0].filename)
          }
        }
        const info = await sharp(images[0].path).resize(640, 880).toFile(process.cwd() + `${ENV.GROUPS_IMAGE_PATH_PREFIX}/${getImageName(images[0].filename)}.webp`)
        const infoAllImages = await sharp(images[0].path).resize(640, 880).toFile(process.cwd() + `${ENV.IMAGE_PATH_PREFIX}/${getImageName(images[0].filename)}.webp`)
        if (info) {
          const insert_or_update_query = `
          insert into tbl_images (image_name, image_size) values ('${getImageName(images[0].filename)}.webp', ${images[0].size})
          on conflict (image_name) 
          do update set image_name = excluded.image_name returning image_guid, image_name
          `
          const inserted_or_updated_image_res = await database.query(insert_or_update_query, [])
          const img_guid = inserted_or_updated_image_res.rows[0].image_guid
          if (img_guid) {
            const assign_groups_images_query = `
            insert into tbl_groups_images (image_guid, parent_guid, is_image_main) values (
              '${img_guid}', '${group_guid}', ${true}
            )
            on conflict (parent_guid) 
            do update set image_guid = excluded.image_guid returning  row_id  
            `
            const assign_group_images_res = await database.query(assign_groups_images_query, [])
            if (assign_group_images_res.rows[0].row_id) {
              return res.status(status.success).send('SUCCESS')
            }
          }
        }
      }





    } catch (error) {
      console.log('error: ', error)
      return res.status(status.error).send('Unkown error')
    }

  })
}

const UploadBanner = async (req, res) => {
    // NOTE: banner images are written only on original folder
    // we dont really convert it to wepb format

  try {
    const uploader = imageUploader('banner', 999)
    uploader(req, res, async(err) => {
      if (err instanceof multer.MulterError) {
        console.log(`Multer err: `, err)
        return res.status(status.error).send("Multer error.")
      }
      try {
        const images = req.files
        if(images?.length > 0){
          const insert_banner_query = `
            insert into tbl_images (parent_guid, image_name, image_size)values 
            ${images?.map(item => `(
              '${guid}', '${getImageName(item.filename)}.webp', ${item.size}
            )`).join(', ')}
            on conflict (image_name) do update set image_name = excluded.image_name returning image_guid, image_name
          `

          for(let image of images){
            sharp(image?.path).toFile(process.cwd() + `${ENV.IMAGE_PATH_PREFIX}/${getImageName(image?.filename)}.webp`)
          }

          const response = await database.queryTransaction([{ queryText: insert_banner_query, params: [] }])
          console.log('response', response)
          return res.status(status.success).send('SUCCESS')
        }
        return res.status(status.bad).send('FAILURE')
      } catch (error) {
        console.log(error)
      }
    })
  } catch (error) {
    console.log(error)
    return res.status(status.error).send('Unknown error occured.')
  }
}



module.exports = {
  GetFirms,
  GetOrdersDataForEdit,
  EditOrder,
  GetSyncData,
  GetAllMaterials,
  EditMaterial,
  UploadMaterialImages,
  GetImagesByMaterial,
  GetAllAttributes,
  GetAllImages,
  GetPriceTypes,
  GetMaterialEditData,
  GetPriceValuesByPT,
  GetGroupsWithImages,
  UploadGroupsImage,
  GetAllImagesMaterials, 
  UploadBanner
};
