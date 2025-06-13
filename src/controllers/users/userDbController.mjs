import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const createUserInDb = async (db, name, email, password, age) => {
    const usersCollection = db.collection('users');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = {
        name,
        email,
        password: hashedPassword,
        age: parseInt(age, 10),
        role: 'admin',
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    return { _id: result.insertedId, ...newUser };
};

const updateUserInDb = async (db, user) => {
    const usersCollection = db.collection('users');
    const { _id, ...updates } = user;
    await usersCollection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: { ...updates, updatedAt: new Date() } }
    );
};

export { createUserInDb, updateUserInDb }