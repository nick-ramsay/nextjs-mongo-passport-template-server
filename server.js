require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const routes = require("./routes")

const app = express();
const PORT = process.env.PORT || 3001;

const currentMongoUri = process.env.NODE_ENV === "production" ? process.env.mongo_uri : 'mongodb://localhost:27017/nextjs-mongo-passport-template';

//Need this for Heroku deployment of Express Session
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? 'https://www.nextjs-mongo-passport-template.com' : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Recommended for legacy browsers: https://expressjs.com/en/resources/middleware/cors.html
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: currentMongoUri }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  }
}));

app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// MongoDB connection
mongoose.connect(currentMongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use(routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 