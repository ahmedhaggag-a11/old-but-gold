const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const nunjucks = require('nunjucks');
require('dotenv').config();

const db = require('./src/db/db');
const youtube = require('./src/utils/youtube');
const { seedDatabase } = require('./scripts/seed_db');

const app = express();
const PORT = process.env.PORT || 5000;

// Multer Storage Setup for local uploads (Sheets, Exams, Books, Images)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage: storage });

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'knowledge-platform-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 Hours
}));

// Static Files Routes
const staticPath = path.join(__dirname, 'static');
app.use('/static', express.static(staticPath));
app.use('/pages/static', express.static(staticPath));
app.use('/auth/static', express.static(staticPath));
app.use('/admin/static', express.static(staticPath));
app.use('/dashboard/static', express.static(staticPath));
app.use('/uploads', express.static(uploadDir));

// Nunjucks Configuration (Full Jinja2 Compatibility)
const njkEnv = nunjucks.configure('templates', {
  autoescape: true,
  express: app,
  noCache: true
});

// Flask url_for helper mapping in Nunjucks
njkEnv.addGlobal('url_for', (endpoint, options = {}) => {
  if (endpoint === 'static') {
    const filename = typeof options === 'object' ? options.filename : options;
    return `/static/${filename || ''}`;
  }
  const routeMap = {
    'index': '/',
    'books_page': '/book',
    'welcome': '/welcome',
    'profile': '/profile',
    'change_password': '/change-password',
    'dashboarduser': '/dashboarduser',
    'admin_workspace': '/admin/workspace',
    'auth.login_page': '/login',
    'auth.admin_login_page': '/admin/login',
    'auth.register_page': '/register',
    'auth.logout': '/logout',
    'auth.logout_page': '/logout',
    'auth.forgot_password': '/forgot-password'
  };
  return routeMap[endpoint] || `/${endpoint.replace('auth.', '')}`;
});

// Global Context Middleware (Injects current_user into all templates)
app.use((req, res, next) => {
  const user = req.session.user;
  res.locals.current_user = user ? {
    is_authenticated: true,
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    grade_id: user.grade_id,
    is_admin: Boolean(user.is_admin)
  } : {
    is_authenticated: false,
    username: '',
    name: '',
    is_admin: false
  };
  next();
});

// Authentication Guard Middlewares
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ error: 'غير مصرح بالدخول، يرجى تسجيل الدخول أولاً' });
    }
    return res.redirect('/login');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || !req.session.user.is_admin) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ error: 'صلاحيات المدير مطلوبة' });
    }
    return res.redirect('/login');
  }
  next();
};

// Auto-seed Database on startup
seedDatabase().catch(err => console.error('Database seed error:', err));

// =========================================================================
// HTML PAGE ROUTES
// =========================================================================

app.get('/', (req, res) => res.render('pages/index.html'));
app.get('/index', (req, res) => res.render('pages/index.html'));

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.is_admin ? '/admin/workspace' : '/');
  }
  res.render('auth/login.html');
});

app.get('/admin/login', (req, res) => {
  if (req.session.user && req.session.user.is_admin) {
    return res.redirect('/admin/workspace');
  }
  res.render('auth/loginadmin.html');
});

app.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/register.html');
});

app.get('/forgot-password', (req, res) => res.render('auth/forgot-password.html'));

app.get('/welcome', requireAuth, (req, res) => {
  if (req.session.user.is_admin) return res.redirect('/admin/workspace');
  res.render('pages/welcome.html');
});

app.get('/dashboarduser', requireAuth, (req, res) => res.render('pages/dashboarduser.html'));
app.get('/admin/workspace', requireAdmin, (req, res) => res.render('admin/workspace.html'));
app.get('/book', (req, res) => res.render('pages/book.html'));
app.get('/exam', (req, res) => res.render('pages/exam.html'));
app.get('/profile', requireAuth, (req, res) => res.render('pages/profile.html'));
app.get('/change-password', requireAuth, (req, res) => res.render('auth/change-password.html'));
app.get('/terms', (req, res) => res.render('pages/terms.html'));

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// =========================================================================
// API ROUTES
// =========================================================================

// CHECK AUTH API
app.get(['/api/check-auth', '/api/check_auth'], (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ authenticated: false, logged_in: false });
  }
  res.json({
    authenticated: true,
    logged_in: true,
    user_id: req.session.user.id,
    username: req.session.user.username,
    name: req.session.user.name,
    grade_id: req.session.user.grade_id,
    is_admin: req.session.user.is_admin
  });
});

// CURRENT USER API
app.get('/api/current_user', (req, res) => {
  if (!req.session.user) return res.json({ logged_in: false });
  res.json({ logged_in: true, user: req.session.user });
});

// USER PROFILE API
app.get('/api/user-profile', requireAuth, async (req, res) => {
  try {
    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
    const gradeObj = await db.queryOne('SELECT * FROM grade WHERE id = ?', [user.grade_id]);

    res.json({
      username: user.username,
      name: user.name,
      address: user.address,
      student_id: user.student_id,
      father_phone: user.parent_phone,
      grade_name: gradeObj ? gradeObj.grade : 'غير محدد',
      email: user.email,
      parent_name: user.parent_name,
      national_id: user.national_id,
      gender: user.gender
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CHANGE PASSWORD API
app.post('/api/change-password', requireAuth, async (req, res) => {
  try {
    const { old_password, new_password, confirm_password } = req.body;
    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({ success: false, error: 'جميع الحقول مطلوبة.' });
    }
    if (new_password !== confirm_password) {
      return res.status(400).json({ success: false, error: 'كلمات المرور غير متطابقة.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' });
    }

    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    if (!user || !bcrypt.compareSync(old_password, user.password_hash)) {
      return res.status(400).json({ success: false, error: 'كلمة المرور القديمة غير صحيحة.' });
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.session.user.id]);

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// LOGIN API
app.post(['/api/login', '/api/admin/login'], async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'اسم المستخدم/البريد وكلمة المرور مطلوبان' });
    }

    const user = await db.queryOne(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [identifier, identifier]
    );

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      grade_id: user.grade_id,
      is_admin: Boolean(user.is_admin)
    };

    const redirectUrl = user.is_admin ? '/admin/workspace' : '/';

    return res.json({
      message: 'تم تسجيل الدخول بنجاح',
      is_admin: Boolean(user.is_admin),
      user_id: user.id,
      username: user.username,
      name: user.name,
      redirect: redirectUrl
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

// REGISTER API
app.post('/api/register', async (req, res) => {
  try {
    const { username, name, parent_name, email, password, confirm_password, grade_id, parent_phone, national_id, student_id, address, gender } = req.body;

    if (!username || !name || !email || !password || !grade_id) {
      return res.status(400).json({ error: 'الحقول الأساسية مطلوبة' });
    }

    if (confirm_password && password !== confirm_password) {
      return res.status(400).json({ error: 'كلمات المرور غير متطابقة' });
    }

    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE username = ? OR email = ? OR national_id = ? OR student_id = ?',
      [username, email, national_id || '', student_id || '']
    );

    if (existingUser) {
      return res.status(400).json({ error: 'اسم المستخدم، الإيميل، أو الرقم القومي مسجل بالفعل' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    await db.query(
      `INSERT INTO users (username, name, parent_name, email, password_hash, grade_id, is_admin, parent_phone, address, national_id, student_id, gender)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        name,
        parent_name || 'غير محدد',
        email,
        passwordHash,
        parseInt(grade_id),
        db.dbType === 'sqlite' ? 0 : false,
        parent_phone || '0000000000',
        address || 'غير محدد',
        national_id || Date.now().toString(),
        student_id || 'STU' + Date.now().toString().slice(-6),
        gender || 'male'
      ]
    );

    return res.json({ message: 'تم إنشاء الحساب بنجاح', redirect: '/login' });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب: ' + err.message });
  }
});

// LOGOUT API
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'تم تسجيل الخروج بنجاح', redirect: '/' });
});

// GRADES & SUBJECTS APIs
app.get('/api/grades', async (req, res) => {
  try {
    const grades = await db.query('SELECT * FROM grade ORDER BY order_num ASC');
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await db.query('SELECT DISTINCT subject FROM videos WHERE subject IS NOT NULL AND subject != ""');
    res.json(subjects.map(s => s.subject));
  } catch (err) {
    res.json(['اللغة العربية', 'اللغة الإنجليزية', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء']);
  }
});

// YOUTUBE & VIDEOS APIs
app.post('/api/upload/video', requireAdmin, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, grade_id, subject, video_url } = req.body;
    if (!title || !grade_id || !video_url) {
      return res.status(400).json({ error: 'العنوان، المرحلة الدراسية، ورابط الفيديو مطلوبة' });
    }

    const youtubeId = youtube.extractYouTubeId(video_url);
    const embedUrl = youtube.getEmbedUrl(video_url);
    
    let thumbnailPath = null;
    if (req.file) {
      thumbnailPath = `/uploads/${req.file.filename}`;
    } else if (youtubeId) {
      thumbnailPath = youtube.getThumbnailUrl(youtubeId, 'hq');
    }

    await db.query(
      `INSERT INTO videos (title, file_path, video_url, thumbnail_path, grade_id, subject, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, embedUrl, video_url, thumbnailPath, grade_id, subject || '', db.dbType === 'sqlite' ? 1 : true]
    );

    res.json({ message: 'تم إضافة الفيديو بنجاح عبر YouTube API' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const { grade_id, subject } = req.query;
    let sql = 'SELECT * FROM videos WHERE is_deleted = ? AND is_active = ?';
    let params = [db.dbType === 'sqlite' ? 0 : false, db.dbType === 'sqlite' ? 1 : true];

    if (grade_id) {
      sql += ' AND grade_id = ?';
      params.push(grade_id);
    }
    if (subject) {
      sql += ' AND subject = ?';
      params.push(subject);
    }
    sql += ' ORDER BY id DESC';

    const videosList = await db.query(sql, params);
    const processed = videosList.map(v => ({
      ...v,
      embed_url: youtube.getEmbedUrl(v.video_url || v.file_path),
      thumbnail: v.thumbnail_path || youtube.getThumbnailUrl(v.video_url || v.file_path)
    }));

    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/delete/video/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE videos SET is_deleted = ? WHERE id = ?', [db.dbType === 'sqlite' ? 1 : true, req.params.id]);
    res.json({ message: 'تم حذف الفيديو بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SHEETS APIs
app.post('/api/upload/sheet', requireAdmin, upload.single('sheet'), async (req, res) => {
  try {
    const { title, grade_id } = req.body;
    if (!title || !grade_id || !req.file) {
      return res.status(400).json({ error: 'جميع الحقول والملف مطلوبة' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    await db.query(
      'INSERT INTO sheets (title, file_path, grade_id, is_active) VALUES (?, ?, ?, ?)',
      [title, filePath, grade_id, db.dbType === 'sqlite' ? 1 : true]
    );
    res.json({ message: 'تم رفع الشيت بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sheets', async (req, res) => {
  try {
    const { grade_id } = req.query;
    let sql = 'SELECT * FROM sheets WHERE is_active = ?';
    let params = [db.dbType === 'sqlite' ? 1 : true];
    if (grade_id) {
      sql += ' AND grade_id = ?';
      params.push(grade_id);
    }
    sql += ' ORDER BY id DESC';
    const sheetsList = await db.query(sql, params);
    res.json(sheetsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EXAMS APIs
app.post('/api/upload/exam', requireAdmin, upload.single('exam'), async (req, res) => {
  try {
    const { title, grade_id, duration } = req.body;
    if (!title || !grade_id || !duration || !req.file) {
      return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }
    const filePath = `/uploads/${req.file.filename}`;
    await db.query(
      'INSERT INTO exams (title, file_path, grade_id, duration, is_active) VALUES (?, ?, ?, ?, ?)',
      [title, filePath, grade_id, duration, db.dbType === 'sqlite' ? 1 : true]
    );
    res.json({ message: 'تم إضافة الامتحان بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exams', async (req, res) => {
  try {
    const { grade_id } = req.query;
    let sql = 'SELECT * FROM exams WHERE is_deleted = ? AND is_active = ?';
    let params = [db.dbType === 'sqlite' ? 0 : false, db.dbType === 'sqlite' ? 1 : true];
    if (grade_id) {
      sql += ' AND grade_id = ?';
      params.push(grade_id);
    }
    const examsList = await db.query(sql, params);
    res.json(examsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEACHERS API
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await db.query('SELECT * FROM teachers WHERE is_active = ? ORDER BY order_num ASC', [db.dbType === 'sqlite' ? 1 : true]);
    res.json(teachers);
  } catch (err) {
    res.json([]);
  }
});

// USERS API (Admin Only)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await db.query('SELECT id, username, name, email, grade_id, is_admin, parent_phone, address, national_id, student_id FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).send('<h2>404 - الصفحة غير موجودة</h2><p><a href="/">العودة للرئيسية</a></p>');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Node.js Express Server is running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});
