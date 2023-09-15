const express = require("express");
const {
  GetGroups,
  GetCategories,
  GetallCategories,
  GetAllMaterials,
  GetClients,
  GetWhouse,
  GetMaterials,
  AddNewClient,
  ConfirmOrder,
  GenerateOrderCode,
} = require("../controllers/CreateOrder");
const router = express.Router();
const Authenticate = require("../scripts/helpers/Authenticate");
const SchemaValidate = require("../scripts/utils/SchemaValidate");
const {
  NewClientSchema,
  ConfirmOrderSchema,
} = require("../scripts/schemas/CreateOrderSchemas");

// ------------------------ GET METHODS ------------------------------ //
router.route("/groups").get(Authenticate, GetGroups);
router.route("/materials").get(Authenticate, GetMaterials);
router.route("/categories").get(Authenticate, GetCategories);
router.route("/all_categories").get(Authenticate, GetallCategories);
router.route("/all_materials").get(Authenticate, GetAllMaterials);
router.route("/client_list").get(Authenticate, GetClients);
router.route("/whouse_list").get(Authenticate, GetWhouse);
router.route("/generate-code").get(Authenticate, GenerateOrderCode);

// ------------------------ POST METHODS ------------------------------ //
router.route("/new-client").post(Authenticate, SchemaValidate(NewClientSchema), AddNewClient);
router.route("/confirm-order").post(Authenticate, SchemaValidate(ConfirmOrderSchema), ConfirmOrder);

module.exports = router;
