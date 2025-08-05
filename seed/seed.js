const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Reservation = require('../models/Reservation');

const MONGO_URI = 'mongodb://localhost:27017/lab_reservation';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany();
    await Lab.deleteMany();
    await Reservation.deleteMany();

    const saltRounds = 12;
    const hashedPassword1 = await bcrypt.hash('password1', saltRounds);
    const hashedPassword2 = await bcrypt.hash('password2', saltRounds);
    const hashedPassword3 = await bcrypt.hash('password3', saltRounds);
    const hashedTechPass1 = await bcrypt.hash('techpass1', saltRounds);
    const hashedTechPass2 = await bcrypt.hash('techpass2', saltRounds);

    const users = await User.insertMany([
      {
        email: 'alice@dlsu.edu.ph',
        password: hashedPassword1,
        role: 'student',
        description: 'Computer Science student',
      },
      {
        email: 'bob@dlsu.edu.ph',
        password: hashedPassword2,
        role: 'student',
        description: 'Information Systems major',
      },
      {
        email: 'carol@dlsu.edu.ph',
        password: hashedPassword3,
        role: 'student',
        description: 'IT Enthusiast',
      },
      {
        email: 'dave@dlsu.edu.ph',
        password: hashedTechPass1,
        role: 'technician',
        description: 'Lab Technician for Lab A',
      },
      {
        email: 'eve@dlsu.edu.ph',
        password: hashedTechPass2,
        role: 'technician',
        description: 'Lab Manager',
      }
    ]);

    const labs = await Lab.insertMany([
      {
        name: 'Lab A',
        description: 'Main CS Lab',
        seats: [1, 2, 3, 4, 5]
      },
      {
        name: 'Lab B',
        description: 'IS Lab',
        seats: [1, 2, 3, 4, 5]
      },
      {
        name: 'Lab C',
        description: 'Shared Lab',
        seats: [1, 2, 3, 4, 5]
      }
    ]);

    const now = new Date();
    const slotDuration = 30 * 60 * 1000;

    await Reservation.insertMany([
      {
        user: users[0]._id,
        lab: labs[0]._id,
        seatNumber: 1,
        startTime: new Date(now.getTime() + slotDuration),
        endTime: new Date(now.getTime() + 2 * slotDuration),
        isAnonymous: false
      },
      {
        user: users[1]._id,
        lab: labs[0]._id,
        seatNumber: 2,
        startTime: new Date(now.getTime() + 2 * slotDuration),
        endTime: new Date(now.getTime() + 3 * slotDuration),
        isAnonymous: true
      },
      {
        user: users[2]._id,
        lab: labs[1]._id,
        seatNumber: 1,
        startTime: new Date(now.getTime() + 3 * slotDuration),
        endTime: new Date(now.getTime() + 4 * slotDuration)
      },
      {
        user: users[0]._id,
        lab: labs[2]._id,
        seatNumber: 3,
        startTime: new Date(now.getTime() + 4 * slotDuration),
        endTime: new Date(now.getTime() + 5 * slotDuration)
      },
      {
        user: users[1]._id,
        lab: labs[2]._id,
        seatNumber: 5,
        startTime: new Date(now.getTime() + 6 * slotDuration),
        endTime: new Date(now.getTime() + 7 * slotDuration)
      }
    ]);

    console.log('Database seeded!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding error:', err);
    mongoose.connection.close();
  }
}

seed();
