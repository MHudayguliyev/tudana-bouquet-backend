const multer = require('multer')
const path = require('path')


function imageUploader(imageArrayName, imageArrayCount) {
    const imageUploadPath = path.join(process.cwd(), '/src/images/original')
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, imageUploadPath)
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    })
    const fileFilter = (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp' || file.mimetype === 'image/gif') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'), false);
        }
    };

    const upload = multer({ storage: storage, fileFilter: fileFilter, preservePath: true })
    const uploader = upload.array(imageArrayName, imageArrayCount)
    return uploader

}


module.exports = imageUploader