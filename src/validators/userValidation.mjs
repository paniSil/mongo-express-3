import { Joi, celebrate, Segments } from "celebrate"

const userSchema = Joi.object({
    name: Joi.string().required().min(3).max(30),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    age: Joi.number().required().min(0).max(110)
})

const validateUserBody = celebrate({
    [Segments.BODY]: userSchema
})

const validateParamsUserId = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required()
    })
})

export { validateUserBody, validateParamsUserId }
