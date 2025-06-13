import getDb from '../../utils/getDb.mjs';

const getArticlesHandler = async (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const { limit, skip, sort, projection } = req.query;

    const articlesCollection = db.collection('articles');
    let query = articlesCollection.find({});

    if (projection) {
      try {
        const projObj = JSON.parse(projection);
        query = query.project(projObj);
      } catch (e) {
        return res.status(400).json({ message: 'Wrong projection format. Provide JSON.' });
      }
    }

    if (limit) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        query = query.limit(parsedLimit);
      } else {
        return res.status(400).json({ message: 'Wrong limit format. Provide integer' });
      }
    }

    if (skip) {
      const parsedSkip = parseInt(skip, 10);
      if (!isNaN(parsedSkip) && parsedSkip >= 0) {
        query = query.skip(parsedSkip);
      } else {
        return res.status(400).json({ message: 'Wrong skip format. Provide integer' });
      }
    }

    if (sort) {
      try {
        const sortObj = JSON.parse(sort);
        query = query.sort(sortObj);
      } catch (e) {
        return res.status(400).json({ message: 'Wrong sort format. Provide JSON' });
      }
    }

    const articles = [];
    const cursor = query;
    while (await cursor.hasNext()) {
      const article = await cursor.next();
      articles.push(article);
    }

    if (req.accepts('html')) {
      const title = 'Список статей (EJS)';
      const theme = req.cookies.theme || 'light';
      res.render('articles.ejs', { title: title, articles: articles, theme: theme, user: req.user });
    } else {
      res.status(200).json(articles);
    }
  }
  catch (error) {
    console.error('Error: get articles list', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const getArticleStatsHandler = async (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const articles = db.collection('articles');

    const stats = await articles.aggregate([
      {
        $group: { _id: { $year: "$createdAt" }, totalArticles: { $sum: 1 } }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();

    res.status(200).json({
      message: 'Article stats by year',
      data: stats
    });
  } catch (error) {
    console.error('Error while retrieving article stats', error);
    res.status(500).json({ message: 'Server error' });
  }
}



export { getArticlesHandler, getArticleStatsHandler }