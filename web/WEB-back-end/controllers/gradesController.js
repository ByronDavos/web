const db = require('../db');
const { required } = require('../middleware/validate');

// Στη δική σου schema δεν υπάρχει grading_enabled, άρα no-op:
exports.enableGrading = async (req, res) => res.json({ ok: true });

exports.submitMyGrade = async (req, res, next) => {
  try {
    const { thesis_id } = req.params;
    required(req.body, ['criteria']); // { criterion_1, criterion_2, criterion_3, total }
    const c = req.body.criteria || {};
    const c1 = Number(c.criterion_1 ?? 0);
    const c2 = Number(c.criterion_2 ?? 0);
    const c3 = Number(c.criterion_3 ?? 0);
    const overall = (c.total !== undefined) ? Number(c.total)
                   : (c.count ? Number(c.sum)/Number(c.count) : (c1 + c2 + c3) / 3);

    await db.query(
      `INSERT INTO grades (thesis_id, grader_id, criterion_1, criterion_2, criterion_3, overall)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         criterion_1=VALUES(criterion_1),
         criterion_2=VALUES(criterion_2),
         criterion_3=VALUES(criterion_3),
         overall=VALUES(overall)`,
      [thesis_id, req.user.id, c1, c2, c3, overall]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.getGrades = async (req, res, next) => {
  try {
    const { thesis_id } = req.params;
    const [rows] = await db.query(
      'SELECT grader_id, overall, criterion_1, criterion_2, criterion_3 FROM grades WHERE thesis_id=?',
      [thesis_id]
    );
    res.json(rows);
  } catch (e) { next(e); }
};