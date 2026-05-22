const express = require('express');
const router = express.Router();

const pureAssetCtrl = require('../controllers/pureAssetController');
const pureAssetMasterCtrl = require('../controllers/pureAssetMasterController');
const { checkPermission } = require('../middleware/permissionMiddleware');

// MASTER DATA
// Categories
router.get('/categories', checkPermission('pure_asset_master', 'Lihat'), pureAssetMasterCtrl.getCategories);
router.post('/categories', checkPermission('pure_asset_master', 'Buat'), pureAssetMasterCtrl.createCategory);
router.put('/categories/:id', checkPermission('pure_asset_master', 'Edit'), pureAssetMasterCtrl.updateCategory);
router.delete('/categories/:id', checkPermission('pure_asset_master', 'Hapus'), pureAssetMasterCtrl.deleteCategory);

// Locations
router.get('/locations', checkPermission('pure_asset_master', 'Lihat'), pureAssetMasterCtrl.getLocations);
router.post('/locations', checkPermission('pure_asset_master', 'Buat'), pureAssetMasterCtrl.createLocation);
router.put('/locations/:id', checkPermission('pure_asset_master', 'Edit'), pureAssetMasterCtrl.updateLocation);
router.delete('/locations/:id', checkPermission('pure_asset_master', 'Hapus'), pureAssetMasterCtrl.deleteLocation);

// Vendors
router.get('/vendors', checkPermission('pure_asset_master', 'Lihat'), pureAssetMasterCtrl.getVendors);
router.post('/vendors', checkPermission('pure_asset_master', 'Buat'), pureAssetMasterCtrl.createVendor);
router.put('/vendors/:id', checkPermission('pure_asset_master', 'Edit'), pureAssetMasterCtrl.updateVendor);
router.delete('/vendors/:id', checkPermission('pure_asset_master', 'Hapus'), pureAssetMasterCtrl.deleteVendor);

// Conditions
router.get('/conditions', checkPermission('pure_asset_master', 'Lihat'), pureAssetMasterCtrl.getConditions);
router.post('/conditions', checkPermission('pure_asset_master', 'Buat'), pureAssetMasterCtrl.createCondition);
router.put('/conditions/:id', checkPermission('pure_asset_master', 'Edit'), pureAssetMasterCtrl.updateCondition);
router.delete('/conditions/:id', checkPermission('pure_asset_master', 'Hapus'), pureAssetMasterCtrl.deleteCondition);

// Departments
router.get('/departments', checkPermission('pure_asset_master', 'Lihat'), pureAssetMasterCtrl.getDepartments);
router.post('/departments', checkPermission('pure_asset_master', 'Buat'), pureAssetMasterCtrl.createDepartment);
router.put('/departments/:id', checkPermission('pure_asset_master', 'Edit'), pureAssetMasterCtrl.updateDepartment);
router.delete('/departments/:id', checkPermission('pure_asset_master', 'Hapus'), pureAssetMasterCtrl.deleteDepartment);

// Recycle Bin
router.get('/recycle-bin', checkPermission('pure_asset_master', 'Lihat'), pureAssetMasterCtrl.getRecycleBin);
router.post('/recycle-bin/:id/restore', checkPermission('pure_asset_master', 'Edit'), pureAssetMasterCtrl.restoreRecycleItem);
router.delete('/recycle-bin/:id/permanent', checkPermission('pure_asset_master', 'Hapus'), pureAssetMasterCtrl.deleteRecycleItemPermanent);

// ASSETS
router.get('/download-excel', checkPermission('pure_asset_register', 'Lihat'), pureAssetCtrl.downloadExcel);
router.get('/', checkPermission('pure_asset_register', 'Lihat'), pureAssetCtrl.getAssets);
router.post('/', checkPermission('pure_asset_register', 'Buat'), pureAssetCtrl.createAsset);
router.get('/:id', checkPermission('pure_asset_register', 'Lihat'), pureAssetCtrl.getAssetById);
router.put('/:id', checkPermission('pure_asset_register', 'Edit'), pureAssetCtrl.updateAsset);
router.delete('/:id', checkPermission('pure_asset_register', 'Hapus'), pureAssetCtrl.deleteAsset);

module.exports = router;

