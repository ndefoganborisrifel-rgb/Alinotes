const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/filieres
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const filieres = db.prepare(`
    SELECT f.*, COUNT(n.id) as nb_niveaux
    FROM filieres f
    LEFT JOIN niveaux n ON n.filiere_id = f.id
    GROUP BY f.id
    ORDER BY f.libelle
  `).all();
  res.json(filieres);
});

// GET /api/filieres/:id
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const filiere = db.prepare('SELECT * FROM filieres WHERE id = ?').get(req.params.id);
  if (!filiere) return res.status(404).json({ message: 'Filière non trouvée' });
  res.json(filiere);
});

// POST /api/filieres
router.post('/', authenticateToken, (req, res) => {
  const { code, libelle, type } = req.body;
  if (!code || !libelle) return res.status(400).json({ message: 'Code et libellé requis' });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO filieres (code, libelle, type) VALUES (?, ?, ?)'
  ).run(code, libelle, type || null);

  const newFiliere = db.prepare('SELECT * FROM filieres WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newFiliere);
});

// PUT /api/filieres/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { code, libelle, type } = req.body;
  const db = getDb();

  const filiere = db.prepare('SELECT * FROM filieres WHERE id = ?').get(req.params.id);
  if (!filiere) return res.status(404).json({ message: 'Filière non trouvée' });

  db.prepare('UPDATE filieres SET code = ?, libelle = ?, type = ? WHERE id = ?')
    .run(code, libelle, type || null, req.params.id);

  const updated = db.prepare('SELECT * FROM filieres WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/filieres/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const filiere = db.prepare('SELECT * FROM filieres WHERE id = ?').get(req.params.id);
  if (!filiere) return res.status(404).json({ message: 'Filière non trouvée' });

  // Check if has niveaux
  const niveaux = db.prepare('SELECT id FROM niveaux WHERE filiere_id = ?').all(req.params.id);
  if (niveaux.length > 0) {
    return res.status(400).json({ message: 'Impossible de supprimer: des niveaux sont associés à cette filière' });
  }

  db.prepare('DELETE FROM filieres WHERE id = ?').run(req.params.id);
  res.json({ message: 'Filière supprimée' });
});

module.exports = router;
