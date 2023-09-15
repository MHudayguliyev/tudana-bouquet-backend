const database = require('../../db/index')

const GetDataVersion = async (client_id) => {
    let value = -1
    text = `SELECT data_version FROM tbl_clients WHERE client_guid = $1`

    try {
        const {rows} = await database.query(text, [client_id])
        if(rows.length !== 0){
            value = rows[0]['data_version']
        }else {
            value = null
            console.log('data version not found')
        }
    } catch (error) {
        console.log(error)
    }

    return value
}

module.exports = GetDataVersion