const database = require('../../db/index')

const GetOrdSynchronized = async (order_id) => {
    let value = -1
    text = `SELECT ord_synchronized FROM tbl_orders WHERE ord_guid = $1`

    try {
        const { rows } = await database.query(text, [order_id])
        if(rows.length !== 0 && rows[0]['ord_synchronized'] !== false){
            value = rows[0]['ord_synchronized']
            console.log(value)
        }else {
            value = false
        }
    } catch (error) {
        console.log(error)
    }

    return value
}

module.exports = GetOrdSynchronized;