const request = require('supertest');
const app = require('../server');
const taskService = require('../src/services/taskService');

jest.mock('../src/services/taskService');
jest.mock('../src/middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 1, role: 'Super Admin', company_id: 1, orgId: 'PAM' };
  next();
});
jest.mock('../src/services/auditService', () => ({
  logAudit: jest.fn()
}));

describe('Task Controller API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tasks', () => {
    it('should return 200 and list of tasks', async () => {
      taskService.getAllTasks.mockResolvedValue([{ id: 1, nama_tugas: 'Test Task' }]);

      const res = await request(app).get('/api/tasks');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].nama_tugas).toEqual('Test Task');
    });
  });

  describe('POST /api/tasks', () => {
    it('should return 201 and create task successfully', async () => {
      taskService.createTask.mockResolvedValue(1);

      const res = await request(app)
        .post('/api/tasks')
        .send({ nama_tugas: 'New Task', perusahaan: 'PAM' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('Task created successfully');
      expect(res.body.id).toEqual(1);
    });
  });
});
