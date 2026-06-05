const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Βρες χρήστη με αυτό το email
    const [rows] = await db.query('SELECT id, role, first_name, last_name, email, password_hash FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];

    // 2) Έλεγχος κωδικού ΜΕ await (ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ)
    if (!user.password_hash) {
      // αν δεν έχει αποθηκευμένο hash, απόρριψε
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3) Έκδοση JWT
    const payload = {
      id: user.id,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    return res.json({ token, user: payload });
  } catch (err) {
    next(err);
  }
};