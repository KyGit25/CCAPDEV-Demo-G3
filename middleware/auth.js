const ErrorLog = require('../models/ErrorLog');

const logError = async (error, req, severity = 'medium') => {
  try {
    const errorLog = new ErrorLog({
      error: error.message || error,
      stack: error.stack,
      route: req.originalUrl,
      method: req.method,
      userId: req.session?.userId,
      userRole: req.session?.role,
      requestBody: req.body,
      requestParams: req.params,
      severity
    });
    
    await errorLog.save();
    console.error(`[${severity.toUpperCase()}] ${error.message || error}`, {
      route: req.originalUrl,
      method: req.method,
      userId: req.session?.userId,
      timestamp: new Date().toISOString()
    });
  } catch (loggingError) {
    console.error('Error logging failed:', loggingError);
  }
};

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).render('auth/login', {
      title: 'Login Required',
      error: 'Please log in to access this page',
      isAuth: true
    });
  }
  next();
};

const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('Authorization check - User ID:', req.session.userId);
    console.log('Authorization check - User Role:', req.session.role);
    console.log('Authorization check - Required Roles:', roles);
    
    if (!req.session.userId) {
      console.log('No user ID - redirecting to login');

      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(401).json({
          error: 'Please log in to access this page'
        });
      }
      return res.status(401).render('auth/login', {
        title: 'Login Required',
        error: 'Please log in to access this page',
        isAuth: true
      });
    }
    
    if (!roles.includes(req.session.role)) {
      console.log('Role check failed - user role not in required roles');

      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(403).json({
          error: 'You do not have permission to access this page'
        });
      }
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page'
      });
    }
    
    console.log('Authorization passed - proceeding to controller');
    next();
  };
};


const requireStudent = requireRole(['student']);

const requireTechnician = requireRole(['technician']);

const requireStudentOrTechnician = requireRole(['student', 'technician']);

const preventDoubleSubmission = (req, res, next) => {
  const key = `${req.session.userId}-${req.originalUrl}-${JSON.stringify(req.body)}`;
  const now = Date.now();
  
  if (!req.session.lastSubmissions) {
    req.session.lastSubmissions = {};
  }
  
  const lastSubmission = req.session.lastSubmissions[key];
  
  if (lastSubmission && (now - lastSubmission) < 3000) { 
    return res.status(429).json({
      error: 'Please wait before submitting again'
    });
  }
  
  req.session.lastSubmissions[key] = now;

  Object.keys(req.session.lastSubmissions).forEach(k => {
    if (now - req.session.lastSubmissions[k] > 60000) {
      delete req.session.lastSubmissions[k];
    }
  });
  
  next();
};

const validateReservationData = (req, res, next) => {
  const { labId, selectedDate, selectedTime, selectedSeats } = req.body;
  
  if (!labId || !selectedDate || !selectedTime || !selectedSeats) {
    return res.status(400).json({
      error: 'Missing required fields: labId, selectedDate, selectedTime, selectedSeats'
    });
  }

  const reservationDate = new Date(selectedDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (reservationDate < today) {
    return res.status(400).json({
      error: 'Cannot make reservations for past dates'
    });
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(selectedTime)) {
    return res.status(400).json({
      error: 'Invalid time format'
    });
  }

  try {
    const seatNumbers = selectedSeats.split(',').map(Number);
    if (seatNumbers.some(isNaN) || seatNumbers.length === 0) {
      return res.status(400).json({
        error: 'Invalid seat numbers'
      });
    }
  } catch (error) {
    return res.status(400).json({
      error: 'Invalid seat format'
    });
  }
  
  next();
};

module.exports = {
  logError,
  requireAuth,
  requireRole,
  requireStudent,
  requireTechnician,
  requireStudentOrTechnician,
  preventDoubleSubmission,
  validateReservationData
};
