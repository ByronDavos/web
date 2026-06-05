const router = require('express').Router();
const ctrl = require('../controllers/notesController');
const { authenticate } = require('../middleware/auth');
router.post('/', authenticate, ctrl.add);
router.get('/:thesis_id/mine', authenticate, ctrl.listMine);
module.exports = router;