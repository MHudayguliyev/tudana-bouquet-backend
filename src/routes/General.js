const express = require('express')
const router = express.Router()
const Authenticate = require('../scripts/helpers/Authenticate')
const { GetFirms, GetOrdersDataForEdit, EditOrder, GetSyncData, GetAllMaterials, EditMaterial, UploadMaterialImages, GetImagesByMaterial, GetAllAttributes, GetAllImages, GetPriceTypes, GetMaterialEditData, GetPriceValuesByPT, GetGroupsWithImages, UploadGroupsImage, GetAllImagesMaterials } = require('../controllers/General')
const { OrderUpdateSchema } = require('../scripts/schemas/GeneralSchema')
const SchemaValidate = require('../scripts/utils/SchemaValidate')


router.route('/get-firms').get(Authenticate, GetFirms)
router.route('/get-orders-data-for-edit').get(Authenticate, GetOrdersDataForEdit)
router.route('/get-sync-data').get(GetSyncData)
router.route('/all-materials').get(GetAllMaterials)
router.route('/get-images-by-material').get(Authenticate, GetImagesByMaterial)
router.route('/get-all-attributes').get(Authenticate, GetAllAttributes)
router.route('/get-all-images').get(Authenticate, GetAllImages)
router.route('/get-price-types').get(Authenticate, GetPriceTypes )
router.route('/get-material-edit-data').get(Authenticate, GetMaterialEditData )
router.route('/get-price-values-by-pt').get(Authenticate,   GetPriceValuesByPT)
router.route('/get-groups-with-images').get(Authenticate,   GetGroupsWithImages )
router.route('/get-all-images-materials').get(Authenticate,   GetAllImagesMaterials )





router.route('/edit-order').post(Authenticate, SchemaValidate(OrderUpdateSchema), EditOrder)
router.route('/edit-material').patch(Authenticate, EditMaterial)
router.route('/upload-material-images').post(Authenticate, UploadMaterialImages)
router.route('/upload-groups-image').post(Authenticate, UploadGroupsImage)







module.exports = router