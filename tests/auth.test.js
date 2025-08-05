const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Reservation = require('../models/Reservation');

let app;

describe('Authentication Routes', () => {
  let mongoServer;
  let testUser;
  let testTechnician;

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

    testUser = await User.create({
      email: 'test@dlsu.edu.ph',
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
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /auth/register', () => {
    test('Should register a new student successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newstudent@dlsu.edu.ph',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'student',
          description: 'New student'
        });

      expect(response.status).toBe(302); 
    });

    test('Should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid@gmail.com',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'student'
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('valid DLSU email');
    });

    test('Should reject registration with mismatched passwords', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@dlsu.edu.ph',
          password: 'password123',
          confirmPassword: 'differentpassword',
          role: 'student'
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Passwords do not match');
    });

    test('Should reject technician registration', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'technician@dlsu.edu.ph',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'technician'
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Technician accounts must be created by administrators');
    });
  });

  describe('POST /auth/login', () => {
    test('Should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@dlsu.edu.ph',
          password: 'password123'
        });

      expect(response.status).toBe(302); 
    });

    test('Should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@dlsu.edu.ph',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Invalid credentials');
    });

    test('Should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@dlsu.edu.ph',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Invalid credentials');
    });
  });
});
