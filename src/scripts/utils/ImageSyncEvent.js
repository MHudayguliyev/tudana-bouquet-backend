const { ImageSyncEmitter } = require('./EventEmitters')
const ImageSynchronization = require('../helpers/ImageSynchronization')

module.exports = () => {
    ImageSyncEmitter.on('imageSync', () => {
        ImageSynchronization()
    })
}