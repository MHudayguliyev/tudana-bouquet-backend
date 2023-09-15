const tbl_names = [
  "tbl_assembly_orders",
  "tbl_assembly_orders_line",
  "tbl_attribute_type",
  "tbl_attributes",
  "tbl_barcode",
  "tbl_clients",
  "tbl_contact_info",
  "tbl_contact_type",
  "tbl_currency",
  "tbl_firms",
  "tbl_group",
  "tbl_images",
  "tbl_increments",
  "tbl_material_type",
  "tbl_materials",
  "tbl_mtrl_attr_unit",
  "tbl_orders",
  "tbl_orders_line",
  "tbl_price_type",
  "tbl_prices",
  "tbl_recept_head",
  "tbl_recept_line",
  "tbl_statuses",
  "tbl_stock_by_warehouse",
  "tbl_unit_details",
  "tbl_units",
  "tbl_users",
  "tbl_warehouses",
];

const CheckTblNames = (tbl_name) => {
  let result;
  if (tbl_names.includes(tbl_name)) {
    result = true;
  } else {
    result = false;
  }
  return result;
};

module.exports = CheckTblNames;
