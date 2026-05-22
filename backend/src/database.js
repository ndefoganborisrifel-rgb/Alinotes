const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'alinotes.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS annees_academiques (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      libelle TEXT NOT NULL,
      date_debut DATE,
      date_fin DATE,
      active INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS filieres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      libelle TEXT NOT NULL,
      type TEXT
    );

    CREATE TABLE IF NOT EXISTS niveaux (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      libelle TEXT NOT NULL,
      filiere_id INTEGER REFERENCES filieres(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      libelle TEXT NOT NULL,
      niveau_id INTEGER REFERENCES niveaux(id),
      annee_id INTEGER REFERENCES annees_academiques(id),
      capacite INTEGER DEFAULT 50
    );

    CREATE TABLE IF NOT EXISTS etudiants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricule TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      date_naissance DATE,
      lieu_naissance TEXT,
      sexe TEXT,
      email TEXT,
      telephone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enseignants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricule TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT,
      telephone TEXT,
      grade TEXT,
      specialite TEXT
    );

    CREATE TABLE IF NOT EXISTS matieres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      libelle TEXT NOT NULL,
      coefficient REAL DEFAULT 1,
      credit INTEGER DEFAULT 3,
      semestre INTEGER,
      type_eval TEXT DEFAULT 'CC+Exam',
      niveau_id INTEGER REFERENCES niveaux(id),
      enseignant_id INTEGER REFERENCES enseignants(id)
    );

    CREATE TABLE IF NOT EXISTS inscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etudiant_id INTEGER REFERENCES etudiants(id),
      classe_id INTEGER REFERENCES classes(id),
      annee_id INTEGER REFERENCES annees_academiques(id),
      date_inscription DATE DEFAULT CURRENT_DATE,
      UNIQUE(etudiant_id, annee_id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      etudiant_id INTEGER REFERENCES etudiants(id),
      matiere_id INTEGER REFERENCES matieres(id),
      annee_id INTEGER REFERENCES annees_academiques(id),
      note_cc REAL,
      note_exam REAL,
      note_rattrapage REAL,
      note_finale REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(etudiant_id, matiere_id, annee_id)
    );
  `);

  // Seed admin user
  const adminExists = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@ali.edu');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    database.prepare(
      'INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)'
    ).run('Admin', 'Institut Ali', 'admin@ali.edu', hashedPassword, 'admin');
    console.log('Admin user created: admin@ali.edu / admin123');
  }

  // Seed sample data
  seedSampleData(database);

  console.log('Database initialized successfully');
  return database;
}

function seedSampleData(database) {
  // Seed années académiques
  const anneeExists = database.prepare('SELECT id FROM annees_academiques LIMIT 1').get();
  if (!anneeExists) {
    database.prepare(
      'INSERT INTO annees_academiques (libelle, date_debut, date_fin, active) VALUES (?, ?, ?, ?)'
    ).run('2023-2024', '2023-10-01', '2024-07-31', 0);
    database.prepare(
      'INSERT INTO annees_academiques (libelle, date_debut, date_fin, active) VALUES (?, ?, ?, ?)'
    ).run('2024-2025', '2024-10-01', '2025-07-31', 1);
  }

  // Seed filières
  const filiereExists = database.prepare('SELECT id FROM filieres LIMIT 1').get();
  if (!filiereExists) {
    database.prepare('INSERT INTO filieres (code, libelle, type) VALUES (?, ?, ?)').run('INFO', 'Informatique', 'Licence');
    database.prepare('INSERT INTO filieres (code, libelle, type) VALUES (?, ?, ?)').run('MINFO', 'Master Informatique', 'Master');
    database.prepare('INSERT INTO filieres (code, libelle, type) VALUES (?, ?, ?)').run('GESTION', 'Gestion', 'Licence');
  }

  // Seed niveaux
  const niveauExists = database.prepare('SELECT id FROM niveaux LIMIT 1').get();
  if (!niveauExists) {
    const fil1 = database.prepare('SELECT id FROM filieres WHERE code = ?').get('INFO');
    const fil2 = database.prepare('SELECT id FROM filieres WHERE code = ?').get('MINFO');
    if (fil1) {
      database.prepare('INSERT INTO niveaux (code, libelle, filiere_id) VALUES (?, ?, ?)').run('L1', 'Licence 1', fil1.id);
      database.prepare('INSERT INTO niveaux (code, libelle, filiere_id) VALUES (?, ?, ?)').run('L2', 'Licence 2', fil1.id);
      database.prepare('INSERT INTO niveaux (code, libelle, filiere_id) VALUES (?, ?, ?)').run('L3', 'Licence 3', fil1.id);
    }
    if (fil2) {
      database.prepare('INSERT INTO niveaux (code, libelle, filiere_id) VALUES (?, ?, ?)').run('M1', 'Master 1', fil2.id);
      database.prepare('INSERT INTO niveaux (code, libelle, filiere_id) VALUES (?, ?, ?)').run('M2', 'Master 2', fil2.id);
    }
  }
}

function generateMatriculeEtudiant(database) {
  const year = new Date().getFullYear();
  const last = database.prepare(
    "SELECT matricule FROM etudiants WHERE matricule LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`ALI-${year}-%`);

  let num = 1;
  if (last) {
    const parts = last.matricule.split('-');
    num = parseInt(parts[2]) + 1;
  }
  return `ALI-${year}-${String(num).padStart(4, '0')}`;
}

function generateMatriculeEnseignant(database) {
  const last = database.prepare(
    "SELECT matricule FROM enseignants ORDER BY id DESC LIMIT 1"
  ).get();

  let num = 1;
  if (last) {
    const parts = last.matricule.split('-');
    num = parseInt(parts[1]) + 1;
  }
  return `ENS-${String(num).padStart(4, '0')}`;
}

function calculateNoteFinale(noteCc, noteExam, noteRattrapage, typeEval) {
  let noteFinale = null;

  if (typeEval === 'CC+Exam') {
    if (noteCc !== null && noteExam !== null) {
      noteFinale = (noteCc * 0.4) + (noteExam * 0.6);
    } else if (noteExam !== null) {
      noteFinale = noteExam;
    }
  } else {
    // Exam seul
    if (noteExam !== null) {
      noteFinale = noteExam;
    }
  }

  // Apply rattrapage if higher
  if (noteRattrapage !== null && noteFinale !== null) {
    noteFinale = Math.max(noteFinale, noteRattrapage);
  } else if (noteRattrapage !== null) {
    noteFinale = noteRattrapage;
  }

  return noteFinale !== null ? Math.round(noteFinale * 100) / 100 : null;
}

function getMention(note) {
  if (note === null || note === undefined) return '-';
  if (note >= 16) return 'Très Bien';
  if (note >= 14) return 'Bien';
  if (note >= 12) return 'Assez Bien';
  if (note >= 10) return 'Passable';
  return 'Insuffisant';
}

module.exports = {
  getDb,
  initDatabase,
  generateMatriculeEtudiant,
  generateMatriculeEnseignant,
  calculateNoteFinale,
  getMention
};
