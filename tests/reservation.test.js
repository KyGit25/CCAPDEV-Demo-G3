const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Reservation = require('../models/Reservation');

// Import app after setting up test environment
let app;

describe('Reservation Routes', () => {
  let mongoServer;
  let testStudent;
  let testTechnician;
  let testLab;
  let studentAgent;
  let technicianAgent;

  beforeAll(async () => {
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // Import app after database setup
    app = require('../app');
  });

  beforeEach(async () => {
    await User.deleteMany();
    await Lab.deleteMany();
    await Reservation.deleteMany();

    testStudent = await User.create({
      email: 'student@dlsu.edu.ph',
      password: 'password123',
      role: 'student',
      description: 'Test student'
    });

    testTechnician = await User.create({
      email: 'tech@dlsu.edu.ph',
      password: 'techpass123',
      role: 'technician',
      description: 'Test technician'
    });

    testLab = await Lab.create({
      name: 'Test Lab',
      description: 'Test laboratory',
      seats: [1, 2, 3, 4, 5]
    });

    studentAgent = request.agent(app);
    await studentAgent
      .post('/auth/login')
      .send({
        email: 'student@dlsu.edu.ph',
        password: 'password123'
      });

    technicianAgent = request.agent(app);
    await technicianAgent
      .post('/auth/login')
      .send({
        email: 'tech@dlsu.edu.ph',
        password: 'techpass123'
      });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /reservation/reserve', () => {
    test('Should allow student to create reservation', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await studentAgent
        .post('/reservation/reserve')
        .send({
          labId: testLab._id.toString(),
          selectedDate: dateString,
          selectedTime: '09:00',
          selectedSeats: '1,2',
          isAnonymous: false
        });

      expect(response.status).toBe(302); 
    });

    test('Should reject reservation from technician', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await technicianAgent
        .post('/reservation/reserve')
        .send({
          labId: testLab._id.toString(),
          selectedDate: dateString,
          selectedTime: '09:00',
          selectedSeats: '1,2'
        });

      expect(response.status).toBe(403);
    });

    test('Should reject reservation with missing fields', async () => {
      const response = await studentAgent
        .post('/reservation/reserve')
        .send({
          labId: testLab._id.toString(),
          selectedTime: '09:00'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /reservation/reserve-for-student', () => {
    test('Should allow technician to create reservation for student', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await technicianAgent
        .post('/reservation/reserve-for-student')
        .send({
          studentEmail: 'student@dlsu.edu.ph',
          labId: testLab._id.toString(),
          selectedDate: dateString,
          selectedTime: '09:00',
          selectedSeats: '1,2'
        });

      expect(response.status).toBe(200); 
      expect(response.body.success).toBe(true);
    });

    test('Should reject reservation from student', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await studentAgent
        .post('/reservation/reserve-for-student')
        .send({
          studentEmail: 'student@dlsu.edu.ph',
          labId: testLab._id.toString(),
          selectedDate: dateString,
          selectedTime: '09:00',
          selectedSeats: '1,2'
        });

      expect(response.status).toBe(403);
    });

    test('Should reject reservation for non-existent student', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      const response = await technicianAgent
        .post('/reservation/reserve-for-student')
        .send({
          studentEmail: 'nonexistent@dlsu.edu.ph',
          labId: testLab._id.toString(),
          selectedDate: dateString,
          selectedTime: '09:00',
          selectedSeats: '1,2'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /reservation/my', () => {
    test('Should allow student to view their reservations', async () => {
      const response = await studentAgent.get('/reservation/my');
      expect(response.status).toBe(200);
    });

    test('Should reject technician from viewing student reservations', async () => {
      const response = await technicianAgent.get('/reservation/my');
      expect(response.status).toBe(403);
    });
  });

  describe('GET /reservation/all', () => {
    test('Should allow technician to view all reservations', async () => {
      const response = await technicianAgent.get('/reservation/all');
      expect(response.status).toBe(200);
    });

    test('Should reject student from viewing all reservations', async () => {
      const response = await studentAgent.get('/reservation/all');
      expect(response.status).toBe(403);
    });
  });
});
