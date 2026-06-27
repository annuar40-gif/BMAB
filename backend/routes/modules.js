const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// List all modules with user progress
router.get('/', authenticateToken, (req, res) => {
  const modules = db.prepare('SELECT * FROM modules ORDER BY created_at DESC').all();
  const userId = req.user.id;
  const withProgress = modules.map(m => {
    const progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?').get(userId, m.id);
    const slideCount = db.prepare('SELECT COUNT(*) as count FROM slides WHERE module_id = ?').get(m.id).count;
    const questionCount = db.prepare('SELECT COUNT(*) as count FROM questions WHERE module_id = ?').get(m.id).count;
    const cert = db.prepare('SELECT * FROM certificates WHERE user_id = ? AND module_id = ?').get(userId, m.id);
    return { ...m, progress: progress || null, slideCount, questionCount, hasCertificate: !!cert };
  });
  res.json(withProgress);
});

// Get single module with slides and questions
router.get('/:id', authenticateToken, (req, res) => {
  const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
  if (!module) return res.status(404).json({ error: 'Module not found' });

  const slides = db.prepare('SELECT * FROM slides WHERE module_id = ? ORDER BY slide_order').all(module.id);
  const questions = db.prepare('SELECT id, module_id, question, option_a, option_b, option_c, option_d FROM questions WHERE module_id = ?').all(module.id);
  const progress = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?').get(req.user.id, module.id);
  const cert = db.prepare('SELECT * FROM certificates WHERE user_id = ? AND module_id = ?').get(req.user.id, module.id);

  res.json({ ...module, slides, questions, progress: progress || null, certificate: cert || null });
});

// Update slide progress
router.post('/:id/progress', authenticateToken, (req, res) => {
  const { slidesCompleted } = req.body;
  const userId = req.user.id;
  const moduleId = parseInt(req.params.id);

  db.prepare(`
    INSERT INTO user_progress (user_id, module_id, slides_completed)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, module_id) DO UPDATE SET slides_completed = MAX(slides_completed, excluded.slides_completed)
  `).run(userId, moduleId, slidesCompleted);

  res.json({ success: true });
});

// Submit quiz
router.post('/:id/quiz', authenticateToken, (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;
  const moduleId = parseInt(req.params.id);

  const module = db.prepare('SELECT * FROM modules WHERE id = ?').get(moduleId);
  if (!module) return res.status(404).json({ error: 'Module not found' });

  const questions = db.prepare('SELECT * FROM questions WHERE module_id = ?').all(moduleId);
  if (questions.length === 0) return res.status(400).json({ error: 'No questions available' });

  let correct = 0;
  const results = questions.map(q => {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.correct_answer;
    if (isCorrect) correct++;
    return { questionId: q.id, userAnswer, correctAnswer: q.correct_answer, isCorrect };
  });

  const score = Math.round((correct / questions.length) * 100);
  const passed = score >= module.pass_score;

  const existing = db.prepare('SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?').get(userId, moduleId);
  const attempts = (existing?.quiz_attempts || 0) + 1;

  db.prepare(`
    INSERT INTO user_progress (user_id, module_id, quiz_score, quiz_passed, quiz_attempts, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, module_id) DO UPDATE SET
      quiz_score = CASE WHEN excluded.quiz_score > quiz_score THEN excluded.quiz_score ELSE quiz_score END,
      quiz_passed = quiz_passed OR excluded.quiz_passed,
      quiz_attempts = excluded.quiz_attempts,
      completed_at = CASE WHEN excluded.quiz_passed THEN excluded.completed_at ELSE completed_at END
  `).run(userId, moduleId, score, passed ? 1 : 0, attempts, passed ? new Date().toISOString() : null);

  let certificate = null;
  if (passed) {
    const existingCert = db.prepare('SELECT * FROM certificates WHERE user_id = ? AND module_id = ?').get(userId, moduleId);
    if (!existingCert) {
      const certId = `CERT-${Date.now()}-${userId}-${moduleId}`;
      db.prepare('INSERT OR IGNORE INTO certificates (user_id, module_id, certificate_id) VALUES (?, ?, ?)').run(userId, moduleId, certId);
      certificate = db.prepare('SELECT * FROM certificates WHERE user_id = ? AND module_id = ?').get(userId, moduleId);
    } else {
      certificate = existingCert;
    }
  }

  res.json({ score, passed, correct, total: questions.length, results, certificate });
});

module.exports = router;
