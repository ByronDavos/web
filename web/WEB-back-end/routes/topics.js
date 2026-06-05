const router = require('express').Router();
const ctrl = require('../controllers/topicsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('faculty'), ctrl.listMine);
router.post('/', authenticate, authorize('faculty'), ctrl.create);
router.put('/:id', authenticate, authorize('faculty'), ctrl.update);

module.exports = router;