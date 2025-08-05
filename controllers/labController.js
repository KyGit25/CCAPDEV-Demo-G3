const Lab = require('../models/Lab');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

exports.listLabs = async (req, res) => {
  try {
    const labs = await Lab.find();
    res.render('lab/list', { labs, title: 'Computer Labs' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading labs');
  }
};

exports.getLabAvailability = async (req, res) => {
  try {
    const labId = req.params.id;
    const selectedDate = req.query.date || new Date().toISOString().split('T')[0];
    const selectedTime = req.query.time || '09:00';

    const lab = await Lab.findById(labId);
    if (!lab) return res.status(404).send('Lab not found');

    const timeSlots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push({
          value: timeValue,
          label: `${timeValue} - ${hour === 17 && minute === 30 ? '18:00' : (minute === 30 ? (hour + 1).toString().padStart(2, '0') + ':00' : hour.toString().padStart(2, '0') + ':30')}`,
          selected: timeValue === selectedTime
        });
      }
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const reservations = await Reservation.find({
      lab: labId,
      startTime: { $lte: endTime },
      endTime: { $gte: startTime }
    }).populate('user');

    const occupiedSeats = new Set();
    const seatDetails = new Map();
    
    reservations.forEach(reservation => {
      occupiedSeats.add(reservation.seatNumber);
      seatDetails.set(reservation.seatNumber, {
        reservedBy: reservation.isAnonymous ? 'Anonymous' : reservation.user.email,
        userId: reservation.isAnonymous ? null : reservation.user._id,
        anonymous: reservation.isAnonymous
      });
    });

    const seats = lab.seats.map(seatNumber => ({
      number: seatNumber,
      status: occupiedSeats.has(seatNumber) ? 'occupied' : 'available',
      available: !occupiedSeats.has(seatNumber),
      details: seatDetails.get(seatNumber) || null
    }));

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const selectedTimeLabel = timeSlots.find(slot => slot.value === selectedTime)?.label || selectedTime;

    res.render('lab/availability', {
      lab,
      seats,
      selectedDate,
      selectedTime,
      selectedTimeLabel,
      timeSlots,
      today,
      maxDate: maxDateStr,
      title: `${lab.name} - Availability`
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading availability');
  }
};
