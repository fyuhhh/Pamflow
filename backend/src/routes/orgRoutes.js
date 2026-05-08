const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');

// Companies
router.get('/companies', orgController.getCompanies);
router.post('/companies', orgController.createCompany);
router.get('/companies/:id', orgController.getCompany);
router.put('/companies/:id', orgController.updateCompany);
router.delete('/companies/:id', orgController.removeCompany);

// Departments
router.get('/departments', orgController.getDepartments);
router.post('/departments', orgController.createDepartment);
router.get('/departments/:id', orgController.getDepartment);
router.put('/departments/:id', orgController.updateDepartment);
router.delete('/departments/:id', orgController.removeDepartment);

// Organization
router.get('/organization/:orgId', orgController.getOrganizationDetails);

module.exports = router;
