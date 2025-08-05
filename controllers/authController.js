const User = require('../models/User');
const { logError } = require('../middleware/auth');

exports.getLogin = (req, res) => {
  res.render('auth/login', { 
    title: 'Login',
    isAuth: true 
  });
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { 
    title: 'Register',
    isAuth: true 
  });
};

exports.postRegister = async (req, res) => {
  try {
    const { email, password, confirmPassword, role, description } = req.body;

    if (!email || !password || !role) {
      return res.render('auth/register', {
        title: 'Register',
        isAuth: true,
        error: 'Please fill in all required fields'
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Register',
        isAuth: true,
        error: 'Password must be at least 6 characters long'
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register',
        isAuth: true,
        error: 'Passwords do not match'
      });
    }

    if (!email.endsWith('@dlsu.edu.ph')) {
      return res.render('auth/register', {
        title: 'Register',
        isAuth: true,
        error: 'Please use a valid DLSU email address'
      });
    }

    if (role === 'technician') {
      return res.render('auth/register', {
        title: 'Register',
        isAuth: true,
        error: 'Technician accounts must be created by administrators'
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.render('auth/register', {
        title: 'Register',
        isAuth: true,
        error: 'Email already registered'
      });
    }

    const user = new User({ 
      email: email.toLowerCase().trim(), 
      password, 
      role: 'student', 
      description 
    });
    await user.save();

    req.session.userId = user._id;
    req.session.role = user.role;

    res.redirect('/dashboard');
  } catch (err) {
    await logError(err, req, 'high');
    res.render('auth/register', {
      title: 'Register',
      isAuth: true,
      error: 'Server error during registration'
    });
  }
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    if (!email || !password) {
      return res.render('auth/login', {
        title: 'Login',
        isAuth: true,
        error: 'Please fill in all fields'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.render('auth/login', {
        title: 'Login',
        isAuth: true,
        error: 'Invalid credentials'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    req.session.userId = user._id;
    req.session.role = user.role;

    if (remember) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 21; 
    }

    res.redirect('/dashboard');
  } catch (err) {
    await logError(err, req, 'medium');
    res.render('auth/login', {
      title: 'Login',
      isAuth: true,
      error: 'Login error'
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};
