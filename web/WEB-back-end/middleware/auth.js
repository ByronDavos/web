const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
const auth = req.headers.authorization || '';
const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (!token) return res.status(401).json({ error: 'Missing token' });
try {
const payload = jwt.verify(token, process.env.JWT_SECRET);
req.user = payload;
next();
} catch (e) {
return res.status(401).json({ error: 'Invalid token' });
}
}

function authorize(...roles) {
return (req, res, next) => {
if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
next();
};
}

module.exports = { authenticate, authorize };