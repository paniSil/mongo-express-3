const getDb = (req, res) => {
    const db = req.app.locals.db;
    if (!db) {
        console.error('Error: Database is not connected.');
        res.status(500).json({ message: 'Server error: Database is not connected.' });
        return null;
    }
    return db;
};

export default getDb;