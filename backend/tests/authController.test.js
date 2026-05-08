const request = require('supertest');
const app = require('../server');
const userService = require('../src/services/userService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../src/services/userService');
jest.mock('bcrypt');
jest.mock('../src/services/auditService', () => ({
  logAudit: jest.fn()
}));

describe('Auth Controller API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  });

  describe('POST /api/login', () => {
    it('should return 401 if user not found', async () => {
      userService.getUserByEmailOrUsername.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/login')
        .send({ orgId: 'PAM', email: 'notfound@test.com', password: 'password', isMobile: false });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Akun tidak ditemukan');
    });

    it('should return 200 and tokens if login successful (Web)', async () => {
      userService.getUserByEmailOrUsername.mockResolvedValue({
        id: 1, orgId: 'PAM', userType: 'admin', role: 'Super Admin', password: 'hashed_password'
      });
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/login')
        .send({ orgId: 'PAM', email: 'admin@test.com', password: 'password', isMobile: false });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/refresh', () => {
    it('should return 400 if no token provided', async () => {
      const res = await request(app)
        .post('/api/refresh')
        .send({});
      
      expect(res.statusCode).toEqual(400);
    });

    it('should return 200 and new access token if refresh token is valid', async () => {
      const validRefreshToken = jwt.sign({ id: 1 }, 'test_refresh_secret');

      const res = await request(app)
        .post('/api/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
