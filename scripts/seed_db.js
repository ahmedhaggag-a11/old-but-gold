const db = require('../src/db/db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('🔄 Initializing Database Schema...');

  const createTablesSql = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(80) UNIQUE NOT NULL,
      name VARCHAR(50) NOT NULL,
      parent_name VARCHAR(50) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      password_hash VARCHAR(200) NOT NULL,
      grade_id INTEGER NOT NULL,
      is_admin BOOLEAN DEFAULT FALSE,
      parent_phone VARCHAR(50) NOT NULL,
      address VARCHAR(50) NOT NULL,
      national_id VARCHAR(50) UNIQUE NOT NULL,
      student_id VARCHAR(50) UNIQUE NOT NULL,
      gender VARCHAR(10) DEFAULT 'male',
      session_token VARCHAR(128)
    );`,

    `CREATE TABLE IF NOT EXISTS grade (
      id SERIAL PRIMARY KEY,
      grade VARCHAR(50) NOT NULL,
      system VARCHAR(50) NOT NULL,
      category VARCHAR(50),
      level VARCHAR(50),
      order_num INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      video_url VARCHAR(500) NOT NULL,
      thumbnail_path VARCHAR(500),
      grade_id INTEGER NOT NULL,
      subject VARCHAR(100),
      views_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_deleted BOOLEAN DEFAULT FALSE
    );`,

    `CREATE TABLE IF NOT EXISTS sheets (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      grade_id INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      grade_id INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      is_deleted BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS answers (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      grade_id INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      image_path VARCHAR(500) NOT NULL,
      price INTEGER NOT NULL,
      grade_id INTEGER NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS access_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) NOT NULL,
      grade_id INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expire_date TIMESTAMP NOT NULL,
      user_id INTEGER,
      is_deleted BOOLEAN DEFAULT FALSE,
      is_used BOOLEAN DEFAULT FALSE,
      used_at TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      subject VARCHAR(100) NOT NULL,
      image_path VARCHAR(500) NOT NULL,
      section VARCHAR(50) NOT NULL,
      order_num INTEGER NOT NULL,
      grade_id INTEGER,
      system VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS online_exams (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      grade_id INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      total_questions INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS exam_questions (
      id SERIAL PRIMARY KEY,
      exam_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_image VARCHAR(500),
      question_number INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS question_options (
      id SERIAL PRIMARY KEY,
      question_id INTEGER NOT NULL,
      option_text VARCHAR(500) NOT NULL,
      option_letter VARCHAR(1) NOT NULL,
      is_correct BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS exam_results (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      score FLOAT NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      wrong_answers INTEGER NOT NULL,
      time_taken INTEGER NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (let sql of createTablesSql) {
    // If SQLite, replace SERIAL with INTEGER PRIMARY KEY AUTOINCREMENT
    if (db.dbType === 'sqlite') {
      sql = sql.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
      sql = sql.replace(/BOOLEAN DEFAULT FALSE/g, 'INTEGER DEFAULT 0');
      sql = sql.replace(/BOOLEAN DEFAULT TRUE/g, 'INTEGER DEFAULT 1');
      sql = sql.replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    }
    try {
      await db.query(sql);
    } catch (e) {
      console.warn('Table query warning:', e.message);
    }
  }

  // Check Grades
  const existingGrades = await db.query('SELECT count(*) as cnt FROM grade');
  const count = existingGrades[0]?.cnt || existingGrades[0]?.count || 0;
  if (parseInt(count) === 0) {
    console.log('📌 Seeding Default Grades...');
    await db.query(`INSERT INTO grade (grade, system, category, level, order_num) VALUES
      ('الصف الأول الثانوي', 'National', 'عام', 'Secondary', 1),
      ('الصف الثاني الثانوي', 'National', 'عام', 'Secondary', 2),
      ('الصف الثالث الثانوي', 'National', 'عام', 'Secondary', 3)
    `);
  }

  // Check Admin & Student Accounts
  const adminCheck = await db.queryOne('SELECT id FROM users WHERE username = ? OR email = ?', ['admin', 'admin@platform.com']);
  if (!adminCheck) {
    console.log('🔑 Creating Default Admin Account...');
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);
    await db.query(`INSERT INTO users 
      (username, name, parent_name, email, password_hash, grade_id, is_admin, parent_phone, address, national_id, student_id, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['admin', 'مدير النظام', 'النظام', 'admin@platform.com', adminPasswordHash, 1, db.dbType === 'sqlite' ? 1 : true, '01000000000', 'القاهرة', '11111111111111', 'ADMIN001', 'male']
    );
  }

  const studentCheck = await db.queryOne('SELECT id FROM users WHERE username = ? OR email = ?', ['student', 'student@platform.com']);
  if (!studentCheck) {
    console.log('🎓 Creating Default Student Account...');
    const studentPasswordHash = bcrypt.hashSync('student123', 10);
    await db.query(`INSERT INTO users 
      (username, name, parent_name, email, password_hash, grade_id, is_admin, parent_phone, address, national_id, student_id, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['student', 'طالب تجريبي', 'ولي الأمر', 'student@platform.com', studentPasswordHash, 1, db.dbType === 'sqlite' ? 0 : false, '01111111111', 'القاهرة', '22222222222222', 'STU001', 'male']
    );
  }

  console.log('✅ Database Initialization & Seeding Complete!');
}

if (require.main === module) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
