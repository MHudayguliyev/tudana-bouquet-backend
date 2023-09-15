const express = require('express')
const router = express.Router()
const { LoginUser, LoadUser, TokenRefresh } = require('../controllers/Auth')
const { LoginSchema } = require('../scripts/schemas/AuthSchema')
const SchemaValidate = require('../scripts/utils/SchemaValidate')


router.route('/load-user').get(LoadUser)
router.route('/token/refresh/').get(TokenRefresh)

router.route('/login').post(SchemaValidate(LoginSchema),LoginUser)









module.exports = router