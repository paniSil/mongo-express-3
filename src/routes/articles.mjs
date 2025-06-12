import { Router } from 'express'
import {
    getArticlesHandler,
    postArticleHandler,
    getArticleByIdHandler,
    putArticleByIdHandler,
    deleteArticleByIdHandler,
    addNewArticlePageHandler,
    addNewArticleHandler,
    postManyArticlesHandler,
    putManyArticlesHandler,
    deleteManyArticles,
    replaceArticleHandler,
    getArticleStatsHandler,
    getArticleStatsPageHandler
} from '../controllers/articles.mjs'

import { validateArticleBody, validateParamsArticleId, validateUpdateManyArticlesBody, validateReplaceArticle } from '../validators/articleValidation.mjs'


const articlesRouter = Router()

articlesRouter.get('/new', addNewArticlePageHandler);
articlesRouter.post('/new', validateArticleBody, addNewArticleHandler);

articlesRouter
    .route('/')
    .get(getArticlesHandler)
    .post(validateArticleBody, postArticleHandler)

articlesRouter
    .route('/many')
    .post(postManyArticlesHandler)
    .put(validateUpdateManyArticlesBody, putManyArticlesHandler)
    .delete(deleteManyArticles)

articlesRouter
    .route('/replace')
    .put(validateReplaceArticle, replaceArticleHandler)

articlesRouter
    .route('/:id')
    .get(validateParamsArticleId, getArticleByIdHandler)
    .put(validateParamsArticleId, validateArticleBody, putArticleByIdHandler)
    .delete(validateParamsArticleId, deleteArticleByIdHandler)

articlesRouter.get('/stats', getArticleStatsHandler);
articlesRouter.get('/stats/view', getArticleStatsPageHandler);
export default articlesRouter