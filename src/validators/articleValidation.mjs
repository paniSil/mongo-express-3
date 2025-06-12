import { Joi, celebrate, Segments } from "celebrate"

const articleSchema = Joi.object({
    title: Joi.string().required().min(3).max(30),
    text: Joi.string().required().min(3),
})

const updateManyArticlesSchema = Joi.object({
    filter: Joi.object().min(1).required().pattern(Joi.string(), Joi.any()),
    update: Joi.object().min(1).required().pattern(Joi.string(), Joi.any()),
}).required();

const replaceArticleSchema = Joi.object({
    query: Joi.object().min(1).required().pattern(Joi.string(), Joi.any()),
    replacement: Joi.object().min(1).required()
}).required();

const validateArticleBody = celebrate({
    [Segments.BODY]: articleSchema
})

const validateUpdateManyArticlesBody = celebrate({
    [Segments.BODY]: updateManyArticlesSchema
});

const validateParamsArticleId = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required()
    })
})

const validateReplaceArticle = celebrate({
    [Segments.BODY]: replaceArticleSchema
}, { abortEarly: false });

export { validateArticleBody, validateParamsArticleId, validateUpdateManyArticlesBody, validateReplaceArticle }
