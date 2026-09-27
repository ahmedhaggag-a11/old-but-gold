document.addEventListener('DOMContentLoaded', () => {
    // تحميل المراحل من قاعدة البيانات أولاً
    loadGrades().then(() => {
        // --- Tab Switching Logic ---
        const tabs = document.querySelectorAll('.workspace-tabs button');
        const sections = document.querySelectorAll('.workspace-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                // Deactivate all tabs and sections
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                // Activate the clicked tab
                event.currentTarget.classList.add('active');

                // Activate the corresponding section
                const sectionId = `section-${event.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1]}`;
                document.getElementById(sectionId).classList.add('active');
                
                // تحميل البيانات عند التبديل إلى قسم المدرسين
                if (sectionId === 'section-teachers') {
                    loadTeachers();
                }
            });
        });

        // --- Video Upload Logic ---
        const uploadVideoForm = document.getElementById('uploadVideoForm');
        if (uploadVideoForm) {
            uploadVideoForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/upload/video', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert(data.message);
                        e.target.reset();
                        loadVideos(); // Reload videos list
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    alert('حدث خطأ في رفع الفيديو');
                }
            });
        }

        // --- Code Generation Logic ---
        const generateCodeForm = document.getElementById('generateCodeForm');
        const codesList = document.getElementById('codesList');

        if (generateCodeForm) {
            generateCodeForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/generate-code', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('فشل في توليد الأكواد');
                    }

                    const data = await response.json();
                    displayGeneratedCodes(data.codes);
                    e.target.reset();
                    loadCodes(); // Reload codes list

                } catch (error) {
                    alert(error.message);
                }
            });
        }

        // --- Exam Upload Logic ---
        const uploadExamForm = document.getElementById('uploadExamForm');
        if (uploadExamForm) {
            uploadExamForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/upload/exam', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert(data.message);
                        e.target.reset();
                        loadExams(); // Reload exams list
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    alert('حدث خطأ في رفع الامتحان');
                }
            });
        }

        // --- Answer Upload Logic ---
        const uploadAnswerForm = document.getElementById('uploadAnswerForm');
        if (uploadAnswerForm) {
            uploadAnswerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/upload/answer', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert(data.message);
                        e.target.reset();
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    alert('حدث خطأ في رفع النموذج');
                }
            });
        }

        // --- Sheet Upload Logic ---
        const uploadDocumentForm = document.getElementById('uploadDocumentForm');
        if (uploadDocumentForm) {
            uploadDocumentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/upload/sheet', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert(data.message);
                        e.target.reset();
                        loadSheets(); // Reload sheets list
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    alert('حدث خطأ في رفع الورقة');
                }
            });
        }

        // --- Book Upload Logic ---
        const uploadBookForm = document.getElementById('uploadBookForm');
        if (uploadBookForm) {
            uploadBookForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // التحقق من البيانات قبل الإرسال
                const title = formData.get('title');
                const price = formData.get('price');
                const grade_id = formData.get('grade_id');
                const image = formData.get('image');
                
                console.log('بيانات الكتاب:', {
                    title: title,
                    price: price,
                    grade_id: grade_id,
                    image: image ? image.name : 'لا توجد صورة'
                });
                
                if (!title || !price || !grade_id || !image) {
                    alert('جميع الحقول مطلوبة');
                    return;
                }
                
                try {
                    const response = await fetch('/api/upload/book', {
                        method: 'POST',
                        body: formData
                    });
                    
                    console.log('استجابة الخادم:', response.status, response.statusText);
                    
                    const data = await response.json();
                    console.log('بيانات الاستجابة:', data);
                    
                    if (response.ok) {
                        alert(data.message);
                        e.target.reset();
                        loadBooks(); // Reload books list
                    } else {
                        alert('خطأ: ' + (data.error || 'حدث خطأ غير معروف'));
                    }
                } catch (error) {
                    console.error('خطأ في رفع الكتاب:', error);
                    alert('حدث خطأ في رفع الكتاب: ' + error.message);
                }
            });
        }

        // --- Teacher Upload Logic ---
        const uploadTeacherForm = document.getElementById('uploadTeacherForm');
        if (uploadTeacherForm) {
            uploadTeacherForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                try {
                    const response = await fetch('/api/teachers', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert(data.message);
                        e.target.reset();
                        loadTeachers(); // Reload teachers list
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    alert('حدث خطأ في إضافة المدرس');
                }
            });
        }

        // --- Teacher Edit Form Logic ---
        const teacherEditForm = document.getElementById('teacherEditForm');
        if (teacherEditForm) {
            teacherEditForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const teacherId = formData.get('teacher_id');
                
                try {
                    const response = await fetch(`/api/teachers/${teacherId}`, {
                        method: 'PUT',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert(data.message);
                        closeTeacherModal();
                        loadTeachers(); // Reload teachers list
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    alert('حدث خطأ في تحديث المدرس');
                }
            });
        }

        // Load initial data
        loadVideos();
        loadCodes();
        loadExams();
        loadSheets();
        loadBooks();
        loadUsers();
        loadTeachers();

        // Load system-specific grades
        loadSystemGrades();
        
        // Load courses when courses tab is clicked
        const coursesTab = document.querySelector('button[onclick*="courses"]');
        if (coursesTab) {
            coursesTab.addEventListener('click', () => {
                loadCourses();
            });
        }

        // تحميل الامتحانات والنتائج عند تحميل الصفحة
        loadOnlineExams();
        loadExamResults();
        
        // إعداد قسم مدرسي الكورسات
        // setupCourseTeachersSection();
    });
});

// دالة تحميل المراحل من قاعدة البيانات وتعبئة جميع القوائم
async function loadGrades() {
    try {
        const response = await fetch('/api/grades');
        const grades = await response.json();
        if (!Array.isArray(grades)) {
            throw new Error('Grades API did not return an array');
        }
        // ترتيب المراحل حسب order_num
        grades.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
        // تجميع المراحل حسب النظام والفئة
        const grouped = {};
        grades.forEach(grade => {
            let groupKey = grade.system;
            if (grade.system === 'National') {
                groupKey += ' - ' + (grade.category || 'عام');
            }
            if (!grouped[groupKey]) grouped[groupKey] = [];
            grouped[groupKey].push(grade);
        });
        // جميع القوائم التي تحتاج تعبئة المراحل
        const gradeSelects = [
            'videoGradeSelect', 'codeGradeSelect', 'examGradeSelect', 'answerGradeSelect', 'documentGradeSelect', 'bookGradeSelect',
            'videoGradeFilter', 'codeGradeFilter', 'examGradeFilter', 'sheetGradeFilter', 'bookGradeFilter', 'gradeFilter',
            'onlineExamGradeFilter', 'examResultGradeFilter'
        ];
        gradeSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">اختر المرحلة</option>';
                Object.keys(grouped).forEach(groupKey => {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = groupKey;
                    grouped[groupKey].forEach(grade => {
                        const option = document.createElement('option');
                        option.value = grade.id;
                        option.textContent = grade.grade;
                        optgroup.appendChild(option);
                    });
                    select.appendChild(optgroup);
                });
            }
        });
        console.log('✅ جميع قوائم المراحل تم تعبئتها بنجاح (مجمعة حسب النظام)');
        
        // تحميل المواد بعد تحميل المراحل
        await loadSubjects();
    } catch (error) {
        console.error('❌ خطأ في تحميل المراحل:', error);
    }
}

// دالة تحميل المواد الدراسية
async function loadSubjects() {
    try {
        const response = await fetch('/api/subjects');
        const subjects = await response.json();
        if (!Array.isArray(subjects)) {
            throw new Error('Subjects API did not return an array');
        }
        
        // تعبئة قوائم المواد
        const subjectSelects = [
            'videoSubjectSelect', 'videoSubjectFilter'
        ];
        
        subjectSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">اختر المادة</option>';
                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject;
                    option.textContent = subject;
                    select.appendChild(option);
                });
            }
        });
        
        console.log('✅ جميع قوائم المواد تم تعبئتها بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تحميل المواد:', error);
    }
}

function displayGeneratedCodes(codes) {
    if (!codes || codes.length === 0) {
        alert('لم يتم توليد أي أكواد.');
        return;
    }

    const codeList = codes.map(code => `- ${code}`).join('\n');
    alert(`تم توليد ${codes.length} كود:\n${codeList}`);
}

// Helper function to copy code to clipboard, must be in the global scope to be called by onclick
function copyCodeToClipboard(code) {
    navigator.clipboard.writeText(code).then(() => {
        alert(`تم نسخ الكود: ${code}`);
    }).catch(err => {
        console.error('فشل في نسخ الكود: ', err);
        alert('حدث خطأ أثناء محاولة نسخ الكود.');
    });
}

// This function is needed for the tabs to work correctly
function showSection(section, event) {
    console.log('🔄 Switching to section:', section);
    
    document.querySelectorAll('.workspace-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.workspace-tabs button').forEach(btn => btn.classList.remove('active'));
    document.getElementById('section-' + section).classList.add('active');
    event.target.classList.add('active');
    
    // تحميل المراحل عند فتح قسم الامتحانات الإلكترونية
    if (section === 'online-exams') {
        console.log('📚 Online exams section activated, loading grades...');
        setTimeout(() => {
            loadGrades();
            loadOnlineExams();
            loadExamResults();
        }, 100);
    }
}

// Function to filter users by user-id and grade
function filterUsers() {
  const searchTerm = document.getElementById('userSearch').value.toLowerCase();
  const selectedGrade = document.getElementById('gradeFilter').value;
  const table = document.getElementById('usersTable');
  const rows = table.getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const userId = row.cells[0] ? row.cells[0].textContent.toLowerCase() : '';
    const grade = row.cells[8] ? row.cells[8].textContent : '';

    const matchesSearch = searchTerm === '' || userId.includes(searchTerm);
    const matchesGrade = selectedGrade === '' || grade === selectedGrade;

    if (matchesSearch && matchesGrade) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  }
}

// Add event listeners for real-time filtering
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('userSearch');
  const gradeFilter = document.getElementById('gradeFilter');

  if (searchInput) {
    searchInput.addEventListener('input', filterUsers);
  }
  if (gradeFilter) {
    gradeFilter.addEventListener('change', filterUsers);
  }
});

// Function to delete video
function deleteVideo(videoId) {
  if (confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
    fetch(`/api/delete/video/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        loadVideos(); // Reload videos
      } else {
        alert('حدث خطأ أثناء حذف الفيديو');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('حدث خطأ أثناء حذف الفيديو');
    });
  }
}

// Function to record video view
function recordVideoView(videoId) {
    fetch(`/api/video/${videoId}/view`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            console.log('✅ تم تسجيل مشاهدة الفيديو');
            // تحديث عدد المشاهدات في الجدول
            loadVideos();
        } else {
            console.error('❌ خطأ في تسجيل المشاهدة:', data.error);
        }
    })
    .catch(error => {
        console.error('❌ خطأ في تسجيل المشاهدة:', error);
    });
}

// Function to filter videos
function filterVideos() {
    const gradeFilter = document.getElementById('videoGradeFilter');
    const subjectFilter = document.getElementById('videoSubjectFilter');
    
    const filters = {};
    if (gradeFilter && gradeFilter.value) {
        filters.grade_id = gradeFilter.value;
    }
    if (subjectFilter && subjectFilter.value) {
        filters.subject = subjectFilter.value;
    }
    
    loadVideos(filters);
}

// Function to load and display videos
function loadVideos(filters = {}) {
    const table = document.getElementById('videosTable');
    if (!table) return;
    
    table.innerHTML = '<tr><td colspan="8">جاري التحميل...</td></tr>';
    
    // بناء URL مع الفلاتر
    let url = '/api/videos';
    const params = new URLSearchParams();
    if (filters.grade_id) params.append('grade_id', filters.grade_id);
    if (filters.subject) params.append('subject', filters.subject);
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    fetch(url)
        .then(response => response.json())
        .then(videos => {
            if (videos.length === 0) {
                table.innerHTML = '<tr><td colspan="8">لا توجد فيديوهات</td></tr>';
                return;
            }
            
            table.innerHTML = '';
            
            videos.forEach(video => {
                const row = document.createElement('tr');
                let thumbnailHtml = '';
                if (video.thumbnail_path) {
                    const imgUrl = getImageUrl(video.thumbnail_path);
                    thumbnailHtml = `<img src="${imgUrl}" alt="${video.title}" style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px; cursor: pointer;" onclick="previewThumbnail('${imgUrl}')">`;
                } // else لا تعرض أي صورة
                row.innerHTML = `
                    <td>${video.id}</td>
                    <td class="video-thumb-cell">${thumbnailHtml}</td>
                    <td>${video.title}</td>
                    <td>${video.grade_name || 'غير محدد'}</td>
                    <td>${video.subject || 'غير محدد'}</td>
                    <td>${video.views_count || 0}</td>
                    <td>${video.created_at ? new Date(video.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                    <td>
                        <button onclick="deleteVideo(${video.id})" class="btn btn-danger btn-sm">حذف</button>
                    </td>
                `;
                table.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading videos:', error);
            table.innerHTML = '<tr><td colspan="8">خطأ في تحميل البيانات</td></tr>';
        });
}

// Function to preview thumbnail in larger size
function previewThumbnail(src) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    cursor: pointer;
  `;
  
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = `
    max-width: 90%;
    max-height: 90%;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;
  
  modal.appendChild(img);
  document.body.appendChild(modal);
  
  modal.onclick = () => {
    document.body.removeChild(modal);
  };
}

// Function to filter codes
function filterCodes() {
  const searchTerm = document.getElementById('codeSearch').value.toLowerCase();
  const selectedGrade = document.getElementById('codeGradeFilter').value;
  const table = document.getElementById('codesTable');
  const rows = table.getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const userId = row.cells[4] ? row.cells[4].textContent.toLowerCase() : ''; // user-id is in column 4
    const grade = row.cells[1] ? row.cells[1].textContent : '';

    const matchesSearch = searchTerm === '' || userId.includes(searchTerm);
    const matchesGrade = selectedGrade === '' || grade === selectedGrade;

    if (matchesSearch && matchesGrade) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  }
}

// Function to filter exams
function filterExams() {
    const searchTerm = document.getElementById('examSearch').value.toLowerCase();
    const gradeFilter = document.getElementById('examGradeFilter').value;
    const tbody = document.getElementById('examsTable');
    
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5">جاري التصفية...</td></tr>';
    
    fetch('/api/exams')
        .then(response => response.json())
        .then(exams => {
            let filteredExams = exams;
            
            if (searchTerm) {
                filteredExams = filteredExams.filter(exam => 
                    exam.title.toLowerCase().includes(searchTerm)
                );
            }
            
            if (gradeFilter) {
                filteredExams = filteredExams.filter(exam => 
                    exam.grade_id == gradeFilter
                );
            }
            
            if (filteredExams.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">لا توجد امتحانات تطابق المعايير</td></tr>';
                return;
            }
            
            tbody.innerHTML = filteredExams.map(exam => `
                <tr>
                    <td>${exam.id}</td>
                    <td>${exam.title}</td>
                    <td>${exam.duration} دقيقة</td>
                    <td>${exam.grade_name || 'غير محدد'}</td>
                    <td>
                        <button onclick="deleteExam(${exam.id})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => {
            console.error('Error filtering exams:', error);
            tbody.innerHTML = '<tr><td colspan="5">خطأ في تحميل البيانات</td></tr>';
        });
}

// Function to load and display codes
function loadCodes() {
  const tbody = document.getElementById('codesTable');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="6">جاري التحميل...</td></tr>';
  
  fetch('/api/codes')
    .then(response => response.json())
    .then(codes => {
      if (codes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">لا توجد أكواد</td></tr>';
        return;
      }
      
      tbody.innerHTML = codes.map(code => `
        <tr data-code-id="${code.id}">
          <td>${code.code}</td>
          <td>${code.grade_name || 'غير محدد'}</td>
          <td>${code.expire_date ? new Date(code.expire_date).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
          <td>${code.is_used ? 'مستخدم' : 'غير مستخدم'}</td>
          <td>${code.user_id || '-'}</td>
          <td>
            <button onclick="deleteCode(${code.id})" class="btn-small btn-danger">
              <i class="fas fa-trash"></i> حذف
            </button>
          </td>
        </tr>
      `).join('');
    })
    .catch(error => {
      console.error('Error loading codes:', error);
      tbody.innerHTML = '<tr><td colspan="6">خطأ في تحميل البيانات</td></tr>';
    });
}

// Function to load and display exams
function loadExams() {
  const tbody = document.getElementById('examsTable');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="5">جاري التحميل...</td></tr>';
  
  fetch('/api/exams')
    .then(response => response.json())
    .then(exams => {
      if (exams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">لا توجد امتحانات</td></tr>';
        return;
      }
      
      tbody.innerHTML = exams.map(exam => `
        <tr>
            <td>${exam.id}</td>
            <td>${exam.title}</td>
            <td>${exam.duration} دقيقة</td>
            <td>${exam.grade_name || 'غير محدد'}</td>
            <td>
                <button onclick="deleteExam(${exam.id})" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
      `).join('');
    })
    .catch(error => {
      console.error('Error loading exams:', error);
      tbody.innerHTML = '<tr><td colspan="5">خطأ في تحميل البيانات</td></tr>';
    });
}

// Function to delete code
function deleteCode(codeId) {
  if (confirm('هل أنت متأكد من حذف هذا الكود؟')) {
    fetch(`/api/delete/code/${codeId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        loadCodes(); // Reload codes
      } else {
        alert('حدث خطأ أثناء حذف الكود');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('حدث خطأ أثناء حذف الكود');
    });
  }
}

// Function to delete exam
function deleteExam(examId) {
    if (confirm('هل أنت متأكد من حذف هذا الامتحان؟')) {
        fetch(`/api/delete/exam/${examId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadExams(); // Reload exams list
        })
        .catch(error => {
            console.error('Error deleting exam:', error);
            alert('حدث خطأ في حذف الامتحان');
        });
    }
}

// Function to load and display users
function loadUsers() {
  const tbody = document.getElementById('usersTable');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="13">جاري التحميل...</td></tr>';
  
  fetch('/api/users')
    .then(response => response.json())
    .then(users => {
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="13">لا توجد مستخدمين</td></tr>';
        return;
      }
      
      tbody.innerHTML = users.map(user => `
        <tr data-user-id="${user.id}">
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.parent_name}</td>
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.national_id || '-'}</td>
          <td>${user.student_id || '-'}</td>
          <td>${user.parent_phone || '-'}</td>
          <td>${user.address || '-'}</td>
          <td>${user.grade_name || user.grade_id || 'غير محدد'}</td>
          <td>${user.is_admin ? 'أدمن' : 'طالب'}</td>
          <td>****</td>
          <td>
            <button onclick="deleteUser(${user.id})" class="btn-small btn-danger">
              <i class="fas fa-trash"></i> حذف
            </button>
          </td>
        </tr>
      `).join('');
    })
    .catch(error => {
      console.error('Error loading users:', error);
      tbody.innerHTML = '<tr><td colspan="13">خطأ في تحميل البيانات</td></tr>';
    });
}

// Function to delete user
function deleteUser(userId) {
  if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
    fetch(`/api/delete/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.message) {
        alert(data.message);
        loadUsers(); // Reload users
      } else {
        alert('حدث خطأ أثناء حذف المستخدم');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('حدث خطأ أثناء حذف المستخدم');
    });
  }
}

// Function to activate code (if needed)
function activateCode(code) {
  // This function can be used if you want to manually activate codes
  console.log('Activating code:', code);
}

function loadSheets() {
    const tbody = document.getElementById('sheetsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5">جاري التحميل...</td></tr>';
    
    fetch('/api/sheets')
        .then(response => response.json())
        .then(sheets => {
            if (sheets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">لا توجد أوراق عمل</td></tr>';
                return;
            }
            
            tbody.innerHTML = sheets.map(sheet => `
                <tr>
                    <td>${sheet.id}</td>
                    <td>${sheet.title}</td>
                    <td>${sheet.grade_name || 'غير محدد'}</td>
                    <td>${sheet.created_at ? new Date(sheet.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                    <td>
                        <button onclick="deleteSheet(${sheet.id})" class="delete-btn" ${!sheet.is_active ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading sheets:', error);
            tbody.innerHTML = '<tr><td colspan="5">خطأ في تحميل البيانات</td></tr>';
        });
}

function deleteSheet(sheetId) {
    if (confirm('هل أنت متأكد من حذف هذه الورقة؟')) {
        fetch(`/api/delete/sheet/${sheetId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadSheets(); // Reload sheets list
        })
        .catch(error => {
            console.error('Error deleting sheet:', error);
            alert('حدث خطأ في حذف الورقة');
        });
    }
}

function filterSheets() {
    const searchTerm = document.getElementById('sheetSearch').value.toLowerCase();
    const gradeFilter = document.getElementById('sheetGradeFilter').value;
    const tbody = document.getElementById('sheetsTable');
    
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5">جاري التصفية...</td></tr>';
    
    fetch('/api/sheets')
        .then(response => response.json())
        .then(sheets => {
            let filteredSheets = sheets;
            
            if (searchTerm) {
                filteredSheets = filteredSheets.filter(sheet => 
                    sheet.title.toLowerCase().includes(searchTerm)
                );
            }
            
            if (gradeFilter) {
                filteredSheets = filteredSheets.filter(sheet => 
                    sheet.grade_id == gradeFilter
                );
            }
            
            if (filteredSheets.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">لا توجد أوراق عمل تطابق المعايير</td></tr>';
                return;
            }
            
            tbody.innerHTML = filteredSheets.map(sheet => `
                <tr>
                    <td>${sheet.id}</td>
                    <td>${sheet.title}</td>
                    <td>${sheet.grade_name || 'غير محدد'}</td>
                    <td>${sheet.created_at ? new Date(sheet.created_at).toLocaleDateString('ar-EG') : 'غير محدد'}</td>
                    <td>
                        <button onclick="deleteSheet(${sheet.id})" class="delete-btn" ${!sheet.is_active ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => {
            console.error('Error filtering sheets:', error);
            tbody.innerHTML = '<tr><td colspan="5">خطأ في تحميل البيانات</td></tr>';
        });
}

function loadBooks() {
    const tbody = document.getElementById('booksTable');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7">جاري التحميل...</td></tr>';
    
    fetch('/api/books')
        .then(response => response.json())
        .then(books => {
            if (books.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">لا توجد كتب</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            books.forEach(book => {
                const row = document.createElement('tr');
                let imgHtml = '';
                if (book.image_path) {
                    const imgUrl = getImageUrl(book.image_path);
                    imgHtml = `<img src="${imgUrl}" alt="${book.title}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 5px;">`;
                } // else لا تعرض أي صورة
                row.innerHTML = `
                    <td>${book.id}</td>
                    <td class="book-img-cell">${imgHtml}</td>
                    <td>${book.title}</td>
                    <td>${book.price} L.E</td>
                    <td>${book.grade_name || 'غير محدد'}</td>
                    <td>غير محدد</td>
                    <td>
                        <button onclick="deleteBook(${book.id})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading books:', error);
            tbody.innerHTML = '<tr><td colspan="7">خطأ في تحميل البيانات</td></tr>';
        });
}

function deleteBook(bookId) {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
        fetch(`/api/delete/book/${bookId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadBooks(); // Reload books list
        })
        .catch(error => {
            console.error('Error deleting book:', error);
            alert('حدث خطأ في حذف الكتاب');
        });
    }
}

function filterBooks() {
    const searchTerm = document.getElementById('bookSearch').value.toLowerCase();
    const gradeFilter = document.getElementById('bookGradeFilter').value;
    const tbody = document.getElementById('booksTable');
    
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7">جاري التصفية...</td></tr>';
    
    fetch('/api/books')
        .then(response => response.json())
        .then(books => {
            let filteredBooks = books;
            
            if (searchTerm) {
                filteredBooks = filteredBooks.filter(book => 
                    book.title.toLowerCase().includes(searchTerm)
                );
            }
            
            if (gradeFilter) {
                filteredBooks = filteredBooks.filter(book => 
                    book.grade_id == gradeFilter
                );
            }
            
            if (filteredBooks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">لا توجد كتب تطابق المعايير</td></tr>';
                return;
            }
            
            tbody.innerHTML = filteredBooks.map(book => `
                <tr>
                    <td>${book.id}</td>
                    <td class="book-img-cell"></td>
                    <td>${book.title}</td>
                    <td>${book.price} L.E</td>
                    <td>${book.grade_name || 'غير محدد'}</td>
                    <td>غير محدد</td>
                    <td>
                        <button onclick="deleteBook(${book.id})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `);
                if (book.image_path) {
                    let imgUrl = book.image_path.replace(/^\/?(uploads\/)+/, '');
                    imgUrl = '/uploads/' + imgUrl;
                    let imgHtml = '';
                    if (book.image_path) {
                        const imgUrl = getImageUrl(book.image_path);
                        imgHtml = `<img src="${imgUrl}" alt="${book.title}" style="width: 50px; height: 70px; object-fit: cover; border-radius: 5px;">`;
                    }
                    row.innerHTML = `
                        <td>${book.id}</td>
                        <td class="book-img-cell">${imgHtml}</td>
                        <td>${book.title}</td>
                        <td>${book.price} L.E</td>
                        <td>${book.grade_name || 'غير محدد'}</td>
                        <td>غير محدد</td>
                        <td>
                            <button onclick="deleteBook(${book.id})" class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                }
            tbody.appendChild(row);
        })
        .catch(error => {
            console.error('Error filtering books:', error);
            tbody.innerHTML = '<tr><td colspan="7">خطأ في تحميل البيانات</td></tr>';
        });
}

// Teacher Management Functions
let currentEditingTeacher = null;
let isLoadingTeachers = false;

function loadTeachers() {
    if (isLoadingTeachers) return; // منع التحميل المتكرر
    
    const table = document.getElementById('teachersTable');
    if (!table) return;
    
    isLoadingTeachers = true;
    
    // إضافة حالة التحميل
    table.innerHTML = '<tr class="loading-row"><td colspan="8">جاري التحميل...</td></tr>';
    
    // الحصول على القسم المحدد حالياً
    const sectionFilter = document.getElementById('teacherSectionFilter');
    const currentSection = sectionFilter ? sectionFilter.value : '';
    
    let url = '/api/teachers';
    if (currentSection) {
        url += `?section=${currentSection}`;
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل في تحميل البيانات');
            }
            return response.json();
        })
        .then(teachers => {
            if (teachers.length === 0) {
                const sectionText = currentSection === 'heroes' ? 'مدرسين الأبطال' : 
                                   currentSection === 'new' ? 'المدرسين الجدد' : 'الكل';
                table.innerHTML = `<tr class="empty-row"><td colspan="8">لا توجد مدرسين في قسم ${sectionText}</td></tr>`;
                return;
            }
            
            table.innerHTML = '';
            
            teachers.forEach(teacher => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${teacher.id}</td>
                    <td class="teacher-img-cell"></td>
                    <td>${teacher.name}</td>
                    <td>${teacher.subject}</td>
                    <td>${teacher.section === 'heroes' ? 'مدرسين الأبطال' : 'المدرسين الجدد'}</td>
                    <td>${teacher.order_num}</td>
                    <td>
                        <button onclick="editTeacher(${teacher.id})" class="edit-btn" 
                                style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                    </td>
                    <td>
                        <button onclick="deleteTeacher(${teacher.id})" class="delete-btn" 
                                style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </td>
                `;
                table.appendChild(row);
                if (teacher.image_url) {
                    let imgUrl = getImageUrl(teacher.image_url);
                    row.querySelector('.teacher-img-cell').innerHTML = `<img src="${imgUrl}" alt="teacher" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">`;
                } else {
                    row.querySelector('.teacher-img-cell').innerHTML = '';
                }
            });
        })
        .catch(error => {
            console.error('Error loading teachers:', error);
            table.innerHTML = '<tr class="error-row"><td colspan="8">خطأ في تحميل البيانات</td></tr>';
        })
        .finally(() => {
            isLoadingTeachers = false;
        });
}

function editTeacher(teacherId) {
    fetch(`/api/teachers/${teacherId}`)
        .then(response => response.json())
        .then(teacher => {
            openTeacherModal(teacher);
        })
        .catch(error => console.error('Error fetching teacher:', error));
}

function deleteTeacher(teacherId) {
    if (confirm('هل أنت متأكد من حذف هذا المدرس؟')) {
        fetch(`/api/teachers/${teacherId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadTeachers();
        })
        .catch(error => console.error('Error deleting teacher:', error));
    }
}

function openTeacherModal(teacher = null) {
    const modal = document.getElementById('teacherModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('teacherEditForm');
    
    if (teacher) {
        // تعديل مدرس موجود
        title.textContent = 'تعديل المدرس';
        document.getElementById('teacherId').value = teacher.id;
        document.getElementById('teacherName').value = teacher.name;
        document.getElementById('teacherSubject').value = teacher.subject;
        document.getElementById('teacherSection').value = teacher.section;
        document.getElementById('teacherOrder').value = teacher.order_num;
        
        if (teacher.image_url) {
            let imgUrl = getImageUrl(teacher.image_url);
            document.getElementById('currentImage').innerHTML = `
                <img src="${imgUrl}" alt="Current Image" style="max-width: 100px; max-height: 100px;">
                <p>الصورة الحالية</p>
            `;
        }
        currentEditingTeacher = teacher;
    } else {
        // إضافة مدرس جديد
        title.textContent = 'إضافة مدرس جديد';
        form.reset();
        document.getElementById('currentImage').innerHTML = '';
        currentEditingTeacher = null;
    }
    
    modal.style.display = 'block';
}

function closeTeacherModal() {
    document.getElementById('teacherModal').style.display = 'none';
    currentEditingTeacher = null;
}

function filterTeachers() {
    if (isLoadingTeachers) return; // منع التحميل المتكرر
    loadTeachers(); // إعادة تحميل المدرسين مع الفلترة الحالية
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('teacherModal');
    if (event.target === modal) {
        closeTeacherModal();
    }
}

// --- Course Management Functions ---
function loadCourses() {
    fetch('/api/courses')
        .then(response => response.json())
        .then(data => {
            const coursesTable = document.getElementById('coursesTable');
            if (!coursesTable) return;
            
            coursesTable.innerHTML = '';
            
            data.forEach(course => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${course.id}</td>
                    <td>${course.system}</td>
                    <td>${course.grade_name}</td>
                    <td>${course.subject}</td>
                    <td><span class="status-active">نشط</span></td>
                    <td>
                        <button onclick="deleteCourse(${course.id})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                coursesTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading courses:', error);
        });
}

function deleteCourse(courseId) {
    if (confirm('هل أنت متأكد من حذف هذا الكورس؟')) {
        fetch(`/api/courses/${courseId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('تم حذف الكورس بنجاح');
                loadCourses();
            } else {
                alert(data.error || 'حدث خطأ في حذف الكورس');
            }
        })
        .catch(error => {
            console.error('Error deleting course:', error);
            alert('حدث خطأ في حذف الكورس');
        });
    }
}

// Course form submission handlers
function setupCourseForms() {
    // American courses
    const americanForm = document.getElementById('americanCourseForm');
    if (americanForm) {
        americanForm.addEventListener('submit', (e) => submitCourseForm(e, 'American'));
    }

    // IG courses
    const igForm = document.getElementById('igCourseForm');
    if (igForm) {
        igForm.addEventListener('submit', (e) => submitCourseForm(e, 'IG'));
    }

    // Azhar courses
    const azharForm = document.getElementById('azharCourseForm');
    if (azharForm) {
        azharForm.addEventListener('submit', (e) => submitCourseForm(e, 'Azhar'));
    }

    // Technical courses
    const technicalForm = document.getElementById('technicalCourseForm');
    if (technicalForm) {
        technicalForm.addEventListener('submit', (e) => submitCourseForm(e, 'Technical'));
    }

    // National General courses
    const nationalGeneralForm = document.getElementById('nationalGeneralCourseForm');
    if (nationalGeneralForm) {
        nationalGeneralForm.addEventListener('submit', (e) => submitCourseForm(e, 'National', 'General'));
    }

    // National Languages courses
    const nationalLanguagesForm = document.getElementById('nationalLanguagesCourseForm');
    if (nationalLanguagesForm) {
        nationalLanguagesForm.addEventListener('submit', (e) => submitCourseForm(e, 'National', 'Languages'));
    }
}

function submitCourseForm(event, system, category = null) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const courseData = {
        grade_id: formData.get('grade_id'),
        subject: formData.get('subject'),
        system: system,
        category: category
    };

    fetch('/api/courses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(courseData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('تم إضافة الكورس بنجاح');
            event.target.reset();
            loadCourses();
        } else {
            alert(data.error || 'حدث خطأ في إضافة الكورس');
        }
    })
    .catch(error => {
        console.error('Error adding course:', error);
        alert('حدث خطأ في إضافة الكورس');
    });
}

// Load grades for specific systems
function loadSystemGrades() {
    // Load American grades
    loadGradesForSystem('American', 'americanGradeSelect');
    
    // Load IG grades
    loadGradesForSystem('IG', 'igGradeSelect');
    
    // Load Azhar grades
    loadGradesForSystem('Azhar', 'azharGradeSelect');
    
    // Load Technical grades
    loadGradesForSystem('Technical', 'technicalGradeSelect');
    
    // Load National General grades
    loadGradesForSystem('National', 'nationalGeneralGradeSelect', 'General');
    
    // Load National Languages grades
    loadGradesForSystem('National', 'nationalLanguagesGradeSelect', 'Languages');
}

function loadGradesForSystem(system, selectId, category = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options except the first one
    select.innerHTML = '<option value="">اختر المرحلة</option>';
    
    // استخدام API لتحميل المراحل
    fetch('/api/grades')
        .then(response => response.json())
        .then(grades => {
            if (!Array.isArray(grades)) {
                throw new Error('Grades API did not return an array');
            }
            
            // فلترة المراحل حسب النظام
            const filteredGrades = grades.filter(grade => {
                if (system === 'National_Languages') {
                    return grade.system === 'National' && grade.category === 'لغات';
                }
                return grade.system === system;
            });
            
            // ترتيب المراحل حسب order_num
            filteredGrades.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
            
            filteredGrades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade.id;
                option.textContent = grade.grade + (grade.category ? ` - ${grade.category}` : '');
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading grades for system:', system, error);
            select.innerHTML = '<option value="">خطأ في تحميل المراحل</option>';
        });
}

// Online Exams Management
let questionCounter = 0;

function addQuestion() {
    questionCounter++;
    const container = document.getElementById('questionsContainer');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <div class="question-header">
            <h4>السؤال ${questionCounter}</h4>
            <button type="button" onclick="removeQuestion(this)" class="btn-danger">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
        <div class="form-group">
            <label>نص السؤال:</label>
            <textarea name="question_${questionCounter}" placeholder="أدخل نص السؤال" required></textarea>
        </div>
        <div class="form-group">
            <label>صورة السؤال (اختياري):</label>
            <input type="file" name="question_image_${questionCounter}" accept="image/*" class="question-image-input" onchange="previewQuestionImage(this, ${questionCounter})">
            <div class="image-preview" id="imagePreview_${questionCounter}" style="display: none; margin-top: 10px;">
                <img id="previewImg_${questionCounter}" style="max-width: 200px; max-height: 150px; border-radius: 5px;">
            </div>
        </div>
        <div class="options-container">
            <div class="option-item">
                <input type="radio" name="correct_${questionCounter}" value="A" required>
                <label>A:</label>
                <input type="text" name="option_A_${questionCounter}" placeholder="الخيار الأول" required>
            </div>
            <div class="option-item">
                <input type="radio" name="correct_${questionCounter}" value="B" required>
                <label>B:</label>
                <input type="text" name="option_B_${questionCounter}" placeholder="الخيار الثاني" required>
            </div>
            <div class="option-item">
                <input type="radio" name="correct_${questionCounter}" value="C" required>
                <label>C:</label>
                <input type="text" name="option_C_${questionCounter}" placeholder="الخيار الثالث" required>
            </div>
            <div class="option-item">
                <input type="radio" name="correct_${questionCounter}" value="D" required>
                <label>D:</label>
                <input type="text" name="option_D_${questionCounter}" placeholder="الخيار الرابع" required>
            </div>
        </div>
    `;
    container.appendChild(questionDiv);
}

function previewQuestionImage(input, questionNumber) {
    const preview = document.getElementById(`imagePreview_${questionNumber}`);
    const previewImg = document.getElementById(`previewImg_${questionNumber}`);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.style.display = 'none';
    }
}

function removeQuestion(button) {
    button.closest('.question-item').remove();
    updateQuestionNumbers();
}

function updateQuestionNumbers() {
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        const header = question.querySelector('.question-header h4');
        header.textContent = `السؤال ${index + 1}`;
    });
    questionCounter = questions.length;
}

function loadOnlineExams() {
    fetch('/api/online-exams')
        .then(response => response.json())
        .then(exams => {
            const tbody = document.getElementById('onlineExamsTable');
            tbody.innerHTML = exams.map(exam => `
                <tr>
                    <td>${exam.id}</td>
                    <td>${exam.title}</td>
                    <td>${exam.grade_name}</td>
                    <td>${exam.duration} دقيقة</td>
                    <td>${exam.total_questions}</td>
                    <td>${new Date(exam.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                        <button onclick="deleteOnlineExam(${exam.id})" class="btn-small btn-danger">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error loading online exams:', error));
}

function loadExamResults(filters = {}) {
    let url = '/api/online-exams/results';
    const params = [];
    if (filters.user_id) params.push(`user_id=${encodeURIComponent(filters.user_id)}`);
    if (filters.grade_id) params.push(`grade_id=${encodeURIComponent(filters.grade_id)}`);
    if (params.length) url += '?' + params.join('&');

    fetch(url)
        .then(response => response.json())
        .then(results => {
            const tbody = document.getElementById('examResultsTable');
            tbody.innerHTML = results.map(result => `
                <tr>
                    <td>${result.user_id}</td>
                    <td>${result.user_name}</td>
                    <td>${result.exam_title}</td>
                    <td>${result.grade_name || 'غير محدد'}</td>
                    <td>${result.score.toFixed(1)}%</td>
                    <td>${result.correct_answers}</td>
                    <td>${result.wrong_answers}</td>
                    <td>${Math.floor(result.time_taken / 60)}:${(result.time_taken % 60).toString().padStart(2, '0')}</td>
                    <td>${new Date(result.completed_at).toLocaleDateString('ar-EG')}</td>
                    <td><button class="btn-small btn-warning" onclick="resetExamAttempt(${result.exam_id}, ${result.user_id}, '${result.exam_title}')">إعادة</button></td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error loading exam results:', error));
}

function filterExamResults() {
    const userId = document.getElementById('examResultUserIdSearch').value.trim();
    const gradeId = document.getElementById('examResultGradeFilter').value;
    loadExamResults({ user_id: userId, grade_id: gradeId });
}

function deleteOnlineExam(examId) {
    if (confirm('هل أنت متأكد من حذف هذا الامتحان؟')) {
        fetch(`/api/delete/online-exam/${examId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadOnlineExams();
        })
        .catch(error => {
            console.error('Error deleting exam:', error);
            alert('حدث خطأ في حذف الامتحان');
        });
    }
}

function filterOnlineExams() {
    const gradeFilter = document.getElementById('onlineExamGradeFilter').value;
    let url = '/api/online-exams';
    if (gradeFilter) {
        url += `?grade_id=${gradeFilter}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(exams => {
            const tbody = document.getElementById('onlineExamsTable');
            tbody.innerHTML = exams.map(exam => `
                <tr>
                    <td>${exam.id}</td>
                    <td>${exam.title}</td>
                    <td>${exam.grade_name}</td>
                    <td>${exam.duration} دقيقة</td>
                    <td>${exam.total_questions}</td>
                    <td>${new Date(exam.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                        <button onclick="deleteOnlineExam(${exam.id})" class="btn-small btn-danger">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error filtering exams:', error));
}

// إضافة event listener لنموذج إنشاء الامتحان
document.addEventListener('DOMContentLoaded', function() {
    const createExamForm = document.getElementById('createOnlineExamForm');
    if (createExamForm) {
        createExamForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const originalFormData = new FormData(e.target);
            const examData = {
                title: originalFormData.get('title'),
                grade_id: parseInt(originalFormData.get('grade_id')),
                duration: parseInt(originalFormData.get('duration')),
                questions: []
            };
            
            // جمع الأسئلة
            const questions = document.querySelectorAll('.question-item');
            let hasError = false;
            questions.forEach((question, index) => {
                const questionText = question.querySelector(`textarea[name="question_${index + 1}"]`).value.trim();
                const correctAnswerInput = question.querySelector(`input[name="correct_${index + 1}"]:checked`);
                const questionImage = question.querySelector(`input[name="question_image_${index + 1}"]`);
                
                if (!questionText) {
                    hasError = true;
                    question.querySelector(`textarea[name="question_${index + 1}"]`).style.border = '2px solid red';
                } else {
                    question.querySelector(`textarea[name="question_${index + 1}"]`).style.border = '';
                }
                if (!correctAnswerInput) {
                    hasError = true;
                    question.querySelectorAll(`input[name="correct_${index + 1}"]`).forEach(input => input.style.outline = '2px solid red');
                } else {
                    question.querySelectorAll(`input[name="correct_${index + 1}"]`).forEach(input => input.style.outline = '');
                }
                const correctAnswer = correctAnswerInput ? correctAnswerInput.value : null;
                const options = [];
                ['A', 'B', 'C', 'D'].forEach(letter => {
                    const optionInput = question.querySelector(`input[name="option_${letter}_${index + 1}"]`);
                    const optionText = optionInput.value.trim();
                    if (!optionText) {
                        hasError = true;
                        optionInput.style.border = '2px solid red';
                    } else {
                        optionInput.style.border = '';
                    }
                    options.push({
                        text: optionText,
                        letter: letter,
                        is_correct: letter === correctAnswer
                    });
                });
                // فقط أضف السؤال إذا كان مكتمل
                if (questionText && correctAnswer && options.every(opt => opt.text)) {
                    examData.questions.push({
                        question: questionText,
                        image: questionImage.files[0] || null,
                        options: options
                    });
                }
            });
            if (hasError) {
                alert('يرجى ملء جميع الأسئلة والخيارات وتحديد الإجابة الصحيحة لكل سؤال.');
                return;
            }
            
            // إرسال البيانات مع الصور
            const formData = new FormData();
            formData.append('title', examData.title);
            formData.append('grade_id', examData.grade_id);
            formData.append('duration', examData.duration);
            
            // إضافة الأسئلة كـ JSON
            const questionsData = examData.questions.map(q => ({
                question: q.question,
                options: q.options
            }));
            formData.append('questions', JSON.stringify(questionsData));
            
            // إضافة الصور
            examData.questions.forEach((q, index) => {
                if (q.image) {
                    formData.append(`question_image_${index}`, q.image);
                }
            });
            
            fetch('/api/online-exams', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    e.target.reset();
                    document.getElementById('questionsContainer').innerHTML = '';
                    questionCounter = 0;
                    loadOnlineExams();
                } else {
                    alert(data.error);
                }
            })
            .catch(error => {
                console.error('Error creating exam:', error);
                alert('حدث خطأ في إنشاء الامتحان');
            });
        });
    }
    
    // تحميل المراحل في قسم الامتحانات الإلكترونية
    loadGrades();
    
    // تحميل الامتحانات والنتائج عند تحميل الصفحة
    loadOnlineExams();
    loadExamResults();

    // عند تحميل الصفحة، أضف سؤال واحد فقط إذا لم يوجد أي سؤال
    const questionsContainer = document.getElementById('questionsContainer');
    if (questionsContainer && questionsContainer.querySelectorAll('.question-item').length === 0) {
        addQuestion();
    }
});

function resetExamAttempt(resultId, userId, examTitle) {
    if (!confirm(`هل تريد حذف محاولة الطالب (${userId}) في الامتحان ${examTitle} والسماح له بإعادة الامتحان؟`)) return;
    fetch(`/api/online-exams/reset-attempt`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            exam_id: resultId
        })
    })
        .then(res => res.json())
        .then(data => {
            alert(data.message || 'تمت إعادة الامتحان بنجاح');
            loadExamResults();
        })
        .catch(() => alert('حدث خطأ في إعادة الامتحان'));
}

// إعداد قسم مدرسي الكورسات
// function setupCourseTeachersSection() {
//     console.log('🔧 إعداد قسم مدرسي الكورسات...');
    
//     const systemSelect = document.getElementById('courseTeacherSystem');
//     const gradeSelect = document.getElementById('courseTeacherGrade');
//     const subjectSelect = document.getElementById('courseTeacherSubject');
//     const addForm = document.getElementById('addCourseTeacherForm');
    
//     if (!systemSelect || !gradeSelect || !subjectSelect) {
//         console.error('❌ لم يتم العثور على عناصر قسم مدرسي الكورسات');
//         return;
//     }
    
//     console.log('✅ تم العثور على جميع عناصر قسم مدرسي الكورسات');
    
//     // إضافة event listeners
//     systemSelect.addEventListener('change', function() {
//         console.log('🔄 تم تغيير النظام إلى:', this.value);
//         updateCourseTeacherGrades(this.value, gradeSelect);
//         // مسح المادة عند تغيير النظام
//         subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
//     });
    
//     gradeSelect.addEventListener('change', function() {
//         const selectedSystem = systemSelect.value;
//         const selectedGrade = this.value;
//         console.log('🔄 تم تغيير المرحلة إلى:', selectedGrade, 'للنظام:', selectedSystem);
//         updateCourseTeacherSubjects(selectedSystem, selectedGrade, subjectSelect);
//     });
    
//     if (addForm) {
//         addForm.addEventListener('submit', async (e) => {
//             e.preventDefault();
//             const formData = new FormData(e.target);
            
//             try {
//                 const response = await fetch('/api/teachers', {
//                     method: 'POST',
//                     body: formData
//                 });
                
//                 const data = await response.json();
                
//                 if (response.ok) {
//                     alert(data.message);
//                     e.target.reset();
//                     // إعادة تعيين القوائم
//                     gradeSelect.innerHTML = '<option value="">اختر المرحلة</option>';
//                     subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
//                     loadCourseTeachers();
//                 } else {
//                     alert(data.error);
//                 }
//             } catch (error) {
//                 console.error('Error adding course teacher:', error);
//                 alert('حدث خطأ في إضافة المدرس');
//             }
//         });
//     }
    
//     // تحميل مدرسي الكورسات عند تحميل الصفحة
//     loadCourseTeachers();
    
//     console.log('✅ تم إعداد قسم مدرسي الكورسات بنجاح');
// }

// function updateCourseTeacherGrades(system, gradeSelect) {
//     if (!gradeSelect) {
//         console.error('❌ لم يتم العثور على قائمة المراحل');
//         return;
//     }
    
//     console.log('🔄 تحميل المراحل للنظام:', system);
    
//     gradeSelect.innerHTML = '<option value="">جاري التحميل...</option>';
    
//     if (!system) {
//         gradeSelect.innerHTML = '<option value="">اختر المرحلة</option>';
//         return;
//     }
    
//     // استخدام API لتحميل المراحل
//     fetch('/api/grades')
//         .then(response => response.json())
//         .then(grades => {
//             if (!Array.isArray(grades)) {
//                 throw new Error('Grades API did not return an array');
//             }
            
//             console.log('📊 تم تحميل', grades.length, 'مرحلة من قاعدة البيانات');
            
//             // فلترة المراحل حسب النظام
//             const filteredGrades = grades.filter(grade => {
//                 if (system === 'National_Languages') {
//                     return grade.system === 'National' && grade.category === 'لغات';
//                 }
//                 return grade.system === system;
//             });
            
//             console.log('📊 المراحل المفلترة للنظام', system, ':', filteredGrades.length, 'مرحلة');
            
//             // ترتيب المراحل حسب order_num
//             filteredGrades.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
            
//             gradeSelect.innerHTML = '<option value="">اختر المرحلة</option>';
            
//             filteredGrades.forEach(grade => {
//                 const option = document.createElement('option');
//                 option.value = grade.id;
//                 option.textContent = grade.grade + (grade.category ? ` - ${grade.category}` : '');
//                 gradeSelect.appendChild(option);
//             });
            
//             console.log('✅ تم تحميل', filteredGrades.length, 'مرحلة في القائمة');
//         })
//         .catch(error => {
//             console.error('❌ خطأ في تحميل المراحل للنظام:', system, error);
//             gradeSelect.innerHTML = '<option value="">خطأ في تحميل المراحل</option>';
//         });
// }

// function updateCourseTeacherSubjects(system, gradeId, subjectSelect) {
//     if (!subjectSelect) {
//         console.error('❌ لم يتم العثور على قائمة المواد');
//         return;
//     }
    
//     console.log('🔄 تحميل المواد للنظام:', system, 'والمرحلة:', gradeId);
    
//     subjectSelect.innerHTML = '<option value="">جاري التحميل...</option>';
    
//     if (!system || !gradeId) {
//         subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
//         return;
//     }
    
//     // تحديد المواد حسب النظام والمرحلة
//     let subjects = [];
    
//     if (system === 'National') {
//         // النظام المصري (عام)
//         subjects = [
//             'اللغة العربية',
//             'التربية الدينية',
//             'الرياضيات',
//             'العلوم',
//             'الدراسات الاجتماعية',
//             'اللغة الإنجليزية',
//             'تكنولوجيا المعلومات (ICT)',
//             'التربية الفنية',
//             'التربية الرياضية',
//             'التربية الوطنية',
//             'الفلسفة',
//             'علم النفس',
//             'التاريخ',
//             'الجغرافيا',
//             'الأحياء',
//             'الكيمياء',
//             'الفيزياء',
//             'الجيولوجيا',
//             'الرياضيات البحتة',
//             'الرياضيات التطبيقية',
//             'اللغة الألمانية',
//             'اللغة الفرنسية'
//         ];
        
//         // إضافة مواد خاصة بالمراحل الثانوية
//         if (gradeId >= 9) {
//             subjects.push('الإحصاء', 'البرمجة', 'الاقتصاد', 'المنطق');
//         }
        
//     } else if (system === 'National_Languages') {
//         // النظام المصري (لغات)
//         subjects = [
//             'اللغة العربية',
//             'التربية الدينية',
//             'English',
//             'Math (بالإنجليزي)',
//             'Science (بالإنجليزي)',
//             'Social Studies (بالعربي)',
//             'French',
//             'German',
//             'ICT',
//             'التربية الفنية',
//             'التربية الرياضية',
//             'التربية الوطنية',
//             'الفلسفة',
//             'علم النفس',
//             'History',
//             'Geography',
//             'Biology',
//             'Chemistry',
//             'Physics',
//             'Geology',
//             'Pure Math',
//             'Applied Math'
//         ];
        
//         // إضافة مواد خاصة بالمراحل الثانوية
//         if (gradeId >= 9) {
//             subjects.push('الإحصاء', 'البرمجة', 'الاقتصاد', 'المنطق');
//         }
        
//     } else if (system === 'IG') {
//         // IGCSE (الشهادة البريطانية)
//         subjects = [
//             'English as First Language',
//             'English as Second Language',
//             'Mathematics (Core)',
//             'Mathematics (Extended)',
//             'Biology',
//             'Chemistry',
//             'Physics',
//             'Computer Science',
//             'ICT',
//             'Business Studies',
//             'Economics',
//             'Accounting',
//             'History',
//             'Geography',
//             'Art & Design',
//             'French',
//             'German',
//             'Spanish',
//             'Environmental Management',
//             'Global Perspectives',
//             'Psychology',
//             'Sociology',
//             'Arabic',
//             'Religion'
//         ];
        
//     } else if (system === 'American') {
//         // American Diploma
//         subjects = [
//             'English',
//             'Math',
//             'Science',
//             'Social Studies',
//             'Computer',
//             'ICT',
//             'Physical Education',
//             'Art',
//             'Music',
//             'Health',
//             'Arabic',
//             'Religion',
//             'French',
//             'German',
//             'Spanish',
//             'Biology',
//             'Chemistry',
//             'Physics',
//             'Algebra 1',
//             'Geometry',
//             'Algebra 2',
//             'Pre-Calculus',
//             'Statistics',
//             'Psychology',
//             'Economics',
//             'History',
//             'Government'
//         ];
        
//         // إضافة مواد اختيارية للمراحل المتقدمة
//         if (gradeId >= 9) {
//             subjects.push('Electives', 'Advanced Placement (AP)', 'International Baccalaureate (IB)');
//         }
        
//     } else if (system === 'Azhar') {
//         // الأزهر الشريف
//         subjects = [
//             'القرآن الكريم',
//             'الحديث',
//             'التفسير',
//             'الفقه',
//             'التوحيد',
//             'العقيدة',
//             'النحو',
//             'الصرف',
//             'البلاغة',
//             'الأدب والنصوص',
//             'اللغة العربية',
//             'التربية الإسلامية',
//             'اللغة الإنجليزية',
//             'الرياضيات',
//             'العلوم',
//             'الدراسات الاجتماعية',
//             'الفلسفة',
//             'المنطق',
//             'الأحياء',
//             'الكيمياء',
//             'الفيزياء',
//             'الجيولوجيا',
//             'التربية الوطنية',
//             'التربية الفنية',
//             'التربية الرياضية',
//             'الحاسب الآلي'
//         ];
        
//     } else if (system === 'Technical') {
//         // التعليم الفني
//         subjects = [
//             'اللغة العربية',
//             'التربية الدينية',
//             'اللغة الإنجليزية',
//             'الرياضيات',
//             'الفيزياء',
//             'الكيمياء',
//             'الأحياء',
//             'مبادئ التخصص',
//             'تدريبات عملية',
//             'التربية الوطنية',
//             'الحاسب الآلي',
//             'الاقتصاد',
//             'مبادئ الإدارة',
//             'دراسات فنية',
//             'تطبيقية حسب المجال',
//             'كهرباء',
//             'ميكانيكا',
//             'محاسبة',
//             'زراعة'
//         ];
        
//         // إضافة مواد حسب التخصص
//         if (gradeId >= 10) {
//             subjects.push('التخصص الصناعي', 'التخصص التجاري', 'التخصص الزراعي');
//         }
        
//     } else {
//         // المواد الأساسية لجميع الأنظمة الأخرى
//         subjects = [
//             'الرياضيات',
//             'الفيزياء',
//             'الكيمياء',
//             'الأحياء',
//             'اللغة الإنجليزية',
//             'اللغة العربية',
//             'التاريخ',
//             'الجغرافيا',
//             'الحاسب',
//             'العلوم'
//         ];
//     }
    
//     // ترتيب المواد أبجدياً
//     subjects.sort();
    
//     console.log('📊 المواد المتاحة للنظام', system, ':', subjects.length, 'مادة');
    
//     subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    
//     subjects.forEach(subject => {
//         const option = document.createElement('option');
//         option.value = subject;
//         option.textContent = subject;
//         subjectSelect.appendChild(option);
//     });
    
//     console.log('✅ تم تحميل', subjects.length, 'مادة في القائمة');
// }

// async function loadCourseTeachers() {
//     try {
//         const response = await fetch('/api/teachers?type=course');
//         const teachers = await response.json();
        
//         const tableBody = document.getElementById('courseTeachersTableBody');
//         if (!tableBody) return;
        
//         tableBody.innerHTML = '';
        
//         if (teachers.length === 0) {
//             tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا يوجد مدرسين للكورسات</td></tr>';
//             return;
//         }
        
//         teachers.forEach(teacher => {
//             const row = document.createElement('tr');
//             row.innerHTML = `
//                 <td>${teacher.name}</td>
//                 <td>${teacher.subject || 'غير محدد'}</td>
//                 <td>${teacher.system || 'غير محدد'}</td>
//                 <td>${teacher.grade_name || 'غير محدد'}</td>
//                 <td>
//                     <button onclick="deleteCourseTeacher(${teacher.id})" class="btn btn-danger btn-sm">حذف</button>
//                 </td>
//             `;
//             tableBody.appendChild(row);
//         });
//     } catch (error) {
//         console.error('Error loading course teachers:', error);
//         const tableBody = document.getElementById('courseTeachersTableBody');
//         if (tableBody) {
//             tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">خطأ في تحميل البيانات</td></tr>';
//         }
//     }
// }

// function deleteCourseTeacher(teacherId) {
//     if (confirm('هل تريد حذف هذا المدرس؟')) {
//         fetch(`/api/teachers/${teacherId}`, {
//             method: 'DELETE'
//         })
//         .then(response => {
//             return response.json().then(data => ({ response, data }));
//         })
//         .then(({ response, data }) => {
//             if (response.ok) {
//                 alert(data.message);
//                 loadCourseTeachers();
//             } else {
//                 alert(data.error);
//             }
//         })
//         .catch(error => {
//             console.error('Error deleting teacher:', error);
//             alert('حدث خطأ في حذف المدرس');
//         });
//     }
// }

// قائمة المواد حسب النظام
const SUBJECTS_BY_SYSTEM = {
  'National-عام': [
    'اللغة العربية', 'التربية الدينية', 'الرياضيات', 'العلوم', 'الدراسات الاجتماعية',
    'اللغة الإنجليزية', 'تكنولوجيا المعلومات (ICT)', 'التربية الفنية', 'التربية الرياضية',
    'التربية الوطنية', 'الفلسفة', 'علم النفس', 'التاريخ', 'الجغرافيا', 'الأحياء',
    'الكيمياء', 'الفيزياء', 'الجيولوجيا', 'الرياضيات البحتة', 'الرياضيات التطبيقية',
    'اللغة الالمانيه', 'اللغه الفرنسيه'
  ],
  'National-لغات': [
    'اللغة العربية', 'التربية الدينية', 'English', 'Math (بالإنجليزي)', 'Science (بالإنجليزي)',
    'Social Studies (بالعربي)', 'French', 'German', 'ICT', 'التربية الفنية', 'التربية الرياضية',
    'التربية الوطنية', 'الفلسفة', 'علم النفس', 'History', 'Geography', 'Biology',
    'Chemistry', 'Physics', 'Geology', 'Pure Math', 'Applied Math'
  ],
  'IG': [
    'English as First/Second Language', 'Mathematics (Core/Extended)', 'Biology', 'Chemistry',
    'Physics', 'Computer Science', 'ICT', 'Business Studies', 'Economics', 'Accounting',
    'History', 'Geography', 'Art & Design', 'French / German / Spanish',
    'Environmental Management', 'Global Perspectives', 'Psychology', 'Sociology', 'Arabic', 'Religion'
  ],
  'American': [
    'English', 'Math', 'Science', 'Social Studies', 'Computer / ICT', 'Physical Education',
    'Art', 'Music', 'Health', 'Arabic', 'Religion', 'French / German / Spanish', 'Biology',
    'Chemistry', 'Physics', 'Algebra 1', 'Geometry', 'Algebra 2', 'Pre-Calculus / Statistics',
    'Psychology', 'Economics', 'History', 'Government', 'Electives'
  ],
  'Azhar': [
    'القرآن الكريم', 'الحديث', 'التفسير', 'الفقه', 'التوحيد / العقيدة', 'النحو', 'الصرف',
    'البلاغة', 'الأدب والنصوص', 'اللغة العربية', 'التربية الإسلامية', 'اللغة الإنجليزية',
    'الرياضيات', 'العلوم', 'الدراسات الاجتماعية', 'الفلسفة', 'المنطق', 'الأحياء',
    'الكيمياء', 'الفيزياء', 'الجيولوجيا', 'التربية الوطنية', 'التربية الفنية',
    'التربية الرياضية', 'الحاسب الآلي'
  ],
  'Technical': [
    'اللغة العربية', 'التربية الدينية', 'اللغة الإنجليزية', 'الرياضيات', 'الفيزياء (في الصناعي)',
    'الكيمياء (في الصناعي والزراعي)', 'الأحياء (في الزراعي)', 'مبادئ التخصص (كهرباء / ميكانيكا / محاسبة / زراعة...)',
    'تدريبات عملية', 'التربية الوطنية', 'الحاسب الآلي', 'الاقتصاد', 'مبادئ الإدارة', 'دراسات فنية / تطبيقية حسب المجال'
  ]
};

// تحديث المواد عند اختيار المرحلة
async function updateSubjectsByGrade() {
  const gradeSelect = document.getElementById('videoGradeSelect');
  const subjectSelect = document.getElementById('videoSubjectSelect');
  
  if (!gradeSelect || !subjectSelect) return;
  
  const selectedGradeId = gradeSelect.value;
  if (!selectedGradeId) {
    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    return;
  }
  
  try {
    // الحصول على معلومات المرحلة من قاعدة البيانات
    const response = await fetch(`/api/grade/${selectedGradeId}`);
    if (!response.ok) {
      throw new Error('فشل في الحصول على معلومات المرحلة');
    }
    
    const gradeData = await response.json();
    const system = gradeData.system;
    const category = gradeData.category || 'عام';
    
    console.log('📊 معلومات المرحلة:', { system, category, grade: gradeData.grade });
    
    // تحديد المواد حسب النظام والفئة
    let key = system;
    if (system === 'National') {
      key += '-' + category;
    }
    
    const subjects = SUBJECTS_BY_SYSTEM[key] || [];
    
    console.log('📚 المواد المتاحة:', subjects.length, 'مادة');
    
    // تحديث قائمة المواد
    subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });
    
    console.log('✅ تم تحديث قائمة المواد بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث المواد:', error);
    subjectSelect.innerHTML = '<option value="">خطأ في تحميل المواد</option>';
  }
}

// تحديث المواد عند اختيار النظام أو المرحلة (للتوافق مع الكود القديم)
function updateSubjectsBySystem() {
  const systemSelect = document.getElementById('systemSelect');
  const categorySelect = document.getElementById('categorySelect');
  const subjectSelect = document.getElementById('videoSubjectSelect');
  if (!systemSelect || !subjectSelect) return;
  let system = systemSelect.value;
  let category = '';
  if (system === 'National' && categorySelect) {
    category = categorySelect.value;
  }
  let key = system;
  if (system === 'National') key += '-' + (category || 'عام');
  const subjects = SUBJECTS_BY_SYSTEM[key] || [];
  subjectSelect.innerHTML = '<option value="">اختر المادة</option>';
  subjects.forEach(subj => {
    const option = document.createElement('option');
    option.value = subj;
    option.textContent = subj;
    subjectSelect.appendChild(option);
  });
}

// إضافة event listeners
window.addEventListener('DOMContentLoaded', () => {
  const systemSelect = document.getElementById('systemSelect');
  const categorySelect = document.getElementById('categorySelect');
  const gradeSelect = document.getElementById('videoGradeSelect');
  
  if (systemSelect) systemSelect.addEventListener('change', updateSubjectsBySystem);
  if (categorySelect) categorySelect.addEventListener('change', updateSubjectsBySystem);
  if (gradeSelect) gradeSelect.addEventListener('change', updateSubjectsByGrade);
  
  updateSubjectsBySystem();
});

// دالة مساعدة للتحقق من وجود الصورة فعليًا
function fileExists(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('HEAD', url, true);
    xhr.onload = function() {
        callback(xhr.status !== 404);
    };
    xhr.onerror = function() {
        callback(false);
    };
    xhr.send();
}

// دالة مساعدة لبناء رابط الصورة بشكل صحيح
function getImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return '/uploads/' + path;
}