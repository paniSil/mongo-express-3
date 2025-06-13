import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import getDb from '../../utils/getDb.mjs';

const postUserHandler = async (req, res) => {
    try {
        const db = getDb(req, res);
        if (!db) return;

        const { name, email, password, age } = req.body;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
            age,
            role: 'admin',
            resetToken: null,
            resetTokenExpiry: null
        };

        const usersCollection = db.collection('users');
        const result = await usersCollection.insertOne(newUser);

        res.status(201).json({ message: 'User created!', userId: result.insertedId, user: { _id: result.insertedId, name, email, age, role: 'admin' } });
    } catch (error) {
        console.error('Error: post user error', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const getUserByIdHandler = async (req, res) => {
    try {
        const db = getDb(req, res);
        if (!db) return;

        const userId = req.params.id;
        const usersCollection = db.collection('users');

        const userProfile = await usersCollection.findOne({ _id: new ObjectId(userId) });
        const theme = req.cookies.theme || 'light';

        if (userProfile) {
            res.render('user-profile.pug', { userProfile: userProfile, theme: theme, user: req.user });
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error('Error: get user by ID error', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const putUserByIdHandler = async (req, res) => {
    try {
        const db = getDb(req, res);
        if (!db) return;

        const userId = req.params.id;
        const { name, email, age } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (age) updates.age = age;

        updates.updatedAt = new Date();

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No update data' });
        }

        const usersCollection = db.collection('users');
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updates }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
        res.status(200).json({ message: `User ${userId} is updated`, user: updatedUser });
    } catch (error) {
        console.error('Error: put user by ID error', error);
        res.status(500).json({ message: 'Server error' });
    }
}

const deleteUserByIdHandler = async (req, res) => {

    try {
        const db = getDb(req, res);
        if (!db) return;

        const userId = req.params.id;
        const usersCollection = db.collection('users');

        const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error: delete user by ID error', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export { postUserHandler, getUserByIdHandler, putUserByIdHandler, deleteUserByIdHandler }