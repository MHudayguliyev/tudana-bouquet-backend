const joi = require('joi')


const LoginSchema = joi.object({
    username: joi.string().required().min(3).max(50).label('Ulanyjy ady').messages({
        'string.pattern.base': '{#label} layyk gelenok!',
        'string.min': '{#label} in azyndan 3 harp bolmaly!',
        'string.max': '{#label} in kop 50 harp bolup biler!',
        'any.required': '{#label} hokman gerek!'
    }),
    password: joi.string().allow('', null).min(3).label('Parol').messages({
        'string.pattern.base': '{#label} layyk gelenok!',
        'string.min': '{#label} in azyndan 3 harp bolmaly!',
        // 'any.required': '{#label} hokman gerek!'
    }),
})







module.exports = {
    LoginSchema,
    
}