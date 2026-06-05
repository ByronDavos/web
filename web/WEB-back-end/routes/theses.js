const router = require('express').Router();
const ctrl = require('../controllers/thesesController');
const { authenticate, authorize } = require('../middleware/auth');

// Διδάσκων: αρχική ανάθεση
router.post('/assign', authenticate, authorize('faculty'), ctrl.assignToStudent);

// Προβολή ανά χρήστη
router.get('/mine', authenticate, ctrl.listMine);

// Αλλαγές κατάστασης
router.post('/:id/status', authenticate, ctrl.changeStatus);

module.exports = router;

// --- Student actions (review, draft, links, repository) ---
router.post('/:id/review', authenticate, ctrl.setReviewInfo);           // Υπό Εξέταση: δήλωση ημερομηνίας/χώρου/συνδέσμου
router.post('/:id/draft', authenticate, ctrl.attachDraftFile);          // upload μέσω /files/upload -> δίνουμε σχετική διαδρομή
router.post('/:id/links', authenticate, ctrl.addLink);                  // προσθήκη επιπλέον URL
router.get('/:id/links', authenticate, ctrl.listLinks);                 // λίστα URLs
router.post('/:id/repository', authenticate, ctrl.setRepositoryUrl);    // σύνδεσμος Νημερτής

// --- Secretariat actions ---
router.post('/:id/gs', authenticate, authorize('secretariat'), ctrl.setGSDecision);        // καταχώρηση ΑΠ ΓΣ
router.post('/:id/cancel', authenticate, authorize('secretariat','faculty'), ctrl.cancel);  // ακύρωση ανάθεσης (με λόγο)

// --- Complete / Practical (HTML) ---
router.post('/:id/complete', authenticate, authorize('secretariat'), ctrl.completeIfEligible); // Περατωμένη
router.get('/:id/praktiko', authenticate, ctrl.praktikoHtml);                                   // HTML πρακτικό

// --- Export (CSV/JSON) για διδάσκοντα (λίστα διπλωματικών) ---
router.get('/export/mine', authenticate, authorize('faculty'), ctrl.exportMine);
