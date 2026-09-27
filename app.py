import os
from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
from bunny_uploader import bunny_uploader
import string
from models import db, Users, grade, videos, sheets, exams, answers, books, access_codes, students_views, scores, questions, answers_options, videos_views, teachers, online_exams, exam_questions, question_options, exam_results, user_answers
from auth import auth_bp
from PIL import Image
import io
import yagmail
import uuid
import json
import time
import sqlite3
import cloudinary
import cloudinary.uploader
import cloudinary.api
import click
from flask.cli import with_appcontext

# إعداد Cloudinary (استبدل القيم بقيم حسابك)
cloudinary.config(
  cloud_name = 'dqeiddmf1',
  api_key = '866754383474376',
  api_secret = 'JKO6UQCHw_vYfzYd4JdlcHsyZUQ',
  secure = True
)


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///knowledge.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'doc', 'docx'}
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'

# إعدادات لحل مشكلة التخزين المؤقت
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Route لحل مشكلة التخزين المؤقت للملفات الثابتة
@app.route('/static/<path:filename>')
def static_files(filename):
    response = send_from_directory('static', filename)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

db.init_app(app)
app.register_blueprint(auth_bp)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login_page'
login_manager.login_message = 'يجب تسجيل الدخول للوصول لهذه الصفحة'
login_manager.login_message_category = 'warning'

RESET_TOKEN_FILE = 'reset_token.json'

def load_tokens():
    try:
        with open(RESET_TOKEN_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_tokens(tokens):
    with open(RESET_TOKEN_FILE, 'w', encoding='utf-8') as f:
        json.dump(tokens, f, ensure_ascii=False, indent=2)

@login_manager.user_loader
def load_user(user_id):
    return Users.query.get(int(user_id))

# Admin required decorator
def admin_required(f):
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            flash('يجب أن تكون مدير للوصول لهذه الصفحة', 'error')
            return redirect(url_for('auth.login_page'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Helper function
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def process_thumbnail(image_file, target_size=(320, 180)):
    """
    معالجة الصورة المصغرة وتغيير حجمها إلى الأبعاد المثالية
    target_size: (width, height) - الأبعاد المطلوبة (16:9 ratio)
    """
    try:
        # فتح الصورة
        image = Image.open(image_file)
        
        # تحويل إلى RGB إذا كانت PNG مع شفافية
        if image.mode in ('RGBA', 'LA', 'P'):
            # إنشاء خلفية بيضاء
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # تغيير الحجم مع الحفاظ على النسبة
        image.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # إنشاء صورة جديدة بالأبعاد المطلوبة مع خلفية سوداء
        new_image = Image.new('RGB', target_size, (0, 0, 0))
        
        # حساب الموقع لتوسيط الصورة
        x = (target_size[0] - image.size[0]) // 2
        y = (target_size[1] - image.size[1]) // 2
        
        # لصق الصورة في المنتصف
        new_image.paste(image, (x, y))
        
        return new_image
        
    except Exception as e:
        print(f"خطأ في معالجة الصورة المصغرة: {e}")
        return None

@app.route("/forgot-password", methods=["GET", "POST"])
def   forgot_password():
    if request.method == "POST":
        email = request.form["email"]
        token = str(uuid.uuid4())
        tokens = load_tokens()
        tokens[token] = {"email": email, "timestamp": time.time()}
        save_tokens(tokens)

        reset_link = f"http://www.center-knowledg.site/reset-password/{token}"

        try:
            # إعداد Gmail مع App Password
            yag = yagmail.SMTP(
                user="Knowledge.center2026@gmail.com",
                password="iggr keyf fzjb szyi",  # App Password
                host="smtp.gmail.com",
                port=587,
                smtp_starttls=True,
                smtp_ssl=False
            )
            
            yag.send(
                to=email,
                subject="إعادة تعيين كلمة المرور - Knowledge Center",
                contents=f"""
                مرحباً،
                
                لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.
                
                انقر على الرابط التالي لإعادة تعيين كلمة المرور:
                {reset_link}
                
                هذا الرابط صالح لمدة 30 دقيقة فقط.
                
                إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني.
                
                مع تحيات،
                فريق Knowledge Center
                """
            )
            flash("تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني.", "success")
        except Exception as e:
            print(f"Email error: {e}")
            flash(f"خطأ في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى.", "danger")

    return render_template('auth/forgot-password.html')

def update_password(email, new_password):
    user = Users.query.filter_by(email=email).first()
    if not user:
        return False
    user.set_password(new_password)
    db.session.commit()
    return True

@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    try:
        print(f"Reset password request for token: {token}")
        tokens = load_tokens()
        if token not in tokens:
            print(f"Token not found: {token}")
            flash("الرابط غير صحيح أو منتهي الصلاحية.", "danger")
            return redirect(url_for('auth.login_page'))

        if time.time() - tokens[token]["timestamp"] > 1800:  # 30 minutes
            print(f"Token expired: {token}")
            tokens.pop(token)
            save_tokens(tokens)
            flash("انتهت صلاحية الرابط. يرجى طلب رابط جديد.", "danger")
            return redirect(url_for('auth.login_page'))

        if request.method == "POST":
            new_password = request.form.get("password")
            confirm_password = request.form.get("confirm_password")
            
            print(f"Password reset attempt - Password length: {len(new_password) if new_password else 0}")
            
            if not new_password or not confirm_password:
                flash("جميع الحقول مطلوبة.", "danger")
                return render_template('auth/reset-password.html', token=token)
            
            if new_password != confirm_password:
                flash("كلمات المرور غير متطابقة.", "danger")
                return render_template('auth/reset-password.html', token=token)
            
            if len(new_password) < 6:
                flash("كلمة المرور يجب أن تكون 6 أحرف على الأقل.", "danger")
                return render_template('auth/reset-password.html', token=token)
            
            email = tokens[token]["email"]
            print(f"Attempting to update password for email: {email}")
            
            if update_password(email, new_password):
                tokens.pop(token)
                save_tokens(tokens)
                flash("تم إعادة تعيين كلمة المرور بنجاح!", "success")
                return redirect(url_for('auth.login_page'))
            else:
                flash("حدث خطأ أثناء إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.", "danger")
        
        return render_template('auth/reset-password.html', token=token)
    except Exception as e:
        print(f"Error in reset_password: {e}")
        flash("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.", "danger")
        return render_template('auth/reset-password.html', token=token)

# Routes for uploading and listing
@app.route('/api/upload/video', methods=['POST'])
@admin_required
def upload_video():
    title = request.form.get('title', '')
    grade_id = request.form.get('grade_id', type=int)
    subject = request.form.get('subject', '')  # المادة الدراسية
    file = request.files.get('video')
    thumbnail = request.files.get('thumbnail')  # الصورة المصغرة (رفع جديد)
    thumbnail_from_uploads = request.form.get('thumbnail_from_uploads', '')  # اسم صورة من uploads
    video_url = request.form.get('video_url', '')

    if not title or grade_id is None or not file or not subject:
        return jsonify({'error': 'جميع الحقول مطلوبة'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # رفع الفيديو إلى Bunny.net
        try:
            video_upload_result = bunny_uploader.upload_file(file_path, f"videos/{filename}")
            if not video_upload_result:
                return jsonify({'error': 'فشل في رفع الفيديو إلى Bunny.net'}), 500
            
            # حذف الملف المحلي بعد رفعه بنجاح
            retry_delete_file(file_path)
            
            # معالجة الصورة المصغرة
            thumbnail_path = None
            if thumbnail and allowed_file(thumbnail.filename):
                try:
                    processed_image = process_thumbnail(thumbnail, target_size=(320, 180))
                    if processed_image:
                        thumbnail_filename = f"thumb_{secure_filename(thumbnail.filename)}"
                        if not thumbnail_filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                            thumbnail_filename += '.jpg'
                        processed_image.save(os.path.join(app.config['UPLOAD_FOLDER'], thumbnail_filename), 'JPEG', quality=85, optimize=True)
                        # رفع الصورة المصغرة إلى Bunny.net
                        thumbnail_upload_result = bunny_uploader.upload_file(
                            os.path.join(app.config['UPLOAD_FOLDER'], thumbnail_filename), 
                            f"thumbnails/{thumbnail_filename}"
                        )
                        if not thumbnail_upload_result:
                            return jsonify({'error': 'فشل في رفع الصورة المصغرة إلى Bunny.net'}), 500
                        # حذف الملف المحلي
                        try:
                            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], thumbnail_filename))
                        except Exception as e:
                            print(f"خطأ في حذف الصورة المصغرة المحلية: {e}")
                        thumbnail_path = thumbnail_upload_result['url']
                    else:
                        return jsonify({'error': 'فشل في معالجة الصورة المصغرة'}), 500
                except Exception as e:
                    return jsonify({'error': f'خطأ في معالجة أو رفع الصورة المصغرة: {str(e)}'}), 500
            elif thumbnail_from_uploads:
                thumbnail_path = thumbnail_from_uploads
            # إذا لم يحدد صورة، thumbnail_path تبقى None
            
            video = videos(
                title=title,
                file_path=video_upload_result['url'],  # استخدام URL من Bunny.net
                video_url=video_url,
                thumbnail_path=thumbnail_path,  # قد تكون None أو اسم صورة من uploads أو URL من Bunny.net
                grade_id=grade_id,
                subject=subject,  # إضافة المادة
                is_active=True
            )
            db.session.add(video)
            db.session.commit()
            return jsonify({'message': 'تم رفع الفيديو بنجاح'})
        except Exception as e:
            # في حالة الخطأ، حذف الملف المحلي
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'خطأ في رفع الفيديو: {str(e)}'}), 500
    return jsonify({'error': 'ملف غير مدعوم'}), 400

@app.route('/api/videos', methods=['GET'])
def list_videos():
    grade_id = request.args.get('grade_id', type=int)
    subject = request.args.get('subject', '')  # فلتر المادة
    
    query = videos.query.filter_by(is_deleted=False, is_active=True)
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    if subject:
        query = query.filter_by(subject=subject)
    
    videos_list = query.all()
    return jsonify([{
        'id': v.id,
        'title': v.title,
        'file_path': v.file_path,
        'video_url': v.video_url,
        'thumbnail_path': v.thumbnail_path,
        'grade_id': v.grade_id,
        'grade_name': (
            (g.grade if (g := grade.query.get(v.grade_id)) else f'Grade {v.grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ),
        'subject': v.subject,
        'views_count': v.views_count,
        'is_active': v.is_active,
        'created_at': v.created_at.isoformat() if v.created_at else None
    } for v in videos_list])

@app.route('/api/upload/sheet', methods=['POST'])
@admin_required
def upload_sheet():
    title = request.form.get('title', '')
    grade_id = request.form.get('grade_id', type=int)
    file = request.files.get('sheet')
    
    if not title or grade_id is None or not file:
        return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # رفع الملف إلى Bunny.net
        try:
            file_upload_result = bunny_uploader.upload_file(file_path, f"sheets/{filename}")
            if not file_upload_result:
                return jsonify({'error': 'فشل في رفع الملف إلى Bunny.net'}), 500
            
            # حذف الملف المحلي بعد رفعه بنجاح
            retry_delete_file(file_path)
            
            sheet = sheets(
                title=title,
                file_path=file_upload_result['url'],  # استخدام URL من Bunny.net
                grade_id=grade_id,
                is_active=True
            )
            db.session.add(sheet)
            db.session.commit()
            return jsonify({'message': 'تم رفع الورقة بنجاح'})
        except Exception as e:
            # في حالة الخطأ، حذف الملف المحلي
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'خطأ في رفع الملف: {str(e)}'}), 500
    return jsonify({'error': 'ملف غير مدعوم'}), 400

@app.route('/api/sheets', methods=['GET'])
def list_sheets():
    grade_id = request.args.get('grade_id', type=int)
    # للأدمن نعرض جميع الشيتات، للطلاب نعرض النشطة فقط
    if current_user.is_authenticated and current_user.is_admin:
        query = sheets.query
    else:
        query = sheets.query.filter_by(is_active=True)
    
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    sheets_list = query.all()
    return jsonify([{
        'id': s.id,
        'title': s.title,
        'file_path': s.file_path,
        'grade_id': s.grade_id,
        'grade_name': (
            (g.grade if (g := grade.query.get(s.grade_id)) else f'Grade {s.grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ),
        'created_at': s.created_at.isoformat() if s.created_at else None,
        'is_active': s.is_active
    } for s in sheets_list])

@app.route('/api/upload/exam', methods=['POST'])
@admin_required
def upload_exam():
    title = request.form.get('title', '')
    grade_id = request.form.get('grade_id', type=int)
    duration = request.form.get('duration', type=int)
    file = request.files.get('exam')
    
    if not title or grade_id is None or duration is None or not file:
        return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # رفع الملف إلى Bunny.net
        try:
            file_upload_result = bunny_uploader.upload_file(file_path, f"exams/{filename}")
            if not file_upload_result:
                return jsonify({'error': 'فشل في رفع الملف إلى Bunny.net'}), 500
            
            # حذف الملف المحلي بعد رفعه بنجاح
            retry_delete_file(file_path)
            
            exam = exams(
                title=title,
                file_path=file_upload_result['url'],  # استخدام URL من Bunny.net
                grade_id=grade_id,
                duration=duration,
                is_active=True
            )
            db.session.add(exam)
            db.session.commit()
            return jsonify({'message': 'تم رفع الامتحان بنجاح'})
        except Exception as e:
            # في حالة الخطأ، حذف الملف المحلي
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'خطأ في رفع الملف: {str(e)}'}), 500
    return jsonify({'error': 'ملف غير مدعوم'}), 400

@app.route('/api/upload/answer', methods=['POST'])
@admin_required
def upload_answer():
    title = request.form.get('title', '')
    grade_id = request.form.get('grade_id', type=int)
    file = request.files.get('answer')
    
    if not title or grade_id is None or not file:
        return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # رفع الملف إلى Bunny.net
        try:
            file_upload_result = bunny_uploader.upload_file(file_path, f"answers/{filename}")
            if not file_upload_result:
                return jsonify({'error': 'فشل في رفع الملف إلى Bunny.net'}), 500
            
            # حذف الملف المحلي بعد رفعه بنجاح
            retry_delete_file(file_path)
            
            answer = answers(
                title=title,
                file_path=file_upload_result['url'],  # استخدام URL من Bunny.net
                grade_id=grade_id,
                is_active=True
            )
            db.session.add(answer)
            db.session.commit()
            return jsonify({'message': 'تم رفع النموذج بنجاح'})
        except Exception as e:
            # في حالة الخطأ، حذف الملف المحلي
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'خطأ في رفع الملف: {str(e)}'}), 500
    return jsonify({'error': 'ملف غير مدعوم'}), 400

@app.route('/api/answers', methods=['GET'])
def list_answers():
    grade_id = request.args.get('grade_id', type=int)
    query = answers.query.filter_by(is_active=True)
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    answers_list = query.all()
    return jsonify([{
        'id': a.id, 
        'title': a.title, 
        'file_path': a.file_path,
        'grade_id': a.grade_id,
        'grade_name': grade.query.get(a.grade_id).grade if grade.query.get(a.grade_id) else f'Grade {a.grade_id}',
        'created_at': a.created_at.isoformat() if a.created_at else None
    } for a in answers_list])

@app.route('/api/upload/book', methods=['POST'])
@admin_required
def upload_book():
    try:
        title = request.form.get('title', '')
        grade_id = request.form.get('grade_id', type=int)
        price = request.form.get('price', type=int)
        image = request.files.get('image')
        
        print(f"بيانات الكتاب المستلمة: title={title}, grade_id={grade_id}, price={price}, image={image}")
        
        if not title or grade_id is None or price is None or not image:
            error_msg = f"الحقول المطلوبة: title={bool(title)}, grade_id={grade_id is not None}, price={price is not None}, image={image is not None}"
            print(f"خطأ في البيانات: {error_msg}")
            return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
        
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            print(f"حفظ الصورة في: {image_path}")
            image.save(image_path)
            # رفع الصورة إلى Bunny.net
            try:
                image_upload_result = bunny_uploader.upload_file(image_path, f"books/{filename}")
                if not image_upload_result:
                    return jsonify({'error': 'فشل في رفع الصورة إلى Bunny.net'}), 500
                # حذف الملف المحلي بعد رفعه بنجاح
                retry_delete_file(image_path)
                book = books(
                    title=title,
                    image_path=image_upload_result['url'],  # استخدام URL من Bunny.net
                    price=price,
                    grade_id=grade_id
                )
                db.session.add(book)
                db.session.commit()
                print(f"تم حفظ الكتاب بنجاح: {book.id}")
                return jsonify({'message': 'تم رفع الكتاب بنجاح'})
            except Exception as e:
                if os.path.exists(image_path):
                    os.remove(image_path)
                return jsonify({'error': f'خطأ في رفع الصورة: {str(e)}'}), 500
        else:
            return jsonify({'error': 'ملف غير مدعوم أو غير موجود'}), 400
    except Exception as e:
        print(f"خطأ في رفع الكتاب: {str(e)}")
        return jsonify({'error': f'خطأ في الخادم: {str(e)}'}), 500

@app.route('/api/books', methods=['GET'])
def list_books():
    grade_id = request.args.get('grade_id', type=int)
    query = books.query
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    books_list = query.all()
    return jsonify([{
        'id': b.id,
        'title': b.title,
        'image_path': b.image_path,
        'price': b.price,
        'grade_id': b.grade_id,
        'grade_name': (
            (g.grade if (g := grade.query.get(b.grade_id)) else f'Grade {b.grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ),
        'filename': os.path.basename(b.image_path) if b.image_path else None
    } for b in books_list])

@app.route('/api/exams', methods=['GET'])
def list_exams():
    grade_id = request.args.get('grade_id', type=int)
    query = exams.query.filter_by(is_deleted=False, is_active=True)
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    exams_list = query.all()
    return jsonify([{
        'id': e.id,
        'title': e.title,
        'file_path': e.file_path,
        'grade_id': e.grade_id,
        'grade_name': (
            (g.grade if (g := grade.query.get(e.grade_id)) else f'Grade {e.grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ),
        'duration': e.duration,
        'is_deleted': e.is_deleted,
        'is_active': e.is_active,
        'created_at': e.created_at.isoformat() if e.created_at else None
    } for e in exams_list])

@app.route('/api/generate-code', methods=['POST'])
@admin_required
def generate_code():
    count = request.form.get('count', type=int)
    grade_id = request.form.get('grade_id', type=int)
    expire_days = request.form.get('expire_days', 30, type=int)
    
    if count is None or grade_id is None:
        return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
    
    codes = []
    for _ in range(count):
        code_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        expire_date = datetime.utcnow() + timedelta(days=expire_days)
        
        code = access_codes(
            code=code_str,
            grade_id=grade_id,
            is_active=True,
            expire_date=expire_date
        )
        db.session.add(code)
        codes.append(code_str)
    
    db.session.commit()
    return jsonify({'codes': codes})

@app.route('/api/codes', methods=['GET'])
@admin_required
def list_codes():
    grade_id = request.args.get('grade_id', type=int)
    query = access_codes.query.filter_by(is_deleted=False)
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    codes_list = query.all()
    return jsonify([{
        'id': c.id,
        'code': c.code,
        'grade_id': c.grade_id,
        'grade_name': (
            (g.grade if (g := grade.query.get(c.grade_id)) else f'Grade {c.grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ),
        'is_active': c.is_active,
        'is_used': c.is_used,
        'user_id': c.user_id,
        'expire_date': c.expire_date.isoformat() if c.expire_date else None,
        'created_at': c.created_at.isoformat() if c.created_at else None,
        'used_at': c.used_at.isoformat() if c.used_at else None
    } for c in codes_list])

@app.route('/api/grades', methods=['GET'])
def list_grades():
    try:
        grades = grade.query.order_by(grade.order_num).all()
        
        # Return flat list for better frontend compatibility
        grades_list = []
        for g in grades:
            grade_data = {
                'id': g.id,
                'grade': g.grade,
                'system': g.system,
                'category': g.category,
                'level': g.level,
                'order_num': g.order_num
            }
            grades_list.append(grade_data)
        
        return jsonify(grades_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/subjects', methods=['GET'])
def list_subjects():
    """API للحصول على قائمة المواد الدراسية"""
    try:
        # الحصول على جميع المواد الفريدة من الفيديوهات
        subjects = db.session.query(videos.subject).filter(
            videos.subject.isnot(None),
            videos.subject != '',
            videos.is_deleted == False,
            videos.is_active == True
        ).distinct().all()
        
        # تحويل النتائج إلى قائمة بسيطة
        subjects_list = [subject[0] for subject in subjects if subject[0]]
        subjects_list.sort()  # ترتيب المواد أبجدياً
        
        return jsonify(subjects_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/grade/<int:grade_id>', methods=['GET'])
def get_grade_info(grade_id):
    """API للحصول على معلومات المرحلة"""
    try:
        grade_info = grade.query.get(grade_id)
        if not grade_info:
            return jsonify({'error': 'المرحلة غير موجودة'}), 404
        
        return jsonify({
            'id': grade_info.id,
            'grade': grade_info.grade,
            'system': grade_info.system,
            'category': grade_info.category,
            'level': grade_info.level,
            'order_num': grade_info.order_num
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
@admin_required
def list_users():
    grade_id = request.args.get('grade_id', type=int)
    user_id = request.args.get('user_id', type=int)
    
    query = Users.query
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    if user_id:
        query = query.filter_by(id=user_id)
    
    users_list = query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'name': u.name,
        'parent_name': u.parent_name,
        'email': u.email,
        'grade_id': u.grade_id,
        'grade_name': (
            (g.grade if (g := grade.query.get(u.grade_id)) else f'Grade {u.grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ),
        'is_admin': u.is_admin,
        'parent_phone': u.parent_phone,
        'address': u.address,
        'national_id': u.national_id,
        'student_id': u.student_id
    } for u in users_list])

@app.route('/api/delete/video/<int:video_id>', methods=['DELETE'])
@admin_required
def delete_video(video_id):
    video = videos.query.get_or_404(video_id)
    
    # حذف الملف من Bunny.net إذا كان URL
    if video.file_path and video.file_path.startswith('http'):
        try:
            # استخراج مسار الملف من URL
            file_path = video.file_path.split('/')[-1]  # اسم الملف فقط
            bunny_uploader.delete_file(f"videos/{file_path}")
        except Exception as e:
            print(f"خطأ في حذف الملف من Bunny.net: {e}")
    
    # حذف الصورة المصغرة من Bunny.net إذا كانت URL
    if video.thumbnail_path and video.thumbnail_path.startswith('http'):
        try:
            # استخراج مسار الملف من URL
            thumbnail_path = video.thumbnail_path.split('/')[-1]  # اسم الملف فقط
            bunny_uploader.delete_file(f"thumbnails/{thumbnail_path}")
        except Exception as e:
            print(f"خطأ في حذف الصورة المصغرة من Bunny.net: {e}")
    
    video.is_deleted = True
    db.session.commit()
    return jsonify({'message': 'تم حذف الفيديو بنجاح'})

@app.route('/api/delete/exam/<int:exam_id>', methods=['DELETE'])
@admin_required
def delete_exam(exam_id):
    exam = exams.query.get_or_404(exam_id)
    
    # حذف الملف من Bunny.net إذا كان URL
    if exam.file_path and exam.file_path.startswith('http'):
        try:
            # استخراج مسار الملف من URL
            file_path = exam.file_path.split('/')[-1]  # اسم الملف فقط
            bunny_uploader.delete_file(f"exams/{file_path}")
        except Exception as e:
            print(f"خطأ في حذف الملف من Bunny.net: {e}")
    
    exam.is_deleted = True
    db.session.commit()
    return jsonify({'message': 'تم حذف الامتحان بنجاح'})

@app.route('/api/delete/sheet/<int:sheet_id>', methods=['DELETE'])
@admin_required
def delete_sheet(sheet_id):
    sheet = sheets.query.get_or_404(sheet_id)
    
    # حذف الملف من Bunny.net إذا كان URL
    if sheet.file_path and sheet.file_path.startswith('http'):
        try:
            # استخراج مسار الملف من URL
            file_path = sheet.file_path.split('/')[-1]  # اسم الملف فقط
            bunny_uploader.delete_file(f"sheets/{file_path}")
        except Exception as e:
            print(f"خطأ في حذف الملف من Bunny.net: {e}")
    
    sheet.is_active = False
    db.session.commit()
    return jsonify({'message': 'تم حذف الورقة بنجاح'})

@app.route('/api/delete/book/<int:book_id>', methods=['DELETE'])
@admin_required
def delete_book(book_id):
    book = books.query.get_or_404(book_id)
    
    # حذف الصورة من Bunny.net إذا كانت URL
    if book.image_path and book.image_path.startswith('http'):
        try:
            # استخراج مسار الملف من URL
            file_path = book.image_path.split('/')[-1]  # اسم الملف فقط
            bunny_uploader.delete_file(f"books/{file_path}")
        except Exception as e:
            print(f"خطأ في حذف الصورة من Bunny.net: {e}")
    
    db.session.delete(book)
    db.session.commit()
    return jsonify({'message': 'تم حذف الكتاب بنجاح'})

@app.route('/api/delete/code/<int:code_id>', methods=['DELETE'])
@admin_required
def delete_code(code_id):
    code = access_codes.query.get_or_404(code_id)
    code.is_deleted = True
    db.session.commit()
    return jsonify({'message': 'تم حذف الكود بنجاح'})

@app.route('/api/delete/user/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = Users.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'تم حذف المستخدم بنجاح'})

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'تم تسجيل الخروج بنجاح'})

@app.route('/api/activate-code', methods=['POST'])
@login_required
def activate_code():
    if current_user.is_admin:
        return jsonify({'error': 'الأدمن لا يحتاج لتفعيل كود'}), 400
    
    data = request.json
    code_str = data.get('code')
    
    if not code_str:
        return jsonify({'error': 'الكود مطلوب'}), 400
    
    # Find the code in database
    code = access_codes.query.filter_by(
        code=code_str, 
        is_active=True, 
        is_deleted=False,
        is_used=False
    ).first()
    
    if not code:
        return jsonify({'error': 'الكود غير صحيح أو مستخدم من قبل'}), 400
    
    # Check if code is expired
    if code.expire_date and code.expire_date < datetime.utcnow():
        return jsonify({'error': 'الكود منتهي الصلاحية'}), 400
    
    # Check if code matches user's grade
    if code.grade_id != current_user.grade_id:
        return jsonify({'error': 'الكود لا يتناسب مع مرحلتك الدراسية'}), 400
    
    # Activate the code
    code.is_used = True
    code.user_id = current_user.id
    code.used_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'تم تفعيل الكود بنجاح',
        'expire_date': code.expire_date.isoformat() if code.expire_date else None
    })

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/video/<int:video_id>')
def serve_video(video_id):
    """Route مخصص لتحميل الفيديو حسب ID"""
    video = videos.query.get_or_404(video_id)
    if video.is_deleted or not video.is_active:
        return jsonify({'error': 'الفيديو غير متاح'}), 404
    
    # الحصول على اسم الملف من المسار الكامل
    filename = os.path.basename(video.file_path)
    response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/sheet/<int:sheet_id>')
def serve_sheet(sheet_id):
    """Route مخصص لتحميل الشيت حسب ID"""
    sheet = sheets.query.get_or_404(sheet_id)
    if not sheet.is_active:
        return jsonify({'error': 'الشيت غير متاح'}), 404
    
    # الحصول على اسم الملف من المسار الكامل
    filename = os.path.basename(sheet.file_path)
    response = send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# الصفحة الرئيسية
@app.route('/')
@app.route('/index')
def index():
    return render_template('pages/index.html')

# صفحة الترحيب (للطلاب بعد تسجيل الدخول)
@app.route('/welcome')
@login_required
def welcome():
    if current_user.is_admin:
        return redirect(url_for('admin_workspace'))
    return render_template('pages/welcome.html')

# صفحة إدارة الأدمن
@app.route('/admin/workspace')
@admin_required
def admin_workspace():
    return render_template('admin/workspace.html')

# Helper function to check if user has valid access code
def check_user_access_code(user_id):
    """Check if user has a valid, non-expired access code"""
    if not user_id:
        return False
    
    # Find the most recent valid access code for this user
    valid_code = access_codes.query.filter_by(
        user_id=user_id,
        is_used=True,
        is_deleted=False
    ).order_by(access_codes.used_at.desc()).first()
    
    if not valid_code:
        return False
    
    # Check if code is expired
    if valid_code.expire_date and valid_code.expire_date < datetime.utcnow():
        return False
    
    return True

# صفحة داشبورد الطالب (إذا احتجنا لها مستقبلاً)
@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.is_admin:
        return redirect(url_for('admin_workspace'))
    
    # Check if user has activated a valid code
    if not check_user_access_code(current_user.id):
        flash('يجب عليك تفعيل كود صالح للوصول للداشبورد', 'warning')
        return redirect(url_for('welcome'))
    
    return render_template('dashboard/dashboarduser.html')

@app.route('/books')
def books_page():
    return render_template('pages/book.html')

@app.route('/profile')
@login_required
def profile():
    if current_user.is_admin:
        return redirect(url_for('admin_workspace'))
    return render_template('pages/profile.html')

@app.route('/change-password')
@login_required
def change_password():
    if current_user.is_admin:
        return redirect(url_for('admin_workspace'))
    return render_template('auth/change-password.html')

@app.route('/terms')
def terms():
    return render_template('pages/terms.html')

@app.route('/exam')
@login_required
def exam():
    if current_user.is_admin:
        return redirect(url_for('admin_workspace'))
    return render_template('pages/exam.html')

@app.route('/api/check-code-status', methods=['GET'])
@login_required
def check_code_status():
    if current_user.is_admin:
        return jsonify({'has_valid_code': True, 'is_admin': True})
    
    # Find the most recent valid access code for this user
    valid_code = access_codes.query.filter_by(
        user_id=current_user.id,
        is_used=True,
        is_deleted=False
    ).order_by(access_codes.used_at.desc()).first()
    
    if not valid_code:
        return jsonify({
            'has_valid_code': False,
            'message': 'لم يتم تفعيل أي كود'
        })
    
    # Check if code is expired
    if valid_code.expire_date and valid_code.expire_date < datetime.utcnow():
        return jsonify({
            'has_valid_code': False,
            'message': 'الكود منتهي الصلاحية'
        })
    
    return jsonify({
        'has_valid_code': True,
        'expire_date': valid_code.expire_date.isoformat() if valid_code.expire_date else None,
        'days_remaining': (valid_code.expire_date - datetime.utcnow()).days if valid_code.expire_date else None
    })

@app.route('/api/check-auth', methods=['GET'])
@login_required
def check_auth():
    try:
        user_grade = grade.query.get(current_user.grade_id)
        return jsonify({
            'authenticated': True,
            'user_id': current_user.id,
            'username': current_user.username,
            'name': current_user.name,
            'grade_id': current_user.grade_id,
            'grade_name': user_grade.grade if user_grade else 'غير محدد',
            'is_admin': current_user.is_admin
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user-profile', methods=['GET'])
@login_required
def get_user_profile():
    try:
        user_grade = grade.query.get(current_user.grade_id)
        return jsonify({
            'username': current_user.username,
            'name': current_user.name,
            'address': current_user.address,
            'student_id': current_user.student_id,
            'father_phone': current_user.parent_phone,
            'grade_name': user_grade.grade if user_grade else 'غير محدد',
            'email': current_user.email,
            'parent_name': current_user.parent_name,
            'national_id': current_user.national_id,
            'gender': current_user.gender
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user-exam-results', methods=['GET'])
@login_required
def get_user_exam_results():
    try:
        # جلب نتائج الامتحانات للمستخدم الحالي
        user_scores = scores.query.filter_by(user_id=current_user.id).all()
        
        exam_results = []
        for score in user_scores:
            exam = exams.query.get(score.exam_id)
            if exam and not exam.is_deleted:
                # حساب النسبة المئوية
                total_questions = questions.query.filter_by(exam_id=exam.id, is_deleted=False).count()
                score_percentage = (score.score / total_questions * 100) if total_questions > 0 else 0
                
                exam_results.append({
                    'exam_name': exam.title,
                    'score': int(score.score),
                    'total_questions': total_questions,
                    'score_percentage': score_percentage,
                    'exam_date': score.created_at.isoformat() if hasattr(score, 'created_at') else None,
                    'mistakes': []  # يمكن إضافة تفاصيل الأخطاء لاحقاً
                })
        
        # ترتيب النتائج حسب التاريخ (الأحدث أولاً)
        exam_results.sort(key=lambda x: x['exam_date'], reverse=True)
        
        return jsonify(exam_results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Teachers Management Routes
@app.route('/api/teachers')
def get_teachers():
    try:
        # التحقق من نوع المدرسين المطلوب
        teacher_type = request.args.get('type', 'all')  # 'course' أو 'all'
        section_filter = request.args.get('section')  # فلترة حسب القسم
        
        if teacher_type == 'course':
            # فلترة مدرسي الكورسات فقط (الذين لديهم grade_id)
            teachers_list = teachers.query.filter(teachers.grade_id.isnot(None))
        else:
            # جميع المدرسين
            teachers_list = teachers.query
        
        # تطبيق فلترة القسم إذا تم تحديده
        if section_filter:
            teachers_list = teachers_list.filter(teachers.section == section_filter)
        
        teachers_list = teachers_list.all()
        
        teachers_data = []
        for teacher in teachers_list:
            grade_name = None
            if teacher.grade_id:
                grade_obj = grade.query.get(teacher.grade_id)
                grade_name = grade_obj.grade if grade_obj else None
            
            teachers_data.append({
                'id': teacher.id,
                'name': teacher.name,
                'subject': teacher.subject,
                'system': teacher.system,
                'grade_id': teacher.grade_id,
                'grade_name': grade_name,
                'section': teacher.section,
                'image_path': teacher.image_path,
                'image_url': teacher.image_path,  # تعديل هنا: دائماً رابط BunnyCDN
                'order_num': teacher.order_num
            })
        
        return jsonify(teachers_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teachers', methods=['POST'])
@admin_required
def create_teacher():
    try:
        name = request.form.get('name')
        subject = request.form.get('subject')
        section = request.form.get('section')
        order_num = request.form.get('order_num', type=int)
        grade_id = request.form.get('grade_id', type=int)
        system = request.form.get('system')
        file = request.files.get('image')
        
        if not all([name, subject]):
            return jsonify({'error': 'اسم المدرس والمادة مطلوبان'}), 400
        
        # إذا لم يتم رفع صورة، لا تسمح بالإضافة
        if not file or not allowed_file(file.filename):
            return jsonify({'error': 'يجب رفع صورة للمدرس (jpg, png, ...)' }), 400
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # رفع الصورة إلى Bunny.net
        image_upload_result = bunny_uploader.upload_file(file_path, f"teachers/{filename}")
        if not image_upload_result:
            return jsonify({'error': 'فشل في رفع الصورة إلى Bunny.net'}), 500
        
        # حذف الملف المحلي بعد رفعه بنجاح
        retry_delete_file(file_path)
        
        teacher = teachers(
            name=name,
            subject=subject,
            image_path=image_upload_result['url'],  # استخدام URL من Bunny.net
            section=section or 'course',
            order_num=order_num or 1,
            grade_id=grade_id,
            system=system
        )
        db.session.add(teacher)
        db.session.commit()
        
        return jsonify({'message': 'تم إضافة المدرس بنجاح'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teachers/<int:teacher_id>', methods=['PUT'])
@admin_required
def update_teacher(teacher_id):
    try:
        teacher = teachers.query.get_or_404(teacher_id)
        
        name = request.form.get('name')
        subject = request.form.get('subject')
        section = request.form.get('section')
        order_num = request.form.get('order_num', type=int)
        grade_id = request.form.get('grade_id', type=int)
        system = request.form.get('system')
        file = request.files.get('image')
        
        if name:
            teacher.name = name
        if subject:
            teacher.subject = subject
        if section:
            teacher.section = section
        if order_num is not None:
            teacher.order_num = order_num
        if grade_id is not None:
            teacher.grade_id = grade_id
        if system:
            teacher.system = system
        
        if file and allowed_file(file.filename):
            # حذف الصورة القديمة من Bunny.net إذا كانت URL
            if teacher.image_path and teacher.image_path.startswith('http'):
                try:
                    old_filename = os.path.basename(teacher.image_path)
                    bunny_uploader.delete_file(f"teachers/{old_filename}")
                except Exception as e:
                    print(f"خطأ في حذف الصورة القديمة من Bunny.net: {e}")
            
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # رفع الصورة الجديدة إلى Bunny.net
            try:
                image_upload_result = bunny_uploader.upload_file(file_path, f"teachers/{filename}")
                if not image_upload_result:
                    return jsonify({'error': 'فشل في رفع الصورة إلى Bunny.net'}), 500
                
                # حذف الملف المحلي بعد رفعه بنجاح
                retry_delete_file(file_path)
                
                teacher.image_path = image_upload_result['url']  # استخدام URL من Bunny.net
            except Exception as e:
                # في حالة الخطأ، حذف الملف المحلي
                if os.path.exists(file_path):
                    os.remove(file_path)
                return jsonify({'error': f'خطأ في رفع الصورة: {str(e)}'}), 500
        
        db.session.commit()
        return jsonify({'message': 'تم تحديث المدرس بنجاح'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teachers/<int:teacher_id>', methods=['DELETE'])
@admin_required
def delete_teacher(teacher_id):
    try:
        teacher = teachers.query.get_or_404(teacher_id)
        
        # حذف الصورة من Bunny.net إذا كانت URL
        if teacher.image_path and teacher.image_path.startswith('http'):
            try:
                filename = os.path.basename(teacher.image_path)
                bunny_uploader.delete_file(f"teachers/{filename}")
            except Exception as e:
                print(f"خطأ في حذف الصورة من Bunny.net: {e}")
        elif teacher.image_path and os.path.exists(teacher.image_path):
            os.remove(teacher.image_path)
        
        db.session.delete(teacher)
        db.session.commit()
        
        return jsonify({'message': 'تم حذف المدرس بنجاح'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teachers/<int:teacher_id>', methods=['GET'])
def get_teacher(teacher_id):
    try:
        teacher = teachers.query.get_or_404(teacher_id)
        return jsonify({
            'id': teacher.id,
            'name': teacher.name,
            'subject': teacher.subject,
            'image_path': teacher.image_path,  # رابط Cloudinary مباشرة
            'image_url': teacher.image_path,  # نفس الرابط (للتوافق مع الكود القديم)
            'section': teacher.section,
            'order_num': teacher.order_num,
            'grade_id': teacher.grade_id,
            'system': teacher.system
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API routes للامتحانات الإلكترونية
@app.route('/api/online-exams', methods=['GET'])
def list_online_exams():
    grade_id = request.args.get('grade_id', type=int)
    query = online_exams.query.filter_by(is_active=True)
    if grade_id:
        query = query.filter_by(grade_id=grade_id)
    exams_list = query.all()
    return jsonify([{
        'id': e.id,
        'title': e.title,
        'grade_id': e.grade_id,
        'grade_name': (
            (g.grade if (g := grade.query.get(e.grade_id)) else f'Grade {e.grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ),
        'duration': e.duration,
        'total_questions': e.total_questions,
        'created_at': e.created_at.isoformat() if e.created_at else None
    } for e in exams_list])

@app.route('/api/online-exams', methods=['POST'])
@admin_required
def create_online_exam():
    try:
        title = request.form.get('title')
        grade_id = request.form.get('grade_id')
        duration = request.form.get('duration')
        questions_json = request.form.get('questions', '[]')
        
        if not title or not grade_id or not duration:
            return jsonify({'error': 'جميع الحقول مطلوبة'}), 400
        
        try:
            questions = json.loads(questions_json)
        except json.JSONDecodeError:
            return jsonify({'error': 'خطأ في تنسيق بيانات الأسئلة'}), 400
        
        # إنشاء الامتحان
        exam = online_exams(
            title=title,
            grade_id=grade_id,
            duration=duration,
            total_questions=len(questions)
        )
        db.session.add(exam)
        db.session.flush()  # للحصول على ID الامتحان
        
        # إضافة الأسئلة والخيارات
        for i, q_data in enumerate(questions):
            # حفظ صورة السؤال إذا وجدت
            question_image_path = None
            image_key = f'question_image_{i}'
            if image_key in request.files:
                image_file = request.files[image_key]
                if image_file and image_file.filename:
                    filename = secure_filename(f"question_{exam.id}_{i}_{int(time.time())}_{image_file.filename}")
                    image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    image_file.save(image_path)
                    # رفع الصورة إلى Bunny.net
                    try:
                        image_upload_result = bunny_uploader.upload_file(image_path, f"questions/{filename}")
                        if not image_upload_result:
                            return jsonify({'error': 'فشل في رفع صورة السؤال إلى Bunny.net'}), 500
                        retry_delete_file(image_path)
                        question_image_path = image_upload_result['url']
                    except Exception as e:
                        if os.path.exists(image_path):
                            os.remove(image_path)
                        return jsonify({'error': f'خطأ في رفع صورة السؤال: {str(e)}'}), 500
            
            question = exam_questions(
                exam_id=exam.id,
                question_text=q_data['question'],
                question_image=question_image_path,
                question_number=i + 1
            )
            db.session.add(question)
            db.session.flush()
            
            # إضافة خيارات السؤال
            for option_data in q_data['options']:
                option = question_options(
                    question_id=question.id,
                    option_text=option_data['text'],
                    option_letter=option_data['letter'],
                    is_correct=option_data['is_correct']
                )
                db.session.add(option)
        
        db.session.commit()
        return jsonify({'message': 'تم إنشاء الامتحان بنجاح', 'exam_id': exam.id})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'خطأ في إنشاء الامتحان: {str(e)}'}), 500

@app.route('/api/online-exams/<int:exam_id>', methods=['GET'])
def get_online_exam(exam_id):
    try:
        exam = online_exams.query.get(exam_id)
        if not exam:
            return jsonify({'error': 'الامتحان غير موجود'}), 404
        
        questions = exam_questions.query.filter_by(exam_id=exam_id).order_by(exam_questions.question_number).all()
        
        if not questions:
            return jsonify({'error': 'لا توجد أسئلة في هذا الامتحان'}), 400
        
        exam_data = {
            'id': exam.id,
            'title': exam.title,
            'grade_id': exam.grade_id,
            'duration': exam.duration,
            'total_questions': exam.total_questions,
            'questions': []
        }
        
        for q in questions:
            options = question_options.query.filter_by(question_id=q.id).all()
            
            if not options:
                return jsonify({'error': f'لا توجد خيارات للسؤال رقم {q.question_number}'}), 400
            
            question_data = {
                'id': q.id,
                'question_number': q.question_number,
                'question_text': q.question_text,
                'question_image': q.question_image,
                'options': [{
                    'id': opt.id,
                    'letter': opt.option_letter,
                    'text': opt.option_text
                } for opt in options]
            }
            exam_data['questions'].append(question_data)
        
        return jsonify(exam_data)
        
    except Exception as e:
        print(f"Error in get_online_exam: {str(e)}")
        return jsonify({'error': f'خطأ في تحميل الامتحان: {str(e)}'}), 500

@app.route('/api/online-exams/<int:exam_id>/start', methods=['POST'])
@login_required
def start_online_exam(exam_id):
    exam = online_exams.query.get_or_404(exam_id)
    
    # التحقق من عدم وجود امتحان مفتوح
    existing_result = exam_results.query.filter_by(
        user_id=current_user.id,
        exam_id=exam_id
    ).first()
    
    if existing_result:
        return jsonify({'error': 'لقد بدأت هذا الامتحان من قبل'}), 400
    
    # إنشاء نتيجة جديدة
    result = exam_results(
        user_id=current_user.id,
        exam_id=exam_id,
        score=0,
        total_questions=exam.total_questions,
        correct_answers=0,
        wrong_answers=0,
        time_taken=0
    )
    db.session.add(result)
    db.session.commit()
    
    return jsonify({
        'message': 'تم بدء الامتحان',
        'result_id': result.id,
        'duration': exam.duration
    })

@app.route('/api/online-exams/submit', methods=['POST'])
@login_required
def submit_online_exam():
    try:
        data = request.json
        result_id = data.get('result_id')
        answers = data.get('answers', [])
        time_taken = data.get('time_taken', 0)
        
        result = exam_results.query.get_or_404(result_id)
        
        if result.user_id != current_user.id:
            return jsonify({'error': 'غير مصرح لك بتقديم هذا الامتحان'}), 403
        
        correct_count = 0
        wrong_count = 0
        
        # تصحيح الإجابات
        for answer_data in answers:
            question_id = answer_data['question_id']
            selected_option_id = answer_data.get('selected_option_id')
            
            # حفظ إجابة المستخدم
            user_answer = user_answers(
                result_id=result_id,
                question_id=question_id,
                selected_option_id=selected_option_id
            )
            db.session.add(user_answer)
            
            # التحقق من صحة الإجابة
            if selected_option_id:
                correct_option = question_options.query.filter_by(
                    question_id=question_id,
                    is_correct=True
                ).first()
                
                if correct_option and selected_option_id == correct_option.id:
                    user_answer.is_correct = True
                    correct_count += 1
                else:
                    wrong_count += 1
            else:
                wrong_count += 1
        
        # حساب الدرجة
        total_questions = result.total_questions
        score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        
        # تحديث النتيجة
        result.score = score
        result.correct_answers = correct_count
        result.wrong_answers = wrong_count
        result.time_taken = time_taken
        result.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم تقديم الامتحان بنجاح',
            'score': score,
            'correct_answers': correct_count,
            'wrong_answers': wrong_count,
            'total_questions': total_questions
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'خطأ في تقديم الامتحان: {str(e)}'}), 500

@app.route('/api/online-exams/results', methods=['GET'])
@login_required
def get_exam_results():
    user_id = request.args.get('user_id', type=int)
    grade_id = request.args.get('grade_id', type=int)
    query = exam_results.query
    if current_user.is_admin:
        if user_id:
            query = query.filter_by(user_id=user_id)
        if grade_id:
            query = query.join(online_exams, exam_results.exam_id == online_exams.id).filter(online_exams.grade_id == grade_id)
        results = query.all()
    else:
        results = exam_results.query.filter_by(user_id=current_user.id).all()

    return jsonify([{
        'id': r.id,
        'exam_id': r.exam_id,
        'user_id': r.user_id,
        'exam_title': online_exams.query.get(r.exam_id).title if online_exams.query.get(r.exam_id) else 'امتحان محذوف',
        'user_name': Users.query.get(r.user_id).name if Users.query.get(r.user_id) else 'مستخدم محذوف',
        'score': r.score,
        'correct_answers': r.correct_answers,
        'wrong_answers': r.wrong_answers,
        'total_questions': r.total_questions,
        'time_taken': r.time_taken,
        'completed_at': r.completed_at.isoformat() if r.completed_at else None,
        'grade_name': (
            (g.grade if (g := grade.query.get(online_exams.query.get(r.exam_id).grade_id)) else f'Grade {online_exams.query.get(r.exam_id).grade_id}') +
            (f" (National - {g.category})" if g and g.system == 'National' and g.category else f" ({g.system})" if g and g.system else '')
        ) if online_exams.query.get(r.exam_id) else 'غير محدد'
    } for r in results])

@app.route('/api/delete/online-exam/<int:exam_id>', methods=['DELETE'])
@admin_required
def delete_online_exam(exam_id):
    exam = online_exams.query.get(exam_id)
    if exam:
        db.session.delete(exam)
        db.session.commit()
        return jsonify({'message': 'تم حذف الامتحان بنجاح'})
    return jsonify({'error': 'الامتحان غير موجود'}), 404

@app.route('/api/video/<int:video_id>/view', methods=['POST'])
@login_required
def increment_video_view(video_id):
    try:
        # البحث عن الفيديو
        video = videos.query.get(video_id)
        if not video:
            return jsonify({'error': 'الفيديو غير موجود'}), 404
        
        # زيادة عدد المشاهدات
        video.views_count = (video.views_count or 0) + 1
        
        # تسجيل المشاهدة في جدول المشاهدات التفصيلي
        video_view = videos_views(
            user_id=current_user.id,
            video_id=video_id,
            views_count=1
        )
        
        db.session.add(video_view)
        db.session.commit()
        
        return jsonify({'message': 'تم تسجيل المشاهدة بنجاح', 'views_count': video.views_count})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'خطأ في تسجيل المشاهدة: {str(e)}'}), 500

@app.route('/api/online-exams/result-answers/<int:result_id>', methods=['GET'])
@login_required
def get_exam_result_answers(result_id):
    result = exam_results.query.get_or_404(result_id)
    # الطالب لا يمكنه رؤية إلا نتائجه فقط
    if not current_user.is_admin and result.user_id != current_user.id:
        return jsonify({'error': 'غير مصرح لك بعرض هذه الإجابات'}), 403
    exam = online_exams.query.get(result.exam_id)
    if not exam:
        return jsonify({'error': 'الامتحان غير موجود'}), 404
    questions = exam_questions.query.filter_by(exam_id=exam.id).order_by(exam_questions.question_number).all()
    user_answers_map = {ua.question_id: ua.selected_option_id for ua in user_answers.query.filter_by(result_id=result.id).all()}
    questions_data = []
    for q in questions:
        options = question_options.query.filter_by(question_id=q.id).all()
        options_data = []
        for opt in options:
            options_data.append({
                'id': opt.id,
                'letter': opt.option_letter,
                'text': opt.option_text,
                'is_correct': opt.is_correct
            })
        questions_data.append({
            'question_id': q.id,
            'question_text': q.question_text,
            'options': options_data,
            'selected_option_id': user_answers_map.get(q.id)
        })
    return jsonify({'questions': questions_data})

@app.route('/api/online-exams/reset-attempt', methods=['POST'])
@admin_required
def reset_exam_attempt():
    data = request.json
    user_id = data.get('user_id')
    exam_id = data.get('exam_id')
    if not user_id or not exam_id:
        return jsonify({'error': 'user_id و exam_id مطلوبان'}), 400
    # حذف كل إجابات المستخدم لهذا الامتحان
    result = exam_results.query.filter_by(user_id=user_id, exam_id=exam_id).first()
    if not result:
        return jsonify({'message': 'لا توجد محاولة لهذا المستخدم في هذا الامتحان'}), 404
    user_answers.query.filter_by(result_id=result.id).delete()
    db.session.delete(result)
    db.session.commit()
    return jsonify({'message': 'تم حذف محاولة الطالب ويمكنه إعادة الامتحان الآن'})

@app.route('/api/change-password', methods=['POST'])
@login_required
def api_change_password():
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not old_password or not new_password or not confirm_password:
        return jsonify({'success': False, 'error': 'جميع الحقول مطلوبة.'}), 400

    if new_password != confirm_password:
        return jsonify({'success': False, 'error': 'كلمات المرور غير متطابقة.'}), 400

    if len(new_password) < 6:
        return jsonify({'success': False, 'error': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'}), 400

    user = current_user
    if not user.check_password(old_password):
        return jsonify({'success': False, 'error': 'كلمة المرور القديمة غير صحيحة.'}), 400

    user.set_password(new_password)
    db.session.commit()
    return jsonify({'success': True, 'message': 'تم تغيير كلمة المرور بنجاح.'})

@click.command('fix-image-paths')
@with_appcontext
def fix_image_paths():
    from models import books, teachers, db
    fixed_books = 0
    fixed_teachers = 0
    # إصلاح مسارات الكتب
    for book in books.query.all():
        if book.image_path:
            filename = os.path.basename(book.image_path)
            correct_path = os.path.join('uploads', filename)
            if book.image_path != correct_path:
                print(f'Book {book.id}: {book.image_path} -> {correct_path}')
                book.image_path = correct_path
                fixed_books += 1
    # إصلاح مسارات صور المدرسين
    for teacher in teachers.query.all():
        if teacher.image_path:
            filename = os.path.basename(teacher.image_path)
            correct_path = os.path.join('uploads', filename)
            if teacher.image_path != correct_path:
                print(f'Teacher {teacher.id}: {teacher.image_path} -> {correct_path}')
                teacher.image_path = correct_path
                fixed_teachers += 1
    db.session.commit()
    print(f'Fixed {fixed_books} book image paths and {fixed_teachers} teacher image paths.')

app.cli.add_command(fix_image_paths)

def retry_delete_file(path, max_retries=5, delay=0.5):
    for _ in range(max_retries):
        try:
            os.remove(path)
            return True
        except PermissionError:
            time.sleep(delay)
        except Exception as e:
            print(f"خطأ في حذف الملف {path}: {e}")
            break
    print(f"تحذير: لم نتمكن من حذف الملف: {path}")
    return False

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    with app.app_context():
        db.create_all()
        # --- اجعل المستخدمين أدمن ---
        for admin_username in ['haggag', 'admin']:
            user = Users.query.filter_by(username=admin_username).first()
            if user and not user.is_admin:
                user.is_admin = True
                print(f"تم تحويل {admin_username} إلى أدمن.")
        db.session.commit()
    # إعدادات لحل مشكلة التخزين المؤقت
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=True)

    