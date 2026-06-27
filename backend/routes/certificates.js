const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, (req, res) => {
  const certs = db.prepare(`
    SELECT c.*, m.title as module_title, u.name as user_name
    FROM certificates c
    JOIN modules m ON c.module_id = m.id
    JOIN users u ON c.user_id = u.id
    WHERE c.user_id = ?
    ORDER BY c.issued_at DESC
  `).all(req.user.id);
  res.json(certs);
});

router.get('/:certId', (req, res) => {
  const cert = db.prepare(`
    SELECT c.*, m.title as module_title, u.name as user_name
    FROM certificates c
    JOIN modules m ON c.module_id = m.id
    JOIN users u ON c.user_id = u.id
    WHERE c.certificate_id = ?
  `).get(req.params.certId);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  res.json(cert);
});

module.exports = router;
