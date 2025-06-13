import getDb from '../../utils/getDb.mjs';

const postManyArticlesHandler = async (req, res) => {
    try {
        const db = getDb(req, res);
        if (!db) return;

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

const putManyArticlesHandler = async (req, res) => {
    try {
        const db = getDb(req, res);
        if (!db) return;

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

const deleteManyArticles = async (req, res) => {
    try {
        const db = getDb(req, res);
        if (!db) return;

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

export { postManyArticlesHandler, putManyArticlesHandler, deleteManyArticles }