const db = require('../db');
const { create } = require('xmlbuilder2');

exports.announcements = async (req, res, next) => {
  try {
    const { from, to, format } = req.query; // YYYY-MM-DD
    let sql = `SELECT pa.id,
                      COALESCE(pa.title, tp.title) AS title,
                      pa.scheduled_at, pa.location, pa.link
               FROM presentation_announcements pa
               JOIN theses t  ON t.id = pa.thesis_id
               LEFT JOIN thesis_topics tp ON tp.id = t.topic_id
               WHERE 1=1`;
    const params = [];
    if (from) { sql += ' AND pa.scheduled_at >= ?'; params.push(from); }
    if (to)   { sql += ' AND pa.scheduled_at < DATE_ADD(?, INTERVAL 1 DAY)'; params.push(to); }
    sql += ' ORDER BY pa.scheduled_at DESC';
    const [rows] = await db.query(sql, params);

    if (String(format).toLowerCase() === 'xml') {
      const root = { feed: { announcement: rows.map(r => ({
        id: r.id, title: r.title, scheduled_at: r.scheduled_at, location: r.location, link: r.link
      })) } };
      const xml = create(root).end({ prettyPrint: true });
      res.type('application/xml').send(xml);
      return;
    }
    res.json(rows);
  } catch (e) { next(e); }
};
