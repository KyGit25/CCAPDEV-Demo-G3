const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Reservation = require('../models/Reservation');

let app;

describe('User Routes', () => {
  let mongoServer;
  let testStudent;
  let testTechnician;
  let otherStudent;
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

    otherStudent = await User.create({
      email: 'other@dlsu.edu.ph',
      password: 'password123',
      role: 'student',
      description: 'Other student'
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

  describe('GET /profile/view', () => {
    test('Should allow authenticated user to view own profile', async () => {
      const response = await studentAgent.get('/profile/view');
      expect(response.status).toBe(200);
      expect(response.text).toContain('student@dlsu.edu.ph');
      expect(response.text).toContain('Test student');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app).get('/profile/view');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /profile/view/:id', () => {
    test('Should allow viewing public profile of other users', async () => {
      const response = await studentAgent.get(`/profile/view/${otherStudent._id}`);
      expect(response.status).toBe(200);
      expect(response.text).toContain('other@dlsu.edu.ph');
      expect(response.text).toContain('Other student');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app).get(`/profile/view/${otherStudent._id}`);
      expect(response.status).toBe(401);
    });

    test('Should handle non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await studentAgent.get(`/profile/view/${fakeId}`);
      expect(response.status).toBe(404);
    });
  });

  describe('GET /profile/edit', () => {
    test('Should allow authenticated user to access edit profile page', async () => {
      const response = await studentAgent.get('/profile/edit');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Edit Profile');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app).get('/profile/edit');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /profile/edit', () => {
    test('Should allow authenticated user to update profile', async () => {
      const response = await studentAgent
        .post('/profile/edit')
        .send({
          description: 'Updated description'
        });
      
      expect(response.status).toBe(302);
      
      const updatedUser = await User.findById(testStudent._id);
      expect(updatedUser.description).toBe('Updated description');
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app)
        .post('/profile/edit')
        .send({
          description: 'Updated description'
        });
      expect(response.status).toBe(401);
    });
  });

  describe('POST /profile/delete', () => {
    test('Should allow authenticated user to delete their account', async () => {
      const response = await studentAgent
        .post('/profile/delete')
        .send();
      
      expect(response.status).toBe(302);
      
      const deletedUser = await User.findById(testStudent._id);
      expect(deletedUser).toBeNull();
    });

    test('Should redirect unauthenticated users to login', async () => {
      const response = await request(app)
        .post('/profile/delete')
        .send();
      expect(response.status).toBe(401);
    });
  });
});
