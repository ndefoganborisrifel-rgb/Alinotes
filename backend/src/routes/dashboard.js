const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();

  const stats = {
    etudiants: db.prepare('SELECT COUNT(*) as count FROM etudiants').get().count,
    enseignants: db.prepare('SELECT COUNT(*) as count FROM enseignants').get().count,
    classes: db.prepare('SELECT COUNT(*) as count FROM classes').get().count,
    filieres: db.prepare('SELECT COUNT(*) as count FROM filieres').get().count,
    matieres: db.prepare('SELECT COUNT(*) as count FROM matieres').get().count,
    inscriptions: db.prepare('SELECT COUNT(*) as count FROM inscriptions').get().count,
  };

  const anneeActive = db.prepare('SELECT * FROM annees_academiques WHERE active = 1').get();

  const recentEtudiants = db.prepare(
    'SELECT matricule, nom, prenom, created_at FROM etudiants ORDER BY id DESC LIMIT 5'
  ).all();

  const classesByNiveau = db.prepare(`
    SELECT n.code as niveau, COUNT(c.id) as nb_classes
    FROM niveaux n
    LEFT JOIN classes c ON c.niveau_id = n.id
    GROUP BY n.id, n.code
    ORDER BY n.code
  `).all();

  res.json({
    stats,
    anneeActive,
    recentEtudiants,
    classesByNiveau
  });
});

module.exports = router;
