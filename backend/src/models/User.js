const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, '../../data/resume_generator.db'));

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    personal_email TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Employment history table
  db.run(`CREATE TABLE IF NOT EXISTS employment_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    company_name TEXT NOT NULL,
    location TEXT,
    position TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_current BOOLEAN DEFAULT 0,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Education table
  db.run(`CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    school_name TEXT NOT NULL,
    location TEXT,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_current BOOLEAN DEFAULT 0,
    gpa TEXT,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

class User {
  static async create(userData) {
    const { email, password, full_name, phone, personal_email, linkedin_url, github_url } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (
          email, password, full_name, phone, personal_email, 
          linkedin_url, github_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, full_name, phone, personal_email, linkedin_url, github_url],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  }

  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  }

  static async updateProfile(userId, userData) {
    const { full_name, phone, personal_email, linkedin_url, github_url } = userData;
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users 
         SET full_name = ?, phone = ?, personal_email = ?, linkedin_url = ?, github_url = ?
         WHERE id = ?`,
        [full_name, phone, personal_email, linkedin_url, github_url, userId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async generatePasswordResetToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users 
         SET reset_token = ?, reset_token_expires = ?
         WHERE email = ?`,
        [token, expires.toISOString(), email],
        function(err) {
          if (err) reject(err);
          else resolve(token);
        }
      );
    });
  }

  static async resetPassword(token, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users 
         SET password = ?, reset_token = NULL, reset_token_expires = NULL
         WHERE reset_token = ? AND reset_token_expires > datetime('now')`,
        [hashedPassword, token],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static async addEmploymentHistory(userId, employmentData) {
    const { company_name, location, position, start_date, end_date, is_current, description } = employmentData;
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO employment_history 
         (user_id, company_name, location, position, start_date, end_date, is_current, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, company_name, location, position, start_date, end_date, is_current ? 1 : 0, description],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async getEmploymentHistory(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM employment_history WHERE user_id = ? ORDER BY start_date DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async updateEmploymentHistory(employmentId, employmentData) {
    const { company_name, location, position, start_date, end_date, is_current, description } = employmentData;
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE employment_history 
         SET company_name = ?, location = ?, position = ?, start_date = ?, 
             end_date = ?, is_current = ?, description = ?
         WHERE id = ?`,
        [company_name, location, position, start_date, end_date, is_current ? 1 : 0, description, employmentId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async deleteEmploymentHistory(employmentId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM employment_history WHERE id = ?', [employmentId], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }

  // Education methods
  static async addEducation(userId, educationData) {
    const { 
      school_name, 
      location, 
      degree, 
      field_of_study, 
      start_date, 
      end_date, 
      is_current, 
      gpa, 
      description 
    } = educationData;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO education 
         (user_id, school_name, location, degree, field_of_study, start_date, end_date, is_current, gpa, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, school_name, location, degree, field_of_study, start_date, end_date, is_current ? 1 : 0, gpa, description],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static async getEducation(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM education WHERE user_id = ? ORDER BY start_date DESC',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async updateEducation(educationId, educationData) {
    const { 
      school_name, 
      location, 
      degree, 
      field_of_study, 
      start_date, 
      end_date, 
      is_current, 
      gpa, 
      description 
    } = educationData;

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE education 
         SET school_name = ?, location = ?, degree = ?, field_of_study = ?, 
             start_date = ?, end_date = ?, is_current = ?, gpa = ?, description = ?
         WHERE id = ?`,
        [school_name, location, degree, field_of_study, start_date, end_date, is_current ? 1 : 0, gpa, description, educationId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async deleteEducation(educationId) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM education WHERE id = ?', [educationId], (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

module.exports = User; 