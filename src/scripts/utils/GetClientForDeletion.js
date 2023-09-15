const database = require('../../db/index')

const GetClientForDeletion = async (partner_guid) => {
    let value = -1
    text = `SELECT mark_for_deletion FROM tbl_partners WHERE partner_guid = $1`

    try {
        const {rows} = await database.query(text, [partner_guid])
        if(rows.length !== 0){
            value = rows[0]['mark_for_deletion']
        }else console.log('Mark for deletion of this order not found')
    } catch (error) {
        console.log(error)
    }

    return value
}

module.exports = GetClientForDeletion