import { Router } from 'express'
import { validateArticleBody, validateParamsArticleId, validateUpdateManyArticlesBody, validateReplaceArticle } from '../validators/articleValidation.mjs'
import { addNewArticleHandler, addNewArticlePageHandler, getArticleStatsPageHandler } from '../controllers/articles/articlePageControllers.mjs';
import { getArticlesHandler, getArticleStatsHandler } from '../controllers/articles/articleController.mjs';
import { postArticleHandler, replaceArticleHandler, getArticleByIdHandler, putArticleByIdHandler, deleteArticleByIdHandler } from '../controllers/articles/articleControllerSingle.mjs';
import { postManyArticlesHandler, putManyArticlesHandler, deleteManyArticles } from '../controllers/articles/articlesControllerMany.mjs';


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