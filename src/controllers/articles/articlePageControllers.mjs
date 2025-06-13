import getDb from '../../utils/getDb.mjs';
import { findArticleByTitle, createArticleInDb } from './articleHelpers.mjs';
import { getArticleStatsHandler } from './articleController.mjs';

const addNewArticlePageHandler = (req, res) => {
    const theme = req.cookies.theme || 'light';
    res.render('add-article.ejs', {
        title: 'Add New Article',
        theme: theme,
        user: req.user
    });
};

const addNewArticleHandler = async (req, res) => {
    const db = getDb(req, res);
    if (!db) return;

    const { title, text } = req.body;

    if (!title || !text) {
        const theme = req.cookies.theme || 'light';
        return res.status(400).render('add-article.ejs', {
            title: 'Add New Article',
            theme: theme,
            user: req.user,
            errorMessage: 'Article is in need of title and text'
        });
    }

    try {
        const existingArticle = await findArticleByTitle(db, title);
        if (existingArticle) {
            const theme = req.cookies.theme || 'light';
            return res.status(409).render('add-article.ejs', {
                title: 'Add New Article',
                theme: theme,
                user: req.user,
                errorMessage: 'Title article already exists. Choose another.'
            });
        }
        await createArticleInDb(db, title, text);
        res.redirect('/articles');
    } catch (error) {
        const theme = req.cookies.theme || 'light';
        res.status(500).render('add-article.ejs', {
            title: 'Add New Article',
            theme: theme,
            user: req.user,
            errorMessage: 'Error while creating new article'
        });
    }
}

const getArticleStatsPageHandler = async (req, res) => {
    try {
        const db = getDb(req, res);
        if (!db) return;

        const mockRes = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.jsonData = data;
                return this;
            },
            send: function (data) {
                this.jsonData = { message: data };
                return this;
            }
        };

        await getArticleStatsHandler(req, mockRes);

        if (mockRes.statusCode !== 200) {
            throw new Error(mockRes.jsonData.message || 'Error while retieving stats with API.');
        }

        const theme = req.cookies.theme || 'light';
        res.render('article-stats.pug', {
            title: 'Article Stats',
            stats: mockRes.jsonData.data,
            theme: theme,
            user: req.user
        });
    } catch (error) {
        console.error('Error displaying stats page', error);
        const theme = req.cookies.theme || 'light';
        res.status(500).json({ message: 'Server error' });
    }
};

export { addNewArticleHandler, getArticleStatsPageHandler, addNewArticlePageHandler }