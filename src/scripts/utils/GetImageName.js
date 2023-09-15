function getImageName(filename) {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex === -1) {
        return filename;
    }
    return filename.substring(0, dotIndex);
}

module.exports = getImageName