const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/niveaux
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { filiere_id } = req.query;

  let query = `
    SELECT n.*, f.libelle as filiere_libelle, f.code as filiere_code, f.type as filiere_type
    FROM niveaux n
    LEFT JOIN filieres f ON f.id = n.filiere_id
  `;
  const params = [];

  if (filiere_id) {
    query += ' WHERE n.filiere_id = ?';
    params.push(filiere_id);
  }

  query += ' ORDER BY f.libelle, n.code';

  const niveaux = db.prepare(query).all(...params);
  res.json(niveaux);
});

// GET /api/niveaux/:id
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const niveau = db.prepare(`
    SELECT n.*, f.libelle as filiere_libelle
    FROM niveaux n
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE n.id = ?
  `).get(req.params.id);
  if (!niveau) return res.status(404).json({ message: 'Niveau non trouvé' });
  res.json(niveau);
});

// POST /api/niveaux
router.post('/', authenticateToken, (req, res) => {
  const { code, libelle, filiere_id } = req.body;
  if (!code || !libelle) return res.status(400).json({ message: 'Code et libellé requis' });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO niveaux (code, libelle, filiere_id) VALUES (?, ?, ?)'
  ).run(code, libelle, filiere_id || null);

  const newNiveau = db.prepare(`
    SELECT n.*, f.libelle as filiere_libelle
    FROM niveaux n
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE n.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(newNiveau);
});

// PUT /api/niveaux/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { code, libelle, filiere_id } = req.body;
  const db = getDb();

  const niveau = db.prepare('SELECT * FROM niveaux WHERE id = ?').get(req.params.id);
  if (!niveau) return res.status(404).json({ message: 'Niveau non trouvé' });

  db.prepare('UPDATE niveaux SET code = ?, libelle = ?, filiere_id = ? WHERE id = ?')
    .run(code, libelle, filiere_id || null, req.params.id);

  const updated = db.prepare(`
    SELECT n.*, f.libelle as filiere_libelle
    FROM niveaux n
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE n.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/niveaux/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const niveau = db.prepare('SELECT * FROM niveaux WHERE id = ?').get(req.params.id);
  if (!niveau) return res.status(404).json({ message: 'Niveau non trouvé' });

  const classes = db.prepare('SELECT id FROM classes WHERE niveau_id = ?').all(req.params.id);
  if (classes.length > 0) {
    return res.status(400).json({ message: 'Impossible de supprimer: des classes sont associées à ce niveau' });
  }

  db.prepare('DELETE FROM niveaux WHERE id = ?').run(req.params.id);
  res.json({ message: 'Niveau supprimé' });
});

module.exports = router;
