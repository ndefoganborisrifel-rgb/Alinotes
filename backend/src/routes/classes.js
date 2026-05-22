const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/classes
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { annee_id, niveau_id } = req.query;

  let query = `
    SELECT c.*,
      n.code as niveau_code, n.libelle as niveau_libelle,
      a.libelle as annee_libelle,
      f.libelle as filiere_libelle,
      (SELECT COUNT(*) FROM inscriptions i WHERE i.classe_id = c.id) as nb_etudiants
    FROM classes c
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    LEFT JOIN annees_academiques a ON a.id = c.annee_id
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE 1=1
  `;
  const params = [];

  if (annee_id) {
    query += ' AND c.annee_id = ?';
    params.push(annee_id);
  }
  if (niveau_id) {
    query += ' AND c.niveau_id = ?';
    params.push(niveau_id);
  }

  query += ' ORDER BY a.libelle DESC, n.code, c.libelle';

  const classes = db.prepare(query).all(...params);
  res.json(classes);
});

// GET /api/classes/:id
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const classe = db.prepare(`
    SELECT c.*,
      n.code as niveau_code, n.libelle as niveau_libelle,
      a.libelle as annee_libelle,
      f.libelle as filiere_libelle
    FROM classes c
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    LEFT JOIN annees_academiques a ON a.id = c.annee_id
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!classe) return res.status(404).json({ message: 'Classe non trouvée' });
  res.json(classe);
});

// GET /api/classes/:id/etudiants
router.get('/:id/etudiants', authenticateToken, (req, res) => {
  const db = getDb();
  const etudiants = db.prepare(`
    SELECT e.*, i.date_inscription
    FROM etudiants e
    JOIN inscriptions i ON i.etudiant_id = e.id
    WHERE i.classe_id = ?
    ORDER BY e.nom, e.prenom
  `).all(req.params.id);
  res.json(etudiants);
});

// POST /api/classes
router.post('/', authenticateToken, (req, res) => {
  const { libelle, niveau_id, annee_id, capacite } = req.body;
  if (!libelle) return res.status(400).json({ message: 'Libellé requis' });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO classes (libelle, niveau_id, annee_id, capacite) VALUES (?, ?, ?, ?)'
  ).run(libelle, niveau_id || null, annee_id || null, capacite || 50);

  const newClasse = db.prepare(`
    SELECT c.*,
      n.code as niveau_code, n.libelle as niveau_libelle,
      a.libelle as annee_libelle,
      f.libelle as filiere_libelle
    FROM classes c
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    LEFT JOIN annees_academiques a ON a.id = c.annee_id
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(newClasse);
});

// PUT /api/classes/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { libelle, niveau_id, annee_id, capacite } = req.body;
  const db = getDb();

  const classe = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!classe) return res.status(404).json({ message: 'Classe non trouvée' });

  db.prepare('UPDATE classes SET libelle = ?, niveau_id = ?, annee_id = ?, capacite = ? WHERE id = ?')
    .run(libelle, niveau_id || null, annee_id || null, capacite || 50, req.params.id);

  const updated = db.prepare(`
    SELECT c.*,
      n.code as niveau_code, n.libelle as niveau_libelle,
      a.libelle as annee_libelle,
      f.libelle as filiere_libelle
    FROM classes c
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    LEFT JOIN annees_academiques a ON a.id = c.annee_id
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE c.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE /api/classes/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const classe = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!classe) return res.status(404).json({ message: 'Classe non trouvée' });

  const inscriptions = db.prepare('SELECT id FROM inscriptions WHERE classe_id = ?').all(req.params.id);
  if (inscriptions.length > 0) {
    return res.status(400).json({ message: 'Impossible de supprimer: des étudiants sont inscrits dans cette classe' });
  }

  db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Classe supprimée' });
});

module.exports = router;
