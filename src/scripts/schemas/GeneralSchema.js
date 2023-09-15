const joi = require('joi')

const OrderUpdateSchema = joi.object({
    order_guid: joi.string().required().min(0).max(36).label('Order guid').messages({
      'string.base': '{#label} setir ululyk bolmaly',
      'string.pattern.base': '{#label} layyk gelenok',
      'any.required': '{#label} hokman gerek',
      'string.empty': '{#label} boş setir ululyk bolup bilmeýär',
    }),
    order_code: joi.string().required().label('Sargyt kody').messages({
        'string.base': '{#label} setir ululyk bolmaly',
        'string.pattern.base': '{#label} layyk gelenok',
        'string.empty': '{#label} boş setir ululyk bolup bilmeýär',
        'any.required': '{#label} hokman gerek'
      }),
      order_valid_dt: joi.date().iso().required().label('Sargyt senesi'),
      order_delivery_dt: joi.date().iso().required().greater(joi.ref('order_valid_dt')).label('Eltip berme senesi'),
      mat_unit_amount: joi.number().required().label('Jemi mukdary').messages({
        'number.base': '{#label} san bolmaly',
        'any.required': '{#label} hokman gerek'
      }),
      order_total: joi.number().required().label('Jemi bahasy').messages({
        'number.base': '{#label} san bolmaly',
        'any.required': '{#label} hokman gerek'
      }),
      order_desc: joi.string().allow("").max(250).label('Sargyt belligi').messages({
        'string.base': '{#label} setir ululyk bolmaly',
        'string.pattern.base': '{#label} layyk gelenok',
        'string.max': '{#label} iň köp 250 simwol bolup biler'
      }),
      partner_guid: joi.string().required().label('Müşderi guid-i').messages({
        'string.base': '{#label} setir ululyk bolmaly',
        'string.pattern.base': '{#label} layyk gelenok',
        'any.required': '{#label} hokman gerek',
        'string.empty': '{#label} boş setir ululyk bolup bilmeýär',
      }),
      warehouse_guid: joi.string().required().label('Ýyladyşhana guid-i').messages({
        'string.base': '{#label} setir ululyk bolmaly',
        'string.pattern.base': '{#label} layyk gelenok',
        'any.required': '{#label} hokman gerek',
        'string.empty': '{#label} boş setir ululyk bolup bilmeýär',
      }),
      status_guid: joi.string().required().label('Status guid ').messages({
        'string.base': '{#label} setir ululyk bolmaly',
        'any.required': '{#label} hokman gerek'
      }),
      orders_line: joi.array().required().items(joi.object({
        row_id: joi.number().required().label('Row id').messages({
          'number.base': '{#label} san bolmaly',
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        }),
        ord_line_amount: joi.number().required().label('Amount').messages({
          'number.base': '{#label} san bolmaly',
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        }),
        ord_line_price_total: joi.number().required().label('Price total').messages({
          'number.base': '{#label} san bolmaly',
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        }),
        ord_line_disc_percent: joi.number().required().label('Discount percent').messages({
          'number.base': '{#label} san bolmaly',
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        }),
        ord_line_disc_amount: joi.number().required().label('Discount amount').messages({
          'number.base': '{#label} san bolmaly',
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        }),
        ord_line_price_nettotal: joi.number().required().label('Price nettotal').messages({
          'number.base': '{#label} san bolmaly',
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        }),
        mtrl_desc: joi.string().allow(null, ''),
        ord_line_desc: joi.string().allow(null,''),
        ord_line_price: joi.number().required().label('Price value').messages({
          'number.base': '{#label} san bolmaly',
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        }),
        price_type_guid: joi.string().required().guid().label('Price type guid-i').messages({
          'string.base': '{#label} setir ululyk bolmaly',
          'string.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'string.empty': '{#label} boş setir ululyk bolup bilmeýär',
        }),
        line_row_id_front: joi.number().required().label('Line front id').messages({
          "number.base": "{#label} san bolmaly",
          'number.pattern.base': '{#label} layyk gelenok',
          'any.required': '{#label} hokman gerek',
          'number.empty': '{#label} boş san bolup bilmeýär',
        })
      })).label('Sargyt harytlary').messages({
        'array.base': '{#label} massiw bolmaly',
      })
})

module.exports = {
  OrderUpdateSchema
}