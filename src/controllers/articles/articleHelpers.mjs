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

export { findArticleByTitle, createArticleInDb }