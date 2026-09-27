from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, send_from_directory, session
from flask_login import login_user, logout_user, login_required, current_user
from models import db, Users, grade
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

auth_bp = Blueprint('auth', __name__)

# صفحات HTML
@auth_bp.route('/login', methods=['GET'])
def login_page():
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin_workspace'))
        return redirect(url_for('index'))
    return render_template('auth/login.html')

@auth_bp.route('/login')
def login_redirect():
    return redirect(url_for('auth.login_page'))

@auth_bp.route('/admin/login', methods=['GET'])
def admin_login_page():
    if current_user.is_authenticated and current_user.is_admin:
        return redirect(url_for('admin_workspace'))
    return render_template('auth/loginadmin.html')

@auth_bp.route('/register', methods=['GET'])
def register_page():
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin_workspace'))
        return redirect(url_for('index'))
    return render_template('auth/register.html')

@auth_bp.route('/register')
def register_redirect():
    return redirect(url_for('auth.register_page'))

@auth_bp.route('/forgot-password')
def forgot_password():
    return render_template('auth/forgot-password.html')

@auth_bp.route('/welcome', methods=['GET'])
@login_required
def welcome_page():
    if current_user.is_admin:
        return redirect(url_for('admin_workspace'))
    return render_template('pages/welcome.html')

# API تسجيل الطالب
@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json or request.form
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'اسم المستخدم وكلمة المرور مطلوبان'}), 400
    user = Users.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        # Single session logic
        user.session_token = str(uuid.uuid4())
        db.session.commit()
        session['session_token'] = user.session_token
        login_user(user)
        return jsonify({
            'message': 'تم تسجيل الدخول بنجاح',
            'is_admin': user.is_admin,
            'user_id': user.id,
            'username': user.username,
            'name': user.name,
            'redirect': url_for('index')
        })
    return jsonify({'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'}), 401

# API تسجيل الأدمن
@auth_bp.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json or request.form
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'اسم المستخدم وكلمة المرور مطلوبان'}), 400
    user = Users.query.filter_by(username=data['username'], is_admin=True).first()
    if user and user.check_password(data['password']):
        # Single session logic
        user.session_token = str(uuid.uuid4())
        db.session.commit()
        session['session_token'] = user.session_token
        login_user(user)
        return jsonify({
            'message': 'تم تسجيل دخول المدير بنجاح',
            'user_id': user.id,
            'username': user.username,
            'name': user.name,
            'redirect': url_for('admin_workspace')
        })
    return jsonify({'error': 'بيانات المدير غير صحيحة'}), 401

# API تسجيل طالب جديد
@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json or request.form
        required_fields = ['username', 'name', 'parent_name', 'email', 'password', 'grade_id', 'parent_phone', 'national_id', 'student_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'حقل {field} مطلوب'}), 400
        # التحقق من تطابق كلمات المرور
        if data.get('password') != data.get('confirm_password'):
            return jsonify({'error': 'كلمات المرور غير متطابقة'}), 400
        # التحقق من عدم تكرار البيانات
        if Users.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'اسم المستخدم مستخدم من قبل'}), 400
        if Users.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'الإيميل مستخدم من قبل'}), 400
        if Users.query.filter_by(national_id=data['national_id']).first():
            return jsonify({'error': 'الرقم القومي موجود من قبل'}), 400
        if Users.query.filter_by(student_id=data['student_id']).first():
            return jsonify({'error': 'رقم الطالب موجود من قبل'}), 400
        user = Users(
            username=data['username'],
            name=data['name'],
            parent_name=data['parent_name'],
            email=data['email'],
            grade_id=int(data['grade_id']),
            parent_phone=data['parent_phone'],
            address=data.get('address', ''),
            national_id=data['national_id'],
            student_id=data['student_id'],
            gender=data.get('gender', 'male'),
            is_admin=False
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'تم تسجيل الطالب بنجاح', 'redirect': url_for('auth.login_page')})
    except Exception as e:
        import traceback
        print('Registration error:', e)
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': f'حدث خطأ أثناء التسجيل: {str(e)}'}), 500

# تسجيل الخروج
@auth_bp.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    session.pop('session_token', None)
    return jsonify({'message': 'تم تسجيل الخروج بنجاح', 'redirect': url_for('index')})

@auth_bp.route('/logout')
@login_required
def logout_page():
    logout_user()
    session.pop('session_token', None)
    return redirect(url_for('index'))

# التحقق من تسجيل الدخول
@auth_bp.route('/api/check-auth', methods=['GET'])
def check_auth():
    if current_user.is_authenticated:
        user_grade = grade.query.get(current_user.grade_id)
        grade_name = user_grade.grade if user_grade else None
        return jsonify({
            'authenticated': True,
            'is_admin': current_user.is_admin,
            'user_id': current_user.id,
            'username': current_user.username,
            'name': current_user.name,
            'grade_id': current_user.grade_id,
            'grade_name': grade_name
        })
    return jsonify({'authenticated': False}), 401 

@auth_bp.before_app_request
def enforce_single_session():
    from flask_login import current_user, logout_user
    from flask import redirect, url_for, flash, request, session
    if current_user.is_authenticated:
        # لا تتحقق في صفحات تسجيل الدخول والخروج
        if request.endpoint and (
            request.endpoint.startswith('auth.login') or
            request.endpoint.startswith('auth.logout') or
            request.endpoint.startswith('static')
        ):
            return
        # تحقق من session_token
        if session.get('session_token') != current_user.session_token:
            logout_user()
            session.pop('session_token', None)
            flash('تم تسجيل الدخول من جهاز آخر', 'warning')
            return redirect(url_for('auth.login_page')) 