import express from 'express';
import passport from 'passport';
import { getLoginPage, getRegisterPage, postRegisterPage } from '../controllers/auth/authPageHandler.mjs';
import { postLogout } from '../controllers/auth/authLogout.mjs';
import { getForgotPasswordPage, postForgotPassword, getResetPasswordPage, postResetPassword } from '../controllers/auth/forgotPasswordHandler.mjs';

const authRouter = express.Router();

authRouter.get('/login', getLoginPage);
authRouter.post('/login',
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true
    })
);

authRouter.get('/register', getRegisterPage);
authRouter.post('/register', postRegisterPage);

authRouter.post('/logout', postLogout);


authRouter.get('/forgot', getForgotPasswordPage)
authRouter.post('/forgot', postForgotPassword);

authRouter.get('/reset/:token', getResetPasswordPage);
authRouter.post('/reset/:token', postResetPassword);

export default authRouter;