const express = require('express');
const { getDb, calculateNoteFinale, getMention } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET notes by classe + matiere + annee
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { classe_id, matiere_id, annee_id, etudiant_id } = req.query;
  let query = `
    SELECT n.*,
      e.nom, e.prenom, e.matricule,
      m.libelle as matiere_libelle, m.coefficient, m.type_eval
    FROM notes n
    JOIN etudiants e ON e.id = n.etudiant_id
    JOIN matieres m ON m.id = n.matiere_id
    WHERE 1=1
  `;
  const params = [];
  if (matiere_id) { query += ' AND n.matiere_id = ?'; params.push(matiere_id); }
  if (annee_id) { query += ' AND n.annee_id = ?'; params.push(annee_id); }
  if (etudiant_id) { query += ' AND n.etudiant_id = ?'; params.push(etudiant_id); }
  if (classe_id) {
    query += ' AND n.etudiant_id IN (SELECT etudiant_id FROM inscriptions WHERE classe_id = ? AND annee_id = n.annee_id)';
    params.push(classe_id);
  }
  query += ' ORDER BY e.nom, e.prenom';
  res.json(db.prepare(query).all(...params));
});

// GET notes for a classe (all matieres, all students)
router.get('/classe/:classe_id', authenticateToken, (req, res) => {
  const { annee_id, semestre } = req.query;
  if (!annee_id) return res.status(400).json({ message: 'annee_id requis' });
  const db = getDb();
  const classe = db.prepare('SELECT c.*, n.id as niveau_id FROM classes c JOIN niveaux n ON n.id = c.niveau_id WHERE c.id = ?').get(req.params.classe_id);
  if (!classe) return res.status(404).json({ message: 'Classe non trouvée' });

  const etudiantsQuery = `SELECT e.* FROM etudiants e JOIN inscriptions i ON i.etudiant_id = e.id WHERE i.classe_id = ? AND i.annee_id = ? ORDER BY e.nom, e.prenom`;
  const etudiants = db.prepare(etudiantsQuery).all(req.params.classe_id, annee_id);

  let matieresQuery = `SELECT * FROM matieres WHERE niveau_id = ?`;
  const matieresParams = [classe.niveau_id];
  if (semestre) { matieresQuery += ' AND semestre = ?'; matieresParams.push(semestre); }
  matieresQuery += ' ORDER BY semestre, libelle';
  const matieres = db.prepare(matieresQuery).all(...matieresParams);

  const notesAll = db.prepare(`
    SELECT n.* FROM notes n
    WHERE n.annee_id = ? AND n.etudiant_id IN (SELECT etudiant_id FROM inscriptions WHERE classe_id = ? AND annee_id = ?)
  `).all(annee_id, req.params.classe_id, annee_id);

  const notesMap = {};
  notesAll.forEach(n => { notesMap[`${n.etudiant_id}_${n.matiere_id}`] = n; });

  res.json({ classe, etudiants, matieres, notesMap });
});

// POST or PUT a single note
router.post('/', authenticateToken, (req, res) => {
  const { etudiant_id, matiere_id, annee_id, note_cc, note_exam, note_rattrapage } = req.body;
  if (!etudiant_id || !matiere_id || !annee_id) return res.status(400).json({ message: 'etudiant_id, matiere_id, annee_id requis' });

  const db = getDb();
  const matiere = db.prepare('SELECT type_eval FROM matieres WHERE id = ?').get(matiere_id);
  if (!matiere) return res.status(404).json({ message: 'Matière non trouvée' });

  const cc = note_cc !== undefined && note_cc !== '' ? parseFloat(note_cc) : null;
  const exam = note_exam !== undefined && note_exam !== '' ? parseFloat(note_exam) : null;
  const ratt = note_rattrapage !== undefined && note_rattrapage !== '' ? parseFloat(note_rattrapage) : null;
  const finale = calculateNoteFinale(cc, exam, ratt, matiere.type_eval);

  const existing = db.prepare('SELECT id FROM notes WHERE etudiant_id=? AND matiere_id=? AND annee_id=?').get(etudiant_id, matiere_id, annee_id);
  if (existing) {
    db.prepare('UPDATE notes SET note_cc=?, note_exam=?, note_rattrapage=?, note_finale=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(cc, exam, ratt, finale, existing.id);
    return res.json(db.prepare('SELECT * FROM notes WHERE id=?').get(existing.id));
  }
  const result = db.prepare('INSERT INTO notes (etudiant_id, matiere_id, annee_id, note_cc, note_exam, note_rattrapage, note_finale) VALUES (?,?,?,?,?,?,?)')
    .run(etudiant_id, matiere_id, annee_id, cc, exam, ratt, finale);
  res.status(201).json(db.prepare('SELECT * FROM notes WHERE id=?').get(result.lastInsertRowid));
});

// PUT bulk notes for a matiere + classe
router.put('/bulk', authenticateToken, (req, res) => {
  const { matiere_id, annee_id, notes } = req.body;
  if (!matiere_id || !annee_id || !Array.isArray(notes)) return res.status(400).json({ message: 'matiere_id, annee_id, notes[] requis' });

  const db = getDb();
  const matiere = db.prepare('SELECT type_eval FROM matieres WHERE id = ?').get(matiere_id);
  if (!matiere) return res.status(404).json({ message: 'Matière non trouvée' });

  const upsert = db.transaction(() => {
    for (const n of notes) {
      const cc = n.note_cc !== undefined && n.note_cc !== '' ? parseFloat(n.note_cc) : null;
      const exam = n.note_exam !== undefined && n.note_exam !== '' ? parseFloat(n.note_exam) : null;
      const ratt = n.note_rattrapage !== undefined && n.note_rattrapage !== '' ? parseFloat(n.note_rattrapage) : null;
      const finale = calculateNoteFinale(cc, exam, ratt, matiere.type_eval);
      const existing = db.prepare('SELECT id FROM notes WHERE etudiant_id=? AND matiere_id=? AND annee_id=?').get(n.etudiant_id, matiere_id, annee_id);
      if (existing) {
        db.prepare('UPDATE notes SET note_cc=?, note_exam=?, note_rattrapage=?, note_finale=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
          .run(cc, exam, ratt, finale, existing.id);
      } else {
        db.prepare('INSERT INTO notes (etudiant_id, matiere_id, annee_id, note_cc, note_exam, note_rattrapage, note_finale) VALUES (?,?,?,?,?,?,?)')
          .run(n.etudiant_id, matiere_id, annee_id, cc, exam, ratt, finale);
      }
    }
  });
  upsert();
  res.json({ message: 'Notes enregistrées avec succès' });
});

module.exports = router;
