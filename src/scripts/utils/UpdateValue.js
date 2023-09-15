const database = require('../../db/index')
const status = require('./status')

const UpdateValue = async (value, type) => {
    text = `update tbl_increments set inc_value = $1 WHERE inc_type = $2`
    params = [value, type]
    try {
        await database.query(text, params)
    } catch (error) {
        console.log(status.error, error)
    }

}

module.exports = UpdateValue;