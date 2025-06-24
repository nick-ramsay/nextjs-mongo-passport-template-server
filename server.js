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

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? 'https://nextjs-mongo-passport-template.vercel.app' : 'http://localhost:3000',
  credentials: true
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
    secure: true, // Heroku uses HTTPS
    sameSite: 'none', // <— REQUIRED for cross-origin cookies
    maxAge: 1000 * 60 * 60 * 24,
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport config
require('./config/passport')(passport);

// MongoDB connection
mongoose.connect(currentMongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use(routes);


// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Next.js Mongo Passport Template Backend' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 