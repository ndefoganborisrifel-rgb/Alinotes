const express = require('express');
const { getDb, getMention } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET bulletin for an etudiant in a given annee (+ optional semestre)
router.get('/:etudiant_id', authenticateToken, (req, res) => {
  const { annee_id, semestre } = req.query;
  if (!annee_id) return res.status(400).json({ message: 'annee_id requis' });

  const db = getDb();
  const etudiant = db.prepare('SELECT * FROM etudiants WHERE id = ?').get(req.params.etudiant_id);
  if (!etudiant) return res.status(404).json({ message: 'Étudiant non trouvé' });

  const inscription = db.prepare(`
    SELECT i.*, c.libelle as classe_libelle, n.code as niveau_code, n.libelle as niveau_libelle,
      a.libelle as annee_libelle, f.libelle as filiere_libelle
    FROM inscriptions i
    JOIN classes c ON c.id = i.classe_id
    JOIN niveaux n ON n.id = c.niveau_id
    JOIN annees_academiques a ON a.id = i.annee_id
    JOIN filieres f ON f.id = n.filiere_id
    WHERE i.etudiant_id = ? AND i.annee_id = ?
  `).get(req.params.etudiant_id, annee_id);

  let notesQuery = `
    SELECT n.*, m.libelle as matiere_libelle, m.code as matiere_code,
      m.coefficient, m.credit, m.semestre, m.type_eval
    FROM notes n
    JOIN matieres m ON m.id = n.matiere_id
    WHERE n.etudiant_id = ? AND n.annee_id = ?
  `;
  const params = [req.params.etudiant_id, annee_id];
  if (semestre) { notesQuery += ' AND m.semestre = ?'; params.push(semestre); }
  notesQuery += ' ORDER BY m.semestre, m.libelle';

  const notes = db.prepare(notesQuery).all(...params);

  // Calculate stats per semestre
  const semestres = {};
  notes.forEach(note => {
    const sem = note.semestre || 0;
    if (!semestres[sem]) semestres[sem] = { notes: [], total_points: 0, total_coeff: 0, total_credits: 0, credits_valides: 0 };
    const mention = getMention(note.note_finale);
    const admis = note.note_finale !== null && note.note_finale >= 10;
    semestres[sem].notes.push({ ...note, mention, admis });
    if (note.note_finale !== null) {
      semestres[sem].total_points += note.note_finale * note.coefficient;
      semestres[sem].total_coeff += note.coefficient;
      semestres[sem].total_credits += note.credit;
      if (admis) semestres[sem].credits_valides += note.credit;
    }
  });

  // Compute moyenne per semestre
  Object.keys(semestres).forEach(sem => {
    const s = semestres[sem];
    s.moyenne = s.total_coeff > 0 ? Math.round((s.total_points / s.total_coeff) * 100) / 100 : null;
    s.mention = getMention(s.moyenne);
    s.admis = s.moyenne !== null && s.moyenne >= 10;
  });

  // Global stats
  let totalPoints = 0, totalCoeff = 0, totalCredits = 0, creditsValides = 0;
  notes.forEach(note => {
    if (note.note_finale !== null) {
      totalPoints += note.note_finale * note.coefficient;
      totalCoeff += note.coefficient;
      totalCredits += note.credit;
      if (note.note_finale >= 10) creditsValides += note.credit;
    }
  });
  const moyenneGenerale = totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : null;

  res.json({
    etudiant,
    inscription,
    semestres,
    moyenneGenerale,
    totalCredits,
    creditsValides,
    mentionGenerale: getMention(moyenneGenerale),
    admisGeneral: moyenneGenerale !== null && moyenneGenerale >= 10
  });
});

module.exports = router;
