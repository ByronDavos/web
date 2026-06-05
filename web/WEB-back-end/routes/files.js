const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
destination: (req, file, cb) => {
const dir = file.fieldname === 'draft' ? 'uploads/drafts' : 'uploads/pdf';
cb(null, path.join(__dirname, '..', dir));
},
filename: (req, file, cb) => {
const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
cb(null, name);
}
});
const upload = multer({ storage });

router.post('/upload', authenticate, upload.single('file'), (req, res) => {
const rel = '/uploads/' + (req.file.path.split('uploads/')[1].replace(/\\/g, '/'));
res.json({ path: rel });
});

module.exports = router;