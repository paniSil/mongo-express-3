import { ObjectId } from 'mongodb';

const getArticlesHandler = async (req, res) => {
  try {
    const db = req.app.locals.db
    if (!db) {
      return res.status(500).json({ message: 'Error: DB is not connected' });
    }
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

const postArticleHandler = async (req, res) => {
  try {
    const db = req.app.locals.db
    if (!db) {
      return res.status(500).json({ message: 'Error: DB is not connected' });
    }

    const { title, text } = req.body;
    const newArticle = {
      title,
      text,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const articlesCollection = db.collection('articles');
    const result = await articlesCollection.insertOne(newArticle);

    res.status(201).json({
      message: 'Article created!',
      articleId: result.insertedId,
      article: { _id: result.insertedId, title, text }
    });
  } catch (error) {
    console.error('Error: post article error', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const postManyArticlesHandler = async (req, res) => {
  const db = req.app.locals.db
  if (!db) {
    return res.status(500).json({ message: 'Error: DB is not connected' })
  }

  try {
    const articles = req.body
    if (!Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({ message: 'Provided articles are not in array' })
    }

    const newArticles = articles.map(article => ({
      ...article,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const articlesCollection = db.collection('articles')
    const result = await articlesCollection.insertMany(newArticles)

    res.status(201).json({
      message: `${result.insertedCount} articles have been created`,
      insertedIds: result.insertedIds
    })
  } catch (error) {
    console.error('Error while creating articles from array', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const getArticleByIdHandler = async (req, res) => {
  try {
    const db = req.app.locals.db
    if (!db) {
      return res.status(500).json({ message: 'Error: DB is not connected' });
    }

    const articleId = req.params.id;
    const articlesCollection = db.collection('articles');

    const article = await articlesCollection.findOne({ _id: new ObjectId(articleId) });
    const theme = req.cookies.theme || 'light';

    if (article) {
      res.render('article.ejs', { article: article, theme: theme, user: req.user });
    } else {
      res.status(404).send('Article Not Found');
    }
  } catch (error) {
    console.error('Error: get article by ID error', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const putArticleByIdHandler = async (req, res) => {
  try {
    const db = req.app.locals.db
    if (!db) {
      return res.status(500).json({ message: 'Error: DB is not connected' });
    }

    const articleId = req.params.id;
    const { title, text } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (text) updates.text = text;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No update data' });
    }

    updates.updatedAt = new Date();
    const articlesCollection = db.collection('articles');
    const result = await articlesCollection.updateOne(
      { _id: new ObjectId(articleId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const updatedArticle = await articlesCollection.findOne({ _id: new ObjectId(articleId) });
    res.status(200).json({ message: `Article ${articleId} is updated`, article: updatedArticle });
  } catch (error) {
    console.error('Error: put article by ID error', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const replaceArticleHandler = async (req, res) => {
  try {
    const db = req.app.locals.db
    if (!db) {
      return res.status(500).json({ message: 'Error: DB is not connected' });
    }

    const articlesCollection = db.collection('articles');
    const { query, replacement } = req.body

    if (!query || Object.keys(query).length === 0 || !replacement || Object.keys(replacement).length === 0) {
      return res.status(400).json({ message: 'Query or replacement was not provided' });
    }
    const filter = { ...query };
    if (filter._id) {
      if (!ObjectId.isValid(filter._id)) {
        return res.status(400).json({ message: 'Wrong id (query._id).' });
      }
      filter._id = new ObjectId(filter._id);
    }
    const articleReplacement = {
      ...replacement,
      createdAt: replacement.createdAt || new Date(),
      updatedAt: new Date()
    };

    const result = await articlesCollection.replaceOne(filter, articleReplacement);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Article for replacement was not found' });
    }

    res.status(200).json({
      message: 'Article is replaced',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error: put article by ID error', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const putManyArticlesHandler = async (req, res) => {
  const db = req.app.locals.db
  if (!db) {
    return res.status(500).json({ message: 'Error: DB is not connected' })
  }

  try {
    const { filter, update } = req.body
    if (!filter || Object.keys(filter).length === 0 || !update || Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No filter was provided' });
    }

    const articlesCollection = db.collection('articles')
    const updateResult = await articlesCollection.updateMany(filter, { $set: { ...update, updatedAt: new Date() } })

    res.status(200).json({
      message: `${updateResult.matchedCount} articles matched, ${updateResult.modifiedCount} articles modified.`,
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount
    })
  } catch (error) {
    console.error('Error while creating articles from array', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteArticleByIdHandler = async (req, res) => {
  try {
    const db = req.app.locals.db
    if (!db) {
      return res.status(500).json({ message: 'Error: DB is not connected' });
    }

    const articleId = req.params.id;
    if (!ObjectId.isValid(articleId)) {
      console.error('Invalid ObjectId format for article ID:', articleId);
      return res.status(400).json({ message: 'Wrong article ID format' });
    }

    const articlesCollection = db.collection('articles');

    const result = await articlesCollection.deleteOne({ _id: new ObjectId(articleId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error: delete article by ID error', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const deleteManyArticles = async (req, res) => {
  const db = req.app.locals.db
  if (!db) {
    return res.status(500).json({ message: 'Error: DB is not connected' })
  }
  try {
    const filter = req.body
    if (!filter || Object.keys(filter).length === 0) {
      return res.status(400).json({ message: 'No filter was provided' })
    }
    const articlesCollection = db.collection('articles')
    const result = await articlesCollection.deleteMany(filter)
    res.status(200).json({
      message: `${result.deletedCount} articles deleted`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Error while deleting articles', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const addNewArticlePageHandler = (req, res) => {
  const theme = req.cookies.theme || 'light';
  res.render('add-article.ejs', {
    title: 'Add New Article',
    theme: theme,
    user: req.user
  });
};

const findArticleByTitle = async (db, title) => {
  const articlesCollection = db.collection('articles')
  return await articlesCollection.findOne({ title: title });
}

const createArticleInDb = async (db, title, text) => {
  const articlesCollection = db.collection('articles')

  const newArticle = {
    title,
    text,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await articlesCollection.insertOne(newArticle);
  return { _id: result.insertedId, ...newArticle };
}

const addNewArticleHandler = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).send('Server error. DB is not connected');
  }

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

const getArticleStatsHandler = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).send('Server error. DB is not connected');
  }

  try {
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

const getArticleStatsPageHandler = async (req, res) => {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).send('Server error. DB is not connected');
  }

  try {
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

export { getArticlesHandler, postArticleHandler, getArticleByIdHandler, putArticleByIdHandler, deleteArticleByIdHandler, addNewArticlePageHandler, addNewArticleHandler, postManyArticlesHandler, putManyArticlesHandler, deleteManyArticles, replaceArticleHandler, getArticleStatsHandler, getArticleStatsPageHandler }