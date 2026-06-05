const router = require('express').Router();
const ctrl = require('../controllers/gradesController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/:thesis_id/enable', authenticate, authorize('faculty'), ctrl.enableGrading);
router.post('/:thesis_id/mine', authenticate, authorize('faculty'), ctrl.submitMyGrade);
router.get('/:thesis_id', authenticate, ctrl.getGrades);

module.exports = router;