const express = require('express');
const { getDb, generateMatriculeEtudiant } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/etudiants
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { search, classe_id, annee_id } = req.query;

  let query = `
    SELECT e.*,
      i.classe_id, i.annee_id as inscription_annee_id,
      c.libelle as classe_libelle,
      n.code as niveau_code, n.libelle as niveau_libelle,
      f.libelle as filiere_libelle
    FROM etudiants e
    LEFT JOIN inscriptions i ON i.etudiant_id = e.id
    LEFT JOIN classes c ON c.id = i.classe_id
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (classe_id) {
    query += ` AND i.classe_id = ?`;
    params.push(classe_id);
  }
  if (annee_id) {
    query += ` AND i.annee_id = ?`;
    params.push(annee_id);
  }

  query += ' ORDER BY e.nom, e.prenom';

  const etudiants = db.prepare(query).all(...params);
  res.json(etudiants);
});

// GET /api/etudiants/:id
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const etudiant = db.prepare(`
    SELECT e.*,
      i.classe_id, i.annee_id as inscription_annee_id,
      c.libelle as classe_libelle,
      n.code as niveau_code, n.libelle as niveau_libelle,
      f.libelle as filiere_libelle
    FROM etudiants e
    LEFT JOIN inscriptions i ON i.etudiant_id = e.id
    LEFT JOIN classes c ON c.id = i.classe_id
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    LEFT JOIN filieres f ON f.id = n.filiere_id
    WHERE e.id = ?
    LIMIT 1
  `).get(req.params.id);

  if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });
  res.json(etudiant);
});

// POST /api/etudiants
router.post('/', authenticateToken, (req, res) => {
  const { nom, prenom, date_naissance, lieu_naissance, sexe, email, telephone, classe_id, annee_id } = req.body;
  if (!nom || !prenom) return res.status(400).json({ message: 'Nom et prénom requis' });

  const db = getDb();
  const matricule = generateMatriculeEtudiant(db);

  const result = db.prepare(
    'INSERT INTO etudiants (matricule, nom, prenom, date_naissance, lieu_naissance, sexe, email, telephone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(matricule, nom, prenom, date_naissance || null, lieu_naissance || null, sexe || null, email || null, telephone || null);

  const etudiantId = result.lastInsertRowid;

  // Create inscription if classe_id and annee_id provided
  if (classe_id && annee_id) {
    try {
      db.prepare(
        'INSERT INTO inscriptions (etudiant_id, classe_id, annee_id) VALUES (?, ?, ?)'
      ).run(etudiantId, classe_id, annee_id);
    } catch (e) {
      // ignore duplicate inscription
    }
  }

  const newEtudiant = db.prepare(`
    SELECT e.*,
      i.classe_id, i.annee_id as inscription_annee_id,
      c.libelle as classe_libelle,
      n.code as niveau_code
    FROM etudiants e
    LEFT JOIN inscriptions i ON i.etudiant_id = e.id
    LEFT JOIN classes c ON c.id = i.classe_id
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    WHERE e.id = ?
    LIMIT 1
  `).get(etudiantId);

  res.status(201).json(newEtudiant);
});

// PUT /api/etudiants/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { nom, prenom, date_naissance, lieu_naissance, sexe, email, telephone, classe_id, annee_id } = req.body;
  const db = getDb();

  const etudiant = db.prepare('SELECT * FROM etudiants WHERE id = ?').get(req.params.id);
  if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

  db.prepare(
    'UPDATE etudiants SET nom = ?, prenom = ?, date_naissance = ?, lieu_naissance = ?, sexe = ?, email = ?, telephone = ? WHERE id = ?'
  ).run(nom, prenom, date_naissance || null, lieu_naissance || null, sexe || null, email || null, telephone || null, req.params.id);

  // Update inscription
  if (classe_id && annee_id) {
    const existing = db.prepare(
      'SELECT id FROM inscriptions WHERE etudiant_id = ? AND annee_id = ?'
    ).get(req.params.id, annee_id);

    if (existing) {
      db.prepare('UPDATE inscriptions SET classe_id = ? WHERE etudiant_id = ? AND annee_id = ?')
        .run(classe_id, req.params.id, annee_id);
    } else {
      db.prepare('INSERT INTO inscriptions (etudiant_id, classe_id, annee_id) VALUES (?, ?, ?)')
        .run(req.params.id, classe_id, annee_id);
    }
  }

  const updated = db.prepare(`
    SELECT e.*,
      i.classe_id, i.annee_id as inscription_annee_id,
      c.libelle as classe_libelle,
      n.code as niveau_code
    FROM etudiants e
    LEFT JOIN inscriptions i ON i.etudiant_id = e.id
    LEFT JOIN classes c ON c.id = i.classe_id
    LEFT JOIN niveaux n ON n.id = c.niveau_id
    WHERE e.id = ?
    LIMIT 1
  `).get(req.params.id);

  res.json(updated);
});

// DELETE /api/etudiants/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const etudiant = db.prepare('SELECT * FROM etudiants WHERE id = ?').get(req.params.id);
  if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

  // Delete related data
  db.prepare('DELETE FROM notes WHERE etudiant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM inscriptions WHERE etudiant_id = ?').run(req.params.id);
  db.prepare('DELETE FROM etudiants WHERE id = ?').run(req.params.id);

  res.json({ message: 'Étudiant supprimé' });
});

// POST /api/etudiants/:id/inscrire
router.post('/:id/inscrire', authenticateToken, (req, res) => {
  const { classe_id, annee_id } = req.body;
  if (!classe_id || !annee_id) {
    return res.status(400).json({ message: 'Classe et année requis' });
  }

  const db = getDb();
  const etudiant = db.prepare('SELECT * FROM etudiants WHERE id = ?').get(req.params.id);
  if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

  try {
    db.prepare('INSERT OR REPLACE INTO inscriptions (etudiant_id, classe_id, annee_id) VALUES (?, ?, ?)')
      .run(req.params.id, classe_id, annee_id);
    res.json({ message: 'Étudiant inscrit avec succès' });
  } catch (e) {
    res.status(400).json({ message: 'Erreur lors de l\'inscription: ' + e.message });
  }
});

module.exports = router;
