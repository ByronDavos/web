const db = require('../db');

exports.mine = async (req, res, next) => {
  try {
    const id = req.user.id;

    const [[{ avg_days_supervisor }]] = await db.query(
      `SELECT AVG(TIMESTAMPDIFF(DAY, started_at, completed_at)) AS avg_days_supervisor
       FROM theses WHERE supervisor_id=? AND completed_at IS NOT NULL`, [id]);

    const [[{ avg_grade_supervisor }]] = await db.query(
      `SELECT AVG(g.overall) AS avg_grade_supervisor
       FROM grades g JOIN theses t ON t.id=g.thesis_id WHERE t.supervisor_id=?`, [id]);

    const [[{ total_supervised }]] = await db.query(
      `SELECT COUNT(*) AS total_supervised FROM theses WHERE supervisor_id=?`, [id]);

    const [[{ avg_days_member }]] = await db.query(
      `SELECT AVG(TIMESTAMPDIFF(DAY, t.started_at, t.completed_at)) AS avg_days_member
       FROM theses t JOIN committee_members cm ON cm.thesis_id=t.id
       WHERE cm.faculty_id=? AND t.completed_at IS NOT NULL`, [id]);

    const [[{ avg_grade_member }]] = await db.query(
      `SELECT AVG(g.overall) AS avg_grade_member
       FROM grades g JOIN committee_members cm ON cm.thesis_id=g.thesis_id
       WHERE cm.faculty_id=?`, [id]);

    const [[{ total_member }]] = await db.query(
      `SELECT COUNT(*) AS total_member FROM committee_members WHERE faculty_id=?`, [id]);

    res.json({
      avg_days_supervisor: Number(avg_days_supervisor) || 0,
      avg_grade_supervisor: Number(avg_grade_supervisor) || 0,
      total_supervised: Number(total_supervised) || 0,
      avg_days_member: Number(avg_days_member) || 0,
      avg_grade_member: Number(avg_grade_member) || 0,
      total_member: Number(total_member) || 0
    });
  } catch (e) { next(e); }
};
