import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import getDb from '../../utils/getDb.mjs';
import { findUserByEmail } from '../users/userHelpers.mjs';
import { updateUserInDb } from '../users/userDbController.mjs';

const getForgotPasswordPage = (req, res) => {
    const theme = req.cookies.theme || 'light';
    res.render('auth/forgot.pug', { theme });
}

const postForgotPassword = async (req, res) => {
    const db = getDb(req, res);
    if (!db) return;

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
}

const getResetPasswordPage = async (req, res) => {
    const db = getDb(req, res);
    if (!db) return;

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
}

const postResetPassword = async (req, res) => {
    const db = getDb(req, res);
    if (!db) return;

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
}

export { getForgotPasswordPage, postForgotPassword, getResetPasswordPage, postResetPassword }