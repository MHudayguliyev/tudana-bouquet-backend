const database = require('../../db/index')

const GetClientBalans = async (partner_guid) => {
    let value = -1;
    text = `SELECT partner_balance FROM tbl_partners WHERE partner_guid = $1`
    try {
        const { rows } = await database.query(text, [partner_guid])
        if(rows.length !== 0){
            value = rows[0]['partner_balance']
        }else {
            console.log('No client balans found')
        }
    } catch (error) {
        console.log(error)
    }

    return value
}

module.exports = GetClientBalans