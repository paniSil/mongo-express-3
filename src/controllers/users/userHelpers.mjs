import { ObjectId } from 'mongodb';

const findUserByEmail = async (db, email) => {
    const usersCollection = db.collection('users');
    return await usersCollection.findOne({ email });
};

const findUserById = async (db, id) => {
    const usersCollection = db.collection('users');
    if (!ObjectId.isValid(id)) {
        return null;
    }
    return await usersCollection.findOne({ _id: new ObjectId(id) });
};

export { findUserByEmail, findUserById }