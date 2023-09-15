const os = require('os')

const getIPAddress = () => {
    const interfaces = os.networkInterfaces();
    for (let iface of Object.values(interfaces)) {
        for (let alias of iface) {
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
};


function getImageNameFromPath(image) {
    return image.split("\\").pop();
}



const fs = require('fs').promises;
const path = require('path');

const deleteFile = async (dir, file) => {
    await fs.unlink(path.join(dir, file));
    console.log('Deleted: ', file)
}

module.exports = {
    getIPAddress,
    getImageNameFromPath,
    deleteFile
}