const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/annees
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const annees = db.prepare('SELECT * FROM annees_academiques ORDER BY id DESC').all();
  res.json(annees);
});

// GET /api/annees/:id
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const annee = db.prepare('SELECT * FROM annees_academiques WHERE id = ?').get(req.params.id);
  if (!annee) return res.status(404).json({ message: 'Année académique non trouvée' });
  res.json(annee);
});

// POST /api/annees
router.post('/', authenticateToken, (req, res) => {
  const { libelle, date_debut, date_fin, active } = req.body;
  if (!libelle) return res.status(400).json({ message: 'Libellé requis' });

  const db = getDb();

  // If setting active, deactivate others
  if (active) {
    db.prepare('UPDATE annees_academiques SET active = 0').run();
  }

  const result = db.prepare(
    'INSERT INTO annees_academiques (libelle, date_debut, date_fin, active) VALUES (?, ?, ?, ?)'
  ).run(libelle, date_debut || null, date_fin || null, active ? 1 : 0);

  const newAnnee = db.prepare('SELECT * FROM annees_academiques WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newAnnee);
});

// PUT /api/annees/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { libelle, date_debut, date_fin, active } = req.body;
  const db = getDb();

  const annee = db.prepare('SELECT * FROM annees_academiques WHERE id = ?').get(req.params.id);
  if (!annee) return res.status(404).json({ message: 'Année académique non trouvée' });

  if (active) {
    db.prepare('UPDATE annees_academiques SET active = 0').run();
  }

  db.prepare(
    'UPDATE annees_academiques SET libelle = ?, date_debut = ?, date_fin = ?, active = ? WHERE id = ?'
  ).run(libelle, date_debut || null, date_fin || null, active ? 1 : 0, req.params.id);

  const updated = db.prepare('SELECT * FROM annees_academiques WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/annees/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const annee = db.prepare('SELECT * FROM annees_academiques WHERE id = ?').get(req.params.id);
  if (!annee) return res.status(404).json({ message: 'Année académique non trouvée' });

  db.prepare('DELETE FROM annees_academiques WHERE id = ?').run(req.params.id);
  res.json({ message: 'Année académique supprimée' });
});

// PATCH /api/annees/:id/activate
router.patch('/:id/activate', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE annees_academiques SET active = 0').run();
  db.prepare('UPDATE annees_academiques SET active = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Année activée' });
});

module.exports = router;
