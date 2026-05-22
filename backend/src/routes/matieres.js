const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { niveau_id, semestre } = req.query;
  let query = `
    SELECT m.*,
      n.code as niveau_code, n.libelle as niveau_libelle,
      f.libelle as filiere_libelle,
      e.nom as enseignant_nom, e.prenom as enseignant_prenom
    FROM matieres m
    LEFT JOIN niveaux n ON n.id = m.niveau_id
    LEFT JOIN filieres f ON f.id = n.filiere_id
    LEFT JOIN enseignants e ON e.id = m.enseignant_id
    WHERE 1=1
  `;
  const params = [];
  if (niveau_id) { query += ' AND m.niveau_id = ?'; params.push(niveau_id); }
  if (semestre) { query += ' AND m.semestre = ?'; params.push(semestre); }
  query += ' ORDER BY n.code, m.semestre, m.libelle';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const matiere = db.prepare(`
    SELECT m.*,
      n.code as niveau_code, n.libelle as niveau_libelle,
      e.nom as enseignant_nom, e.prenom as enseignant_prenom
    FROM matieres m
    LEFT JOIN niveaux n ON n.id = m.niveau_id
    LEFT JOIN enseignants e ON e.id = m.enseignant_id
    WHERE m.id = ?
  `).get(req.params.id);
  if (!matiere) return res.status(404).json({ message: 'Matière non trouvée' });
  res.json(matiere);
});

router.post('/', authenticateToken, (req, res) => {
  const { code, libelle, coefficient, credit, semestre, type_eval, niveau_id, enseignant_id } = req.body;
  if (!code || !libelle) return res.status(400).json({ message: 'Code et libellé requis' });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO matieres (code, libelle, coefficient, credit, semestre, type_eval, niveau_id, enseignant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(code, libelle, coefficient || 1, credit || 3, semestre || null, type_eval || 'CC+Exam', niveau_id || null, enseignant_id || null);
  const newMatiere = db.prepare(`
    SELECT m.*, n.code as niveau_code, e.nom as enseignant_nom, e.prenom as enseignant_prenom
    FROM matieres m LEFT JOIN niveaux n ON n.id = m.niveau_id LEFT JOIN enseignants e ON e.id = m.enseignant_id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(newMatiere);
});

router.put('/:id', authenticateToken, (req, res) => {
  const { code, libelle, coefficient, credit, semestre, type_eval, niveau_id, enseignant_id } = req.body;
  const db = getDb();
  const matiere = db.prepare('SELECT * FROM matieres WHERE id = ?').get(req.params.id);
  if (!matiere) return res.status(404).json({ message: 'Matière non trouvée' });
  db.prepare('UPDATE matieres SET code=?, libelle=?, coefficient=?, credit=?, semestre=?, type_eval=?, niveau_id=?, enseignant_id=? WHERE id=?')
    .run(code, libelle, coefficient || 1, credit || 3, semestre || null, type_eval || 'CC+Exam', niveau_id || null, enseignant_id || null, req.params.id);
  const updated = db.prepare(`
    SELECT m.*, n.code as niveau_code, e.nom as enseignant_nom, e.prenom as enseignant_prenom
    FROM matieres m LEFT JOIN niveaux n ON n.id = m.niveau_id LEFT JOIN enseignants e ON e.id = m.enseignant_id
    WHERE m.id = ?
  `).get(req.params.id);
  res.json(updated);
});

router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const matiere = db.prepare('SELECT * FROM matieres WHERE id = ?').get(req.params.id);
  if (!matiere) return res.status(404).json({ message: 'Matière non trouvée' });
  const notesCount = db.prepare('SELECT COUNT(*) as count FROM notes WHERE matiere_id = ?').get(req.params.id).count;
  if (notesCount > 0) return res.status(400).json({ message: 'Impossible de supprimer: des notes sont associées à cette matière' });
  db.prepare('DELETE FROM matieres WHERE id = ?').run(req.params.id);
  res.json({ message: 'Matière supprimée' });
});

module.exports = router;
