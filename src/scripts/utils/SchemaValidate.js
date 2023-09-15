const status = require('./status')

const SchemaValidate = schema => (req, res, next) => {
    const { error, value } = schema.validate(req.body)
    // console.log(req.body)
    if(error){
        res.status(status.bad).json({
            error: error.details[0].message
        })
        return        
    }
    Object.assign(req.body, value)
    return next()
}

module.exports = SchemaValidate