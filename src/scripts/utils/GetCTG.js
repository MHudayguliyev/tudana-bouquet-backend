const database = require('../../db/index')

const GetCTGP = async () => {
    let value = -1
    text = `select contact_type_id from tbl_contact_type where contact_type_id = 2`

    try {
        const {rows} = await database.query(text, [])
        if(rows.length !== 0){
            value = rows[0]['contact_type_id']
        }else {
            console.log('No contact_type_id found!')
        }
    } catch (error) {
        console.log(error)
    }

    return value
}




const GetCTGA = async () => {
    let value = -1
    text = `select contact_type_id from tbl_contact_type where contact_type_id = 1`

    try {
        const {rows} = await database.query(text, [])
        if(rows.length !== 0){
            value = rows[0]['contact_type_id']
        }else {
            console.log('No contact_type_id found!')
        }
    } catch (error) {
        console.log(error)
    }

    return value
}



module.exports = {GetCTGP, GetCTGA}