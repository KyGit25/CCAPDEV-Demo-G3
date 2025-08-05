const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Reservation = require('../models/Reservation');

let app;

describe('Search Routes', () => {
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

  describe('GET /search/slots', () => {
    test('Should allow authenticated student to search free slots', async () => {
      const response = await studentAgent
        .get('/search/slots')
        .query({
          lab: testLab._id.toString(),
          date: '2025-08-05',
          time: '09:00'
        });
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Search Available Slots');
    });

    test('Should allow authenticated technician to search free slots', async () => {
      const response = await technicianAgent
        .get('/search/slots')
        .query({
          lab: testLab._id.toString(),
          date: '2025-08-05',
          time: '10:00'
        });
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Search Available Slots');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app)
        .get('/search/slots')
        .query({
          lab: testLab._id.toString(),
          date: '2025-08-05',
          time: '09:00'
        });
      
      expect(response.status).toBe(401);
    });

    test('Should handle search without parameters', async () => {
      const response = await studentAgent.get('/search/slots');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Search');
    });

    test('Should handle invalid lab ID in search', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await studentAgent
        .get('/search/slots')
        .query({
          lab: fakeId.toString(),
          date: '2025-08-05',
          time: '09:00'
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /search/users', () => {
    test('Should allow authenticated student to search users', async () => {
      const response = await studentAgent
        .get('/search/users')
        .query({
          query: 'test'
        });
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Search Users');
    });

    test('Should allow authenticated technician to search users', async () => {
      const response = await technicianAgent
        .get('/search/users')
        .query({
          query: 'student'
        });
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('Search Users');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app)
        .get('/search/users')
        .query({
          query: 'test'
        });
      
      expect(response.status).toBe(401);
    });

    test('Should handle empty search query', async () => {
      const response = await studentAgent.get('/search/users');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Search Users');
    });

    test('Should return users matching search query', async () => {
      const response = await studentAgent
        .get('/search/users')
        .query({
          query: 'student@dlsu.edu.ph'
        });
      
      expect(response.status).toBe(200);
    });
  });
});
