const router = require('express').Router();
const ctrl = require('../controllers/invitationsController');
const { authenticate, authorize } = require('../middleware/auth');

// φοιτητής: προσθέτει μέλη
router.post('/', authenticate, authorize('student'), ctrl.create);

// διδάσκων: λίστα ενεργών προσκλήσεων + accept/decline
router.get('/mine', authenticate, authorize('faculty'), ctrl.listMine);
router.post('/:id/accept', authenticate, authorize('faculty'), ctrl.accept);
router.post('/:id/decline', authenticate, authorize('faculty'), ctrl.decline);

module.exports = router;