
const database = require('../../db/index')

const GetMarkForDeletion = async (order_guid) => {
    let value = -1
    text = `SELECT mark_for_deletion FROM tbl_orders WHERE order_guid = $1`

    try {
        const {rows} = await database.query(text, [order_guid])
        if(rows.length !== 0){
            value = rows[0]['mark_for_deletion']
        }else console.log('Mark for deletion of this order not found')
    } catch (error) {
        console.log(error)
    }

    return value
}

module.exports = GetMarkForDeletion;