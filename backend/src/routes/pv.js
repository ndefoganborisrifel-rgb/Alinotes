const express = require('express');
const { getDb, getMention } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET PV for a classe + semestre + annee
router.get('/', authenticateToken, (req, res) => {
  const { classe_id, annee_id, semestre } = req.query;
  if (!classe_id || !annee_id) return res.status(400).json({ message: 'classe_id et annee_id requis' });

  const db = getDb();
  const classe = db.prepare(`
    SELECT c.*, n.code as niveau_code, n.libelle as niveau_libelle,
      a.libelle as annee_libelle, f.libelle as filiere_libelle
    FROM classes c
    JOIN niveaux n ON n.id = c.niveau_id
    JOIN annees_academiques a ON a.id = c.annee_id
    JOIN filieres f ON f.id = n.filiere_id
    WHERE c.id = ?
  `).get(classe_id);
  if (!classe) return res.status(404).json({ message: 'Classe non trouvée' });

  const etudiants = db.prepare(`
    SELECT e.* FROM etudiants e
    JOIN inscriptions i ON i.etudiant_id = e.id
    WHERE i.classe_id = ? AND i.annee_id = ?
    ORDER BY e.nom, e.prenom
  `).all(classe_id, annee_id);

  let matieresQuery = `SELECT * FROM matieres WHERE niveau_id = ?`;
  const mParams = [classe.niveau_id];
  if (semestre) { matieresQuery += ' AND semestre = ?'; mParams.push(semestre); }
  matieresQuery += ' ORDER BY semestre, libelle';
  const matieres = db.prepare(matieresQuery).all(...mParams);

  const pvData = etudiants.map(etudiant => {
    const notesList = matieres.map(matiere => {
      const note = db.prepare('SELECT * FROM notes WHERE etudiant_id=? AND matiere_id=? AND annee_id=?')
        .get(etudiant.id, matiere.id, annee_id);
      return {
        matiere_id: matiere.id,
        matiere_code: matiere.code,
        matiere_libelle: matiere.libelle,
        coefficient: matiere.coefficient,
        credit: matiere.credit,
        semestre: matiere.semestre,
        note_cc: note ? note.note_cc : null,
        note_exam: note ? note.note_exam : null,
        note_rattrapage: note ? note.note_rattrapage : null,
        note_finale: note ? note.note_finale : null,
        mention: getMention(note ? note.note_finale : null),
        admis: note && note.note_finale !== null && note.note_finale >= 10
      };
    });

    let totalPoints = 0, totalCoeff = 0, totalCredits = 0, creditsValides = 0;
    notesList.forEach(n => {
      if (n.note_finale !== null) {
        totalPoints += n.note_finale * n.coefficient;
        totalCoeff += n.coefficient;
        totalCredits += n.credit;
        if (n.admis) creditsValides += n.credit;
      }
    });
    const moyenne = totalCoeff > 0 ? Math.round((totalPoints / totalCoeff) * 100) / 100 : null;

    return {
      etudiant,
      notes: notesList,
      moyenne,
      mention: getMention(moyenne),
      totalCredits,
      creditsValides,
      admis: moyenne !== null && moyenne >= 10
    };
  });

  // Sort by moyenne descending
  pvData.sort((a, b) => (b.moyenne || 0) - (a.moyenne || 0));
  pvData.forEach((r, i) => { r.rang = i + 1; });

  res.json({ classe, matieres, pv: pvData, annee_id, semestre });
});

module.exports = router;
