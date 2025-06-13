import getDb from '../../utils/getDb.mjs';

const getUsersHandler = async (req, res) => {
  try {
    const db = getDb(req, res);
    if (!db) return;

    const usersCollection = db.collection('users');
    const cursor = usersCollection.find({})

    const users = [];
    while (await cursor.hasNext()) {
      const user = await cursor.next();
      users.push(user);
    }

    const theme = req.cookies.theme || 'light';
    res.render('users.pug', { users: users, theme: theme, user: req.user });
  } catch (error) {
    console.error('Error: get user list', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export { getUsersHandler }
