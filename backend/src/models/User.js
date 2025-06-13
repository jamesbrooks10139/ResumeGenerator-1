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
    location TEXT,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    openai_model TEXT DEFAULT 'gpt-4.1-2025-04-14',
    max_tokens INTEGER DEFAULT 30000,
    daily_generation_limit INTEGER DEFAULT 5
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

  // Resume Generations table
  db.run(`CREATE TABLE IF NOT EXISTS resume_generations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    generation_date TEXT NOT NULL, -- YYYY-MM-DD
    count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, generation_date),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
});

// MIGRATION: Add location column if it doesn't exist
// This will run once on startup and add the column if missing
const addLocationColumn = () => {
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) return;
    const hasLocation = columns.some(col => col.name === 'location');
    if (!hasLocation) {
      db.run('ALTER TABLE users ADD COLUMN location TEXT', (err) => {
        if (err) console.error('Failed to add location column:', err);
        else console.log('Added location column to users table');
      });
    }
  });
};
addLocationColumn();

const addOpenAISettingsColumns = () => {
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error checking users table info:', err);
      return;
    }
    const hasOpenAIModel = columns.some(col => col.name === 'openai_model');
    const hasMaxTokens = columns.some(col => col.name === 'max_tokens');

    if (!hasOpenAIModel) {
      db.run('ALTER TABLE users ADD COLUMN openai_model TEXT DEFAULT \'gpt-4.1-2025-04-14\'', (err) => {
        if (err) console.error('Failed to add openai_model column:', err);
        else console.log('Added openai_model column to users table');
      });
    }

    if (!hasMaxTokens) {
      db.run('ALTER TABLE users ADD COLUMN max_tokens INTEGER DEFAULT 30000', (err) => {
        if (err) console.error('Failed to add max_tokens column:', err);
        else console.log('Added max_tokens column to users table');
      });
    }
  });
};
addOpenAISettingsColumns();

const addDailyGenerationLimitColumn = () => {
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error checking users table info:', err);
      return;
    }
    const hasDailyGenerationLimit = columns.some(col => col.name === 'daily_generation_limit');

    if (!hasDailyGenerationLimit) {
      db.run('ALTER TABLE users ADD COLUMN daily_generation_limit INTEGER DEFAULT 5', (err) => {
        if (err) console.error('Failed to add daily_generation_limit column:', err);
        else console.log('Added daily_generation_limit column to users table');
      });
    }
  });
};
addDailyGenerationLimitColumn();

class User {
  static async create(userData) {
    const { email, password, full_name, phone, personal_email, linkedin_url, github_url, location, openai_model, max_tokens } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (
          email, password, full_name, phone, personal_email,
          linkedin_url, github_url, location, openai_model, max_tokens
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, full_name, phone, personal_email, linkedin_url, github_url, location, openai_model, max_tokens],
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
    const { full_name, phone, personal_email, linkedin_url, github_url, location, openai_model, max_tokens } = userData;
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users 
         SET full_name = ?, phone = ?, personal_email = ?, linkedin_url = ?, github_url = ?, location = ?, openai_model = ?, max_tokens = ?
         WHERE id = ?`,
        [full_name, phone, personal_email, linkedin_url, github_url, location, openai_model, max_tokens, userId],
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

  static async updateOpenAISettings(userId, openai_model, max_tokens) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users 
         SET openai_model = ?, max_tokens = ?
         WHERE id = ?`,
        [openai_model, max_tokens, userId],
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async trackResumeGeneration(userId) {
    // Get current date in CST (Central Standard Time)
    const options = {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());

    const year = parts.find(part => part.type === 'year').value;
    const month = parts.find(part => part.type === 'month').value;
    const day = parts.find(part => part.type === 'day').value;

    const todayCST = `${year}-${month}-${day}`;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO resume_generations (user_id, generation_date, count)
         VALUES (?, ?, 1)
         ON CONFLICT(user_id, generation_date) DO UPDATE SET count = count + 1`,
        [userId, todayCST],
        function(err) {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });
  }

  static async getAllUsers() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
          u.id,
          u.email,
          u.password,
          u.full_name,
          u.phone,
          u.personal_email,
          u.linkedin_url,
          u.github_url,
          u.location,
          u.reset_token,
          u.reset_token_expires,
          u.created_at,
          u.openai_model,
          u.max_tokens,
          SUM(rg.count) AS total_generations
        FROM users u
        LEFT JOIN resume_generations rg ON u.id = rg.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getDailyGenerationCount(userId) {
    const todayCST = await this.getTodayCST();
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT count FROM resume_generations WHERE user_id = ? AND generation_date = ?`,
        [userId, todayCST],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.count : 0);
        }
      );
    });
  }

  static async getTodayCST() {
    const options = {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());

    const year = parts.find(part => part.type === 'year').value;
    const month = parts.find(part => part.type === 'month').value;
    const day = parts.find(part => part.type === 'day').value;

    return `${year}-${month}-${day}`;
  }

  static async getDailyGenerations() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
          rg.user_id,
          u.email,
          rg.generation_date,
          rg.count
        FROM resume_generations rg
        JOIN users u ON rg.user_id = u.id
        ORDER BY rg.generation_date DESC, u.email ASC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = User; 