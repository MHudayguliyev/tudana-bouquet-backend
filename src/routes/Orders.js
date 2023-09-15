const express = require("express");
const router = express.Router();
const Authenticate = require("../scripts/helpers/Authenticate");
const {
  GetAllOrders,
  GetStatusList,
  GetClientList,
  GetWarehouseList,
  GetUserList,
  GetAllRowsCount,
  GetMaterialByOrder,
  GetPrintDatas,
} = require("../controllers/Orders");

// ---------------------   GET  REQUESTS  ------------------- //
router.route("/get-all-orders").get(Authenticate, GetAllOrders);
router.route("/get-status-list").get(Authenticate, GetStatusList);
router.route("/get-client-list").get(Authenticate, GetClientList);
router.route("/get-user-list").get(Authenticate, GetUserList);
router.route("/get-warehouse-list").get(Authenticate, GetWarehouseList);
router.route("/get-materials-by-order").get(Authenticate, GetMaterialByOrder);
router.route("/get-print-datas").get(Authenticate, GetPrintDatas);


module.exports = router;
