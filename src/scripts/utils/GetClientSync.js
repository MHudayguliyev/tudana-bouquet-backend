const database = require('../../db/index')

const GetClientSync = async (client_id) => {
    let value = -1;
    text = `SELECT client_synchronized FROM tbl_clients WHERE client_guid = $1`

    try {
        const { rows } = await database.query(text, [client_id])
        if(rows.length !== 0 && rows[0]['client_synchronized'] !== false){
            value = rows[0]['client_synchronized']  /// gets true
        }else {
            value = rows[0]['client_synchronized']
        }
    } catch (error) {
        console.log(error)
    }

    return value
}

module.exports = GetClientSync