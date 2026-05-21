const express = require('express');
const router = express.Router();

const pureAssetCtrl = require('../controllers/pureAssetController');
const pureAssetMasterCtrl = require('../controllers/pureAssetMasterController');

// MASTER DATA
// Categories
router.get('/categories', pureAssetMasterCtrl.getCategories);
router.post('/categories', pureAssetMasterCtrl.createCategory);
router.put('/categories/:id', pureAssetMasterCtrl.updateCategory);
router.delete('/categories/:id', pureAssetMasterCtrl.deleteCategory);

// Locations
router.get('/locations', pureAssetMasterCtrl.getLocations);
router.post('/locations', pureAssetMasterCtrl.createLocation);
router.put('/locations/:id', pureAssetMasterCtrl.updateLocation);
router.delete('/locations/:id', pureAssetMasterCtrl.deleteLocation);

// Vendors
router.get('/vendors', pureAssetMasterCtrl.getVendors);
router.post('/vendors', pureAssetMasterCtrl.createVendor);
router.put('/vendors/:id', pureAssetMasterCtrl.updateVendor);
router.delete('/vendors/:id', pureAssetMasterCtrl.deleteVendor);

// Conditions
router.get('/conditions', pureAssetMasterCtrl.getConditions);
router.post('/conditions', pureAssetMasterCtrl.createCondition);
router.put('/conditions/:id', pureAssetMasterCtrl.updateCondition);
router.delete('/conditions/:id', pureAssetMasterCtrl.deleteCondition);

// Departments
router.get('/departments', pureAssetMasterCtrl.getDepartments);
router.post('/departments', pureAssetMasterCtrl.createDepartment);
router.put('/departments/:id', pureAssetMasterCtrl.updateDepartment);
router.delete('/departments/:id', pureAssetMasterCtrl.deleteDepartment);

// Recycle Bin
router.get('/recycle-bin', pureAssetMasterCtrl.getRecycleBin);
router.post('/recycle-bin/:id/restore', pureAssetMasterCtrl.restoreRecycleItem);
router.delete('/recycle-bin/:id/permanent', pureAssetMasterCtrl.deleteRecycleItemPermanent);

// ASSETS
router.get('/download-excel', pureAssetCtrl.downloadExcel);
router.get('/', pureAssetCtrl.getAssets);
router.post('/', pureAssetCtrl.createAsset);
router.get('/:id', pureAssetCtrl.getAssetById);
router.put('/:id', pureAssetCtrl.updateAsset);
router.delete('/:id', pureAssetCtrl.deleteAsset);

module.exports = router;
