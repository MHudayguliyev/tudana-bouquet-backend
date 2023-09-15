const joi = require('joi')

const ClientShcema = joi.object({
    partner_guid: joi.string().required().min(0).max(36).label('Partner guid').messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "string.empty": "{#label} boş setir ululyk bolup bilmeýär",
        "any.required": "{#label} hokman gerek",
      }),
      partner_code: joi
      .string()
      .required()
      .label("Musderinin kody")
      .messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "any.required": "{#label} hokman gerek"
      }),
      partner_name: joi
      .string()
      .required()
      .min(3)
      .max(100)
      .label("Musderinin ady")
      .messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "any.required": "{#label} hokman gerek",
        "string.min": "{#label} in azyndan 3 harp bolmaly",
        "string.max": "{#label} in kop 100 harp bolup biler",
      }),
    partner_full_name: joi
      .string()
      .required()
      .min(3)
      .max(100)
      .label("Musderinin doly ady")
      .messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "any.required": "{#label} hokman gerek",
        "string.min": "{#label} in azyndan 3 harp bolmaly",
        "string.max": "{#label} in kop 100 harp bolup biler",
      }),
    partner_telephone: joi
      .number()
      .required()
      // .min(7)
      // .max(8)
      .label("Musderinin telefon belgisi")
      .messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "any.required": "{#label} hokman gerek",
        "string.min": "{#label} in azyndan 9 simwol bolmaly",
        "string.max": "{#label} in kop 12 simwol bolup biler",
      }),
    partner_address: joi
      .string()
      .required()
      .min(1)
      .max(300)
      .label("Musderinin adresi")
      .messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "any.required": "{#label} hokman gerek",
        "string.min": "{#label} in azyndan 1 harp bolmaly",
        "string.max": "{#label} in kop 300 harp bolup biler",
      }),
      addition_telephones: joi.number()
      // .min(8)
      // .max(8)
      .label("Musderinin gosmaca telefon belgisi")
      .allow("", null)
      .messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "string.min": "{#label} in azyndan 8 simwol bolmaly",
        "string.max": "{#label} in kop 8 simwol bolup biler",
      }),
      addition_addresses: joi
      .string()
      .allow("",  null)
      .min(1)
      .max(300)
      .label("Musderinin gosmaca adresi")
      .messages({
        "string.base": "{#label} setir ululyk bolmaly",
        "string.pattern.base": "{#label} layyk gelenok",
        "string.min": "{#label} in azyndan 1 harp bolmaly",
        "string.max": "{#label} in kop 300 harp bolup biler",
      }),
  });

module.exports = ClientShcema