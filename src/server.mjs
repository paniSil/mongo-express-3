import express from 'express'
import router from './routes/index.mjs'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.mjs'
import { logRequests } from './middleware/logRequests.mjs'
import path from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import './middleware/passport.mjs';
import flash from 'connect-flash';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb'
import { initPassport } from './middleware/passport.mjs'

dotenv.config();

const app = express()
const PORT = 3000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uri = process.env.MONGO_URI;
const dbName = 'expressServerTestBase'

const client = new MongoClient(uri)

app.use(express.static('public'))
app.set('views', './src/views')
app.set('view engine', 'pug')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(session({
    secret: process.env.SESSION_SECRET || 'secretsession',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.get('/set-cookie', (req, res) => {
    res.cookie('user', 'john_doe', { maxAge: 900000, httpOnly: true })
    res.send('Cookie встановлено')
})
app.get('/get-cookie', (req, res) => {
    const cookieValue = req.cookies.user
    res.send(`Значення cookie: ${cookieValue}`)
})

app.use(logRequests)
app.use(router)
app.use(notFoundHandler)
app.use(errorHandler)

async function connectToServer() {
    try {
        await client.connect()
        console.log('Successfully connected to MongoDB Atlas')

        const db = client.db(dbName)
        app.locals.db = db;
        initPassport(db);

        app.listen(PORT, () => {
            console.log(`Сервер запущений за адресою http://localhost:${PORT}`)
        })
    } catch (err) {
        console.error('Error while connection to MongoDB Atlas', err)
        process.exit(1);
    }
}

const server = connectToServer()

export { server, app };
