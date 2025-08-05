const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const searchController = require('../controllers/searchController');
const { 
  requireStudent, 
  requireTechnician, 
  requireStudentOrTechnician,
  preventDoubleSubmission,
  validateReservationData
} = require('../middleware/auth');

router.get('/reserve/:labId', requireStudentOrTechnician, reservationController.getReserveForm);

router.post('/reserve', 
  requireStudent, 
  preventDoubleSubmission,
  validateReservationData,
  reservationController.createReservation
);

router.get('/my', requireStudent, reservationController.getUserReservations);

router.get('/all', requireTechnician, reservationController.getAllReservations);

router.get('/view/:id', requireStudentOrTechnician, reservationController.viewReservation);

router.get('/edit/:id', requireStudentOrTechnician, reservationController.getEditReservation);
router.post('/edit/:id', requireStudentOrTechnician, reservationController.editReservation);

router.post('/reserve-for-student', 
  requireTechnician,
  reservationController.reserveForStudent
);

router.post('/remove/:id', requireTechnician, reservationController.removeReservation);

router.post('/delete/:id', requireStudentOrTechnician, reservationController.deleteReservation);

router.get('/search', requireStudentOrTechnician, searchController.searchFreeSlots);

module.exports = router;
