import express from 'express';
import passport from 'passport';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import { createUserInDb, findUserByEmail, updateUserInDb } from '../controllers/users.mjs';

const authRouter = express.Router();

authRouter.get('/login', (req, res) => {
    const errorMessage = req.flash('error');
    res.render('auth/login', {
        title: 'Вхід',
        theme: req.cookies.theme || 'light',
        errorMessage: errorMessage.length ? errorMessage[0] : null
    });
});


authRouter.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true
    })
);

authRouter.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Реєстрація',
        theme: req.cookies.theme || 'light'
    });
});

authRouter.post('/register', async (req, res) => {
    const db = req.app.locals.db;
    if (!db) {
        return res.status(500).send('Server error. DB is not connected');
    }

    const { name, email, password, age } = req.body;

    if (!name || !email || !password) {
        return res.status(400).send('Поля позначені * обов\'язкові для реєстрації.');
    }

    try {
        const existingUser = await findUserByEmail(db, email);
        if (existingUser) {
            return res.status(409).send('Користувач з таким email вже зареєстрований.');
        }
        const newUser = await createUserInDb(db, name, email, password, age)

        req.login(newUser, (err) => {
            if (err) {
                console.error('Registration error:', err);
                return res.status(500).send('Помилка при логіні після реєстрації.');
            }
            res.redirect('/');
        });
    } catch (error) {
        res.status(500).send('Помилка при реєстрації.');
    }
});

authRouter.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/auth/login');
    });
});

authRouter.post('/forgot', async (req, res) => {
    const db = req.app.locals.db;
    if (!db) {
        console.error('Помилка сервера: База даних не підключена в /auth/forgot (POST).');
        return res.status(500).send('Помилка сервера: База даних не підключена.');
    }

    const { email } = req.body;

    if (!email) {
        const theme = req.cookies.theme || 'light';
        return res.render('auth/forgot', { message: 'Будь ласка, введіть Email.', theme });
    }

    try {
        const user = await findUserByEmail(db, email);
        const theme = req.cookies.theme || 'light';

        if (!user) {
            console.log(`Спроба скидання пароля для неіснуючого email: ${email}`);
            return res.render('auth/forgot', { message: 'Якщо цей email зареєстрований, ви отримаєте лист з інструкціями.', theme });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiry = Date.now() + 3600000;

        await updateUserInDb(db, user);

        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });

        const resetLink = `http://localhost:3000/auth/reset/${token}`;

        const info = await transporter.sendMail({
            to: user.email,
            subject: 'Скидання пароля для вашого акаунта',
            html: `<p>Ви запросили скидання пароля. Будь ласка, перейдіть за цим посиланням, щоб скинути пароль:</p>
                   <a href="${resetLink}">${resetLink}</a>
                   <p>Посилання дійсне протягом 1 години.</p>`
        });

        console.log('Попередній перегляд Ethereal Email: ' + nodemailer.getTestMessageUrl(info));
        res.render('auth/forgot', { message: 'Перевірте ваш Email для отримання посилання на скидання пароля.', theme });

    } catch (error) {
        console.error('Помилка при обробці запиту на скидання пароля:', error);
        const theme = req.cookies.theme || 'light';
        res.status(500).render('auth/forgot', { message: 'Виникла помилка при обробці вашого запиту.', theme });
    }
});

authRouter.get('/forgot', (req, res) => {
    const theme = req.cookies.theme || 'light';
    res.render('auth/forgot', { theme, message: null });
});

authRouter.get('/reset/:token', async (req, res) => {
    const db = req.app.locals.db;
    if (!db) { return res.status(500).send('Помилка сервера: База даних не підключена.'); }

    const { token } = req.params;
    const theme = req.cookies.theme || 'light';

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
        return res.render('auth/reset', { message: 'Посилання для скидання пароля недійсне або термін його дії закінчився.', theme, token: null });
    }

    res.render('auth/reset', { token: token, theme, message: null })
});

authRouter.post('/reset/:token', async (req, res) => {
    const db = req.app.locals.db;
    if (!db) { return res.status(500).send('Помилка сервера: База даних не підключена.'); }

    const { token } = req.params;
    const { password } = req.body;
    const theme = req.cookies.theme || 'light';

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
        return res.render('auth/reset', { message: 'Посилання для скидання пароля недійсне або термін його дії закінчився.', theme, token: null });
    }

    if (!password || password.length < 6) {
        return res.render('auth/reset', { message: 'Пароль повинен бути не менше 6 символів.', theme, token });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await updateUserInDb(db, user);

    res.redirect('/auth/login');
});

export default authRouter;