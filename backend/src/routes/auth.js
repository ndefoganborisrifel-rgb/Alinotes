const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, nom, prenom, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
  res.json(user);
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
  res.json({ message: 'Mot de passe modifié avec succès' });
});

module.exports = router;
