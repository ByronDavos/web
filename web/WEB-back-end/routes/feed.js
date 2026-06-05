const router = require('express').Router();
const ctrl = require('../controllers/feedController');
router.get('/announcements', ctrl.announcements);
module.exports = router;