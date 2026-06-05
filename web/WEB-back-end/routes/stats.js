const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/statsController');
router.get('/mine', authenticate, authorize('faculty'), ctrl.mine);
module.exports = router;