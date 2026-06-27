const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticateToken, requireAdmin);

// Dashboard stats
router.get('/stats', (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
  const totalModules = db.prepare('SELECT COUNT(*) as count FROM modules').get().count;
  const totalCertificates = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  const activeUsers = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as count FROM user_progress
    WHERE slides_completed > 0 OR quiz_attempts > 0
  `).get().count;

  const moduleStats = db.prepare(`
    SELECT m.id, m.title,
      COUNT(DISTINCT up.user_id) as enrolled,
      SUM(CASE WHEN up.quiz_passed = 1 THEN 1 ELSE 0 END) as passed,
      AVG(CASE WHEN up.quiz_score IS NOT NULL THEN up.quiz_score END) as avg_score,
      COUNT(c.id) as certificates
    FROM modules m
    LEFT JOIN user_progress up ON m.id = up.module_id
    LEFT JOIN certificates c ON m.id = c.module_id
    GROUP BY m.id, m.title
    ORDER BY m.created_at DESC
  `).all();

  const recentActivity = db.prepare(`
    SELECT u.name, u.email, m.title as module_title,
      up.quiz_score, up.quiz_passed, up.completed_at, up.quiz_attempts
    FROM user_progress up
    JOIN users u ON up.user_id = u.id
    JOIN modules m ON up.module_id = m.id
    WHERE up.quiz_attempts > 0
    ORDER BY up.completed_at DESC NULLS LAST
    LIMIT 10
  `).all();

  const userProgress = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at,
      COUNT(up.module_id) as modules_started,
      SUM(CASE WHEN up.quiz_passed = 1 THEN 1 ELSE 0 END) as modules_passed,
      COUNT(c.id) as certificates
    FROM users u
    LEFT JOIN user_progress up ON u.id = up.user_id
    LEFT JOIN certificates c ON u.id = c.user_id
    WHERE u.role = 'user'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();

  res.json({ totalUsers, totalModules, totalCertificates, activeUsers, moduleStats, recentActivity, userProgress });
});

// Create module
router.post('/modules', upload.single('thumbnail'), (req, res) => {
  const { title, description, pass_score } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const thumbnail = req.file ? `/uploads/${req.file.filename}` : null;
  const result = db.prepare(
    'INSERT INTO modules (title, description, thumbnail, pass_score) VALUES (?, ?, ?, ?)'
  ).run(title, description || null, thumbnail, parseInt(pass_score) || 70);

  res.json(db.prepare('SELECT * FROM modules WHERE id = ?').get(result.lastInsertRowid));
});

// Update module
router.put('/modules/:id', upload.single('thumbnail'), (req, res) => {
  const { title, description, pass_score } = req.body;
  const existing = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Module not found' });

  const thumbnail = req.file ? `/uploads/${req.file.filename}` : existing.thumbnail;
  db.prepare(
    'UPDATE modules SET title=?, description=?, thumbnail=?, pass_score=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(title || existing.title, description ?? existing.description, thumbnail, parseInt(pass_score) || existing.pass_score, req.params.id);

  res.json(db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id));
});

// Delete module
router.delete('/modules/:id', (req, res) => {
  db.prepare('DELETE FROM modules WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Add slide
router.post('/modules/:id/slides', upload.single('image'), (req, res) => {
  const { title, content, slide_order } = req.body;
  const moduleId = req.params.id;

  const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(moduleId);
  if (!module) return res.status(404).json({ error: 'Module not found' });

  const maxOrder = db.prepare('SELECT MAX(slide_order) as max FROM slides WHERE module_id = ?').get(moduleId);
  const order = slide_order !== undefined ? parseInt(slide_order) : (maxOrder.max || 0) + 1;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const result = db.prepare(
    'INSERT INTO slides (module_id, title, content, image_url, slide_order) VALUES (?, ?, ?, ?, ?)'
  ).run(moduleId, title || null, content || null, imageUrl, order);

  res.json(db.prepare('SELECT * FROM slides WHERE id = ?').get(result.lastInsertRowid));
});

// Update slide
router.put('/modules/:moduleId/slides/:slideId', upload.single('image'), (req, res) => {
  const { title, content, slide_order } = req.body;
  const existing = db.prepare('SELECT * FROM slides WHERE id = ?').get(req.params.slideId);
  if (!existing) return res.status(404).json({ error: 'Slide not found' });

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.image_url;
  db.prepare('UPDATE slides SET title=?, content=?, image_url=?, slide_order=? WHERE id=?')
    .run(title ?? existing.title, content ?? existing.content, imageUrl, slide_order !== undefined ? parseInt(slide_order) : existing.slide_order, req.params.slideId);

  res.json(db.prepare('SELECT * FROM slides WHERE id = ?').get(req.params.slideId));
});

// Delete slide
router.delete('/modules/:moduleId/slides/:slideId', (req, res) => {
  db.prepare('DELETE FROM slides WHERE id = ?').run(req.params.slideId);
  res.json({ success: true });
});

// Add question
router.post('/modules/:id/questions', (req, res) => {
  const { question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
  if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
    return res.status(400).json({ error: 'All question fields are required' });
  }
  if (!['a', 'b', 'c', 'd'].includes(correct_answer.toLowerCase())) {
    return res.status(400).json({ error: 'correct_answer must be a, b, c, or d' });
  }
  const result = db.prepare(
    'INSERT INTO questions (module_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, question, option_a, option_b, option_c, option_d, correct_answer.toLowerCase());

  res.json(db.prepare('SELECT * FROM questions WHERE id = ?').get(result.lastInsertRowid));
});

// Update question
router.put('/modules/:moduleId/questions/:questionId', (req, res) => {
  const { question, option_a, option_b, option_c, option_d, correct_answer } = req.body;
  const existing = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.questionId);
  if (!existing) return res.status(404).json({ error: 'Question not found' });

  db.prepare('UPDATE questions SET question=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=? WHERE id=?')
    .run(
      question ?? existing.question,
      option_a ?? existing.option_a,
      option_b ?? existing.option_b,
      option_c ?? existing.option_c,
      option_d ?? existing.option_d,
      correct_answer?.toLowerCase() ?? existing.correct_answer,
      req.params.questionId
    );

  res.json(db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.questionId));
});

// Delete question
router.delete('/modules/:moduleId/questions/:questionId', (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.questionId);
  res.json({ success: true });
});

// Get module with all content (admin view with answers)
router.get('/modules/:id', (req, res) => {
  const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!module) return res.status(404).json({ error: 'Module not found' });

  const slides = db.prepare('SELECT * FROM slides WHERE module_id = ? ORDER BY slide_order').all(module.id);
  const questions = db.prepare('SELECT * FROM questions WHERE module_id = ?').all(module.id);

  res.json({ ...module, slides, questions });
});

// List all modules (admin)
router.get('/modules', (req, res) => {
  const modules = db.prepare('SELECT * FROM modules ORDER BY created_at DESC').all();
  const enriched = modules.map(m => ({
    ...m,
    slideCount: db.prepare('SELECT COUNT(*) as count FROM slides WHERE module_id = ?').get(m.id).count,
    questionCount: db.prepare('SELECT COUNT(*) as count FROM questions WHERE module_id = ?').get(m.id).count,
  }));
  res.json(enriched);
});

module.exports = router;
