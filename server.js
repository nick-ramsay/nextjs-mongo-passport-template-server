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

app.set('trust proxy', 1);

// Fix for iOS Safari sameSite=none issue
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Detect iOS Safari with the sameSite=none bug (iOS 12.x and some earlier versions)
  const isIosSafariWithBug = /iPhone|iPad|iPod/.test(userAgent) && 
    /Safari/.test(userAgent) && 
    !/CriOS/.test(userAgent) && // Not Chrome on iOS
    (/OS 12_/.test(userAgent) || /OS 11_/.test(userAgent) || /OS 10_/.test(userAgent));
  
  if (isIosSafariWithBug) {
    // For buggy iOS Safari versions, we need to handle cookies differently
    req.skipSameSiteNone = true;
  }
  
  next();
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? 'https://www.nextjs-mongo-passport-template.com' : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For iOS Safari compatibility
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
    sameSite: 'none',
    maxAge: 1000 * 60 * 60 * 24,
  }
}));

// iOS cookie compatibility middleware
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isIos = /iPhone|iPad|iPod/.test(userAgent);
  
  if (isIos) {
    console.log('iOS detected, applying cookie compatibility fix');
    
    // Override res.setHeader to modify Set-Cookie for iOS
    const originalSetHeader = res.setHeader;
    res.setHeader = function(name, value) {
      if (name.toLowerCase() === 'set-cookie') {
        if (Array.isArray(value)) {
          value = value.map(cookie => {
            if (cookie.includes('connect.sid')) {
              // For iOS: remove SameSite=None which causes issues
              return cookie.replace(/;\s*SameSite=None/gi, '');
            }
            return cookie;
          });
        } else if (typeof value === 'string' && value.includes('connect.sid')) {
          value = value.replace(/;\s*SameSite=None/gi, '');
        }
      }
      return originalSetHeader.call(this, name, value);
    };
  }
  
  next();
});

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