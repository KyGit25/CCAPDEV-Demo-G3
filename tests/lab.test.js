const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Reservation = require('../models/Reservation');

let app;

describe('Lab Routes', () => {
  let mongoServer;
  let testStudent;
  let testTechnician;
  let testLab;
  let studentAgent;
  let technicianAgent;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
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

  describe('GET /lab/', () => {
    test('Should list labs for authenticated student', async () => {
      const response = await studentAgent.get('/lab/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Test Lab');
    });

    test('Should list labs for authenticated technician', async () => {
      const response = await technicianAgent.get('/lab/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Test Lab');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app).get('/lab/');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /lab/list', () => {
    test('Should list labs for authenticated student', async () => {
      const response = await studentAgent.get('/lab/list');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Test Lab');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app).get('/lab/list');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /lab/:id/availability', () => {
    test('Should show lab availability for authenticated student', async () => {
      const response = await studentAgent.get(`/lab/${testLab._id}/availability`);
      expect(response.status).toBe(200);
      expect(response.text).toContain('Test Lab');
      expect(response.text).toContain('Seat Availability');
    });

    test('Should show lab availability for authenticated technician', async () => {
      const response = await technicianAgent.get(`/lab/${testLab._id}/availability`);
      expect(response.status).toBe(200);
      expect(response.text).toContain('Test Lab');
      expect(response.text).toContain('Seat Availability');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app).get(`/lab/${testLab._id}/availability`);
      expect(response.status).toBe(401);
    });

    test('Should handle non-existent lab ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await studentAgent.get(`/lab/${fakeId}/availability`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /lab/availability/:id', () => {
    test('Should show lab availability for authenticated student (alternative route)', async () => {
      const response = await studentAgent.get(`/lab/availability/${testLab._id}`);
      expect(response.status).toBe(200);
      expect(response.text).toContain('Test Lab');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app).get(`/lab/availability/${testLab._id}`);
      expect(response.status).toBe(401);
    });
  });
});
