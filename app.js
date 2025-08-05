const express = require('express');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lab_reservation';

if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState === 0) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

app.engine('hbs', engine({
  defaultLayout: 'main',
  extname: '.hbs',
  partialsDir: path.join(__dirname, 'views/partials'),
  layoutsDir: path.join(__dirname, 'views/layouts'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
  helpers: {
    eq: function (a, b) {
      return a === b;
    },
    formatDate: function (date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    formatTime: function (date) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatDateTime: function (date) {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'lab-reservation-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 1000 * 60 * 60 * 24, 
    httpOnly: true
  }
};

if (process.env.NODE_ENV !== 'test') {
  sessionConfig.store = MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions'
  });
}

app.use(session(sessionConfig));

app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const User = require('./models/User');
      const user = await User.findById(req.session.userId);
      res.locals.user = user ? {
        id: user._id,
        email: user.email,
        role: user.role,
        description: user.description,
        profilePic: user.profilePic
      } : null;
    } catch (err) {
      console.error('Error fetching user:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});


app.get('/', async (req, res) => {
  try {
    const Lab = require('./models/Lab');
    const Reservation = require('./models/Reservation');
    
    const labs = await Lab.find();
    let reservations = [];
    
    if (req.session.userId && req.session.role === 'student') {
      reservations = await Reservation.find({ user: req.session.userId })
        .populate('lab')
        .sort({ startTime: -1 })
        .limit(5);
    }
    
    res.render('dashboard', { 
      title: 'Dashboard',
      labs,
      reservations
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { 
      title: 'Dashboard',
      labs: [],
      reservations: []
    });
  }
});

app.get('/dashboard', async (req, res) => {
  try {
    const Lab = require('./models/Lab');
    const Reservation = require('./models/Reservation');
    
    const labs = await Lab.find();
    let reservations = [];
    
    if (req.session.userId && req.session.role === 'student') {
      reservations = await Reservation.find({ user: req.session.userId })
        .populate('lab')
        .sort({ startTime: -1 })
        .limit(5);
    }
    
    res.render('dashboard', { 
      title: 'Dashboard',
      labs,
      reservations
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { 
      title: 'Dashboard',
      labs: [],
      reservations: []
    });
  }
});

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const labRoutes = require('./routes/lab');
app.use('/lab', requireAuth, labRoutes);

const reservationRoutes = require('./routes/reservation');
app.use('/reservation', requireAuth, reservationRoutes);

const userRoutes = require('./routes/user');
app.use('/profile', requireAuth, userRoutes);

const searchRoutes = require('./routes/search');
app.use('/search', requireAuth, searchRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Server Error',
    message: 'Something went wrong!'
  });
});

app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
