const db = require('../db');
const bcrypt = require('bcrypt');

exports.importUsers = async (req, res, next) => {
try {
const { users } = req.body; // [{role, first_name, last_name, email, phone_mobile, ...}]
if (!Array.isArray(users)) return res.status(400).json({ error: 'users must be array' });
const results = [];
for (const u of users) {
const pass = u.password || Math.random().toString(36).slice(2, 10);
const hash = await bcrypt.hash(pass, 12);
const [r] = await db.query(
`INSERT INTO users (role, first_name, last_name, email, password_hash, phone_mobile, phone_landline, address, user_code)
VALUES (?,?,?,?,?,?,?,?,?)`,
[u.role, u.first_name, u.last_name, u.email, hash, u.phone_mobile||null, u.phone_landline||null, u.address||null, u.user_code||u.email]
);
results.push({ id: r.insertId, email: u.email, password: pass });
}
res.json({ inserted: results.length, results });
} catch (e) { next(e); }
};