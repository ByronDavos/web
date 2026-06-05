const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/importController');
router.post('/users', authenticate, authorize('secretariat'), ctrl.importUsers);
module.exports = router;