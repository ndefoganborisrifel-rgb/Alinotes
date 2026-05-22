const express = require('express');
const { getDb, generateMatriculeEnseignant } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/enseignants
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { search } = req.query;

  let query = `
    SELECT e.*, COUNT(m.id) as nb_matieres
    FROM enseignants e
    LEFT JOIN matieres m ON m.enseignant_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  query += ' GROUP BY e.id ORDER BY e.nom, e.prenom';

  const enseignants = db.prepare(query).all(...params);
  res.json(enseignants);
});

// GET /api/enseignants/:id
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const enseignant = db.prepare('SELECT * FROM enseignants WHERE id = ?').get(req.params.id);
  if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouvé' });
  res.json(enseignant);
});

// POST /api/enseignants
router.post('/', authenticateToken, (req, res) => {
  const { nom, prenom, email, telephone, grade, specialite } = req.body;
  if (!nom || !prenom) return res.status(400).json({ message: 'Nom et prénom requis' });

  const db = getDb();
  const matricule = generateMatriculeEnseignant(db);

  const result = db.prepare(
    'INSERT INTO enseignants (matricule, nom, prenom, email, telephone, grade, specialite) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(matricule, nom, prenom, email || null, telephone || null, grade || null, specialite || null);

  const newEnseignant = db.prepare('SELECT * FROM enseignants WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newEnseignant);
});

// PUT /api/enseignants/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { nom, prenom, email, telephone, grade, specialite } = req.body;
  const db = getDb();

  const enseignant = db.prepare('SELECT * FROM enseignants WHERE id = ?').get(req.params.id);
  if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouvé' });

  db.prepare(
    'UPDATE enseignants SET nom = ?, prenom = ?, email = ?, telephone = ?, grade = ?, specialite = ? WHERE id = ?'
  ).run(nom, prenom, email || null, telephone || null, grade || null, specialite || null, req.params.id);

  const updated = db.prepare('SELECT * FROM enseignants WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/enseignants/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const enseignant = db.prepare('SELECT * FROM enseignants WHERE id = ?').get(req.params.id);
  if (!enseignant) return res.status(404).json({ message: 'Enseignant non trouvé' });

  // Unlink from matieres
  db.prepare('UPDATE matieres SET enseignant_id = NULL WHERE enseignant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM enseignants WHERE id = ?').run(req.params.id);

  res.json({ message: 'Enseignant supprimé' });
});

module.exports = router;
