const express = require('express')
const router = express.Router()
const Authenticate = require('../scripts/helpers/Authenticate')
const SchemaValidate = require('../scripts/utils/SchemaValidate')
const ClientSchema = require('../scripts/schemas/ClientSchema')
const {GetClients, EditClient} = require('../controllers/ClientsPage')

router.route("/get-clients").get(Authenticate, GetClients);
router.route('/edit-client').post(Authenticate, SchemaValidate(ClientSchema), EditClient)


module.exports = router