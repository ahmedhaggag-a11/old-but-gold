// script.js

// حل مشكلة التخزين المؤقت
if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD) {
    window.location.reload();
}

// منع التخزين المؤقت للصفحة
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// Intersection Observer for fade-in animation on sections
const sections = document.querySelectorAll('section');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Optional: Stop observing once animated
        }
    });
}, {
    threshold: 0.2 // Adjust threshold as needed (how much of the section must be visible)
});

sections.forEach(section => {
    observer.observe(section);
});


// Smooth scrolling for navigation links (يعمل فقط مع الروابط الداخلية)
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        }
        // لو الرابط ليس داخلي (#) سيعمل طبيعي ويفتح الصفحة
    });
});

// بيانات المدرسين لكل مرحلة
// const teachers = {
//   primary: [
//     {
//       img: "images/haggag.jpg",
//       name: "Mr. khaled haggag",
//       subject: "French",
//       desc: "French teacher with creative methods for easy understanding."
//     },
//     {
//       img: "images/hamaki.jpg",
//       name: "Mr. hamaki",
//       subject: "Physics",
//       desc: "Physics made fun and practical for young learners."
//     }
//   ],
//   prep: [
//     {
//       img: "images/azem.jpg",
//       name: "Mr. abdelazem",
//       subject: "English",
//       desc: "Strong English foundation and communication skills."
//     },
//     {
//       img: "images/476448634_1081810800626559_6283023716112332744_n.jpg",
//       name: "Dr mo.mahmoud",
//       subject: "Biology",
//       desc: "Biology explained with illustrations and interactive questions."
//     }
//   ],
//   secondary: [
//     {
//       img: "images/gohary.jpg",
//       name: "Mr. elgohary",
//       subject: "Arabic",
//       desc: "Master Arabic language and grammar with comprehensive exercises."
//     },
//     {
//       img: "images/hesham.jpg",
//       name: "Mr. abdelfatah",
//       subject: "Chemistry",
//       desc: "Easy chemistry with practical experiments and creative memorization."
//     }
//   ]
// };

// مؤشر المدرس الحالي لكل مرحلة
const teacherIndex = {
  primary: 0,
  prep: 0,
  secondary: 0
};

// دالة عرض  الحاليالمدرس
// function showTeacher(stage, dir) {
//   if (typeof dir === "number") {
//     teacherIndex[stage] = (teacherIndex[stage] + dir + teachers[stage].length) % teachers[stage].length;
//   }
//   const t = teachers[stage][teacherIndex[stage]];
//   const card = document.getElementById(stage + "TeacherCard");
//   card.innerHTML = `
//     <div class="teacher-flip-front">
//       <img src="${t.img}" alt="${t.name}">
//       <h4>${t.name}</h4>
//       <span>${t.subject}</span>
//     </div>
//     <div class="teacher-flip-back">
//       <strong>${t.name}</strong>
//       <p>${t.desc}</p>
//     </div>
//   `;
//   // flip effect
//   card.onmouseenter = () => card.classList.add('flipped');
//   card.onmouseleave = () => card.classList.remove('flipped');
// }

// // عند تحميل الصفحة، اعرض أول مدرس في كل مرحلة
// document.addEventListener("DOMContentLoaded", function() {
//   showTeacher('primary');
//   showTeacher('prep');
//   showTeacher('secondary');
// });

// Dark mode toggle
const darkToggle = document.getElementById('darkModeToggle');
const darkIcon = document.getElementById('darkIcon');
const body = document.body;

// عند الضغط على زرار الدارك مود
if (darkToggle) {
  darkToggle.onclick = function () {
    body.classList.toggle('dark-mode');
  };
}

// User menu login/logout logic
const navUsername = document.getElementById('navUsername');
const userDropdown = document.querySelector('.user-dropdown');
let loginBtn = document.getElementById('loginBtn');
let logoutBtn = document.getElementById('logoutBtn');

// إذا لم يوجد زرار login أضفه (احتياطي)
if (!loginBtn) {
  loginBtn = document.createElement('a');
  loginBtn.href = "/login";
  loginBtn.id = "loginBtn";
  loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
  userDropdown.appendChild(loginBtn);
}

// إذا لم يوجد زرار logout أضفه (احتياطي)
if (!logoutBtn) {
  logoutBtn = document.createElement('a');
  logoutBtn.href = "/logout";
  logoutBtn.id = "logoutBtn";
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out';
  userDropdown.appendChild(logoutBtn);
}

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('هل تريد تسجيل الخروج؟')) {
      // Send logout request to server
      fetch('/logout', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => {
        if (response.ok) {
          window.location.href = '/';
        } else {
          alert('حدث خطأ أثناء تسجيل الخروج');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('حدث خطأ أثناء تسجيل الخروج');
      });
    }
  });
}

// Scroll delay for Explore Courses button
document.querySelectorAll('.cta-button[href="#courses"]').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    setTimeout(() => {
      const target = document.getElementById('courses');
      if (target) {
        window.scrollTo({
          top: target.offsetTop,
          behavior: 'smooth'
        });
      }
    }, 400); // عدل الرقم حسب التأخير المطلوب بالمللي ثانية
  });
});

document.querySelectorAll('.course-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelectorAll('.course-dropdown').forEach(drop => drop.classList.remove('open'));
        this.parentElement.classList.toggle('open');
    });
});
document.addEventListener('click', function(e) {
    // لو الكليك خارج أي course-dropdown فقط، اقفل القوائم
    if (!e.target.closest('.course-dropdown')) {
        document.querySelectorAll('.course-dropdown').forEach(drop => drop.classList.remove('open'));
    }
});

// بيانات الفلاتر حسب النوع - سيتم تحميلها من API
let gradesLang = [];
let subjectsLang = [];
let gradesState = [];
let subjectsState = [];

// بيانات الكورسات - سيتم تحميلها من API
let allGrades = [];
let allTeachers = [];

// تحميل البيانات من API عند تحميل الصفحة
async function loadSystemData() {
    try {
        // تحميل المراحل
        const gradesResponse = await fetch('/api/grades');
        const grades = await gradesResponse.json();
        
        // تحميل مدرسي الكورسات
        const teachersResponse = await fetch('/api/teachers?type=course');
        const teachers = await teachersResponse.json();
        
        // تنظيم البيانات حسب النظام
        const nationalGrades = grades.filter(g => g.system === 'National');
        const nationalLangGrades = nationalGrades.filter(g => g.category === 'لغات');
        const nationalStateGrades = nationalGrades.filter(g => g.category === 'عام');
        const americanGrades = grades.filter(g => g.system === 'American');
        const igGrades = grades.filter(g => g.system === 'IG');
        const azharGrades = grades.filter(g => g.system === 'Azhar');
        const technicalGrades = grades.filter(g => g.system === 'Technical');
        
        gradesLang = nationalLangGrades.map(g => g.grade);
        gradesState = nationalStateGrades.map(g => g.grade);
        
        // المواد حسب النظام
        subjectsLang = [
            'اللغة العربية', 'التربية الدينية', 'English', 'Math (بالإنجليزي)', 
            'Science (بالإنجليزي)', 'Social Studies (بالعربي)', 'French', 'German', 
            'ICT', 'التربية الفنية', 'التربية الرياضية', 'التربية الوطنية', 
            'الفلسفة', 'علم النفس', 'History', 'Geography', 'Biology', 
            'Chemistry', 'Physics', 'Geology', 'Pure Math', 'Applied Math'
        ];
        
        subjectsState = [
            'اللغة العربية', 'التربية الدينية', 'الرياضيات', 'العلوم', 
            'الدراسات الاجتماعية', 'اللغة الإنجليزية', 'تكنولوجيا المعلومات (ICT)', 
            'التربية الفنية', 'التربية الرياضية', 'التربية الوطنية', 'الفلسفة', 
            'علم النفس', 'التاريخ', 'الجغرافيا', 'الأحياء', 'الكيمياء', 
            'الفيزياء', 'الجيولوجيا', 'الرياضيات البحتة', 'الرياضيات التطبيقية', 
            'اللغة الألمانية', 'اللغة الفرنسية'
        ];
        
        console.log('✅ تم تحميل بيانات الأنظمة التعليمية');
        
        // تعبئة الفلاتر الافتراضية
        if (langTab && stateTab && gradeFilter && subjectFilter) {
            fillFilters('lang');
        }
        
    } catch (error) {
        console.error('❌ خطأ في تحميل بيانات الأنظمة:', error);
    }
}

// دالة مساعدة لبناء رابط الصورة بشكل صحيح
function getImageUrl(path) {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Bunny.net
    return '/uploads/' + path;
}

// عناصر الفلاتر
const langTab = document.getElementById('languageschoolTab');
const stateTab = document.getElementById('stateschoolTab');
const gradeFilter = document.getElementById('gradeFilter');
const subjectFilter = document.getElementById('subjectFilter');
const showTeachersBtn = document.getElementById('showTeachersBtn');
const filteredTeachers = document.getElementById('filteredTeachers');

// بيانات المدرسين - سيتم تحميلها من API
let teachersData = [];

// تحميل مدرسي الكورسات من API
async function loadCourseTeachers() {
    try {
        const response = await fetch('/api/teachers?type=course');
        const teachers = await response.json();
        
        teachersData = teachers.map(teacher => ({
            name: teacher.name,
            img: teacher.image_url ? getImageUrl(teacher.image_url) : null,
            subject: teacher.subject,
            grade: teacher.grade_name,
            type: teacher.system === 'National' && teacher.category === 'لغات' ? 'lang' : 'state',
            system: teacher.system,
            category: teacher.category
        }));
        
        console.log('✅ تم تحميل', teachersData.length, 'مدرس من API');
        console.log('📊 توزيع المدرسين حسب النظام:', teachersData.reduce((acc, t) => {
            acc[t.system] = (acc[t.system] || 0) + 1;
            return acc;
        }, {}));
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المدرسين:', error);
    }
}

// تحميل مدرسي الأبطال والمدرسين الجدد
async function loadHeroesAndNewTeachers() {
    try {
        // تحميل مدرسي الأبطال
        const heroesResponse = await fetch('/api/teachers?section=heroes');
        const heroesTeachers = await heroesResponse.json();
        
        // تحميل المدرسين الجدد
        const newResponse = await fetch('/api/teachers?section=new');
        const newTeachers = await newResponse.json();
        
        // عرض مدرسي الأبطال
        const heroesContainer = document.getElementById('heroesTeachers');
        if (heroesContainer) {
            heroesContainer.innerHTML = '';
            if (heroesTeachers.length === 0) {
                heroesContainer.innerHTML = '<p style="text-align: center; color: #666;">لا يوجد مدرسين أبطال حالياً</p>';
            } else {
                heroesTeachers.forEach((teacher, index) => {
                    const teacherDiv = document.createElement('div');
                    teacherDiv.className = `teacher${index + 1}`;
                    teacherDiv.innerHTML = `
                        ${teacher.image_url ? `<img src="${getImageUrl(teacher.image_url)}" alt="${teacher.name}">` : ''}
                        <h4>${teacher.name}</h4>
                        <p>${teacher.subject}</p>
                    `;
                    heroesContainer.appendChild(teacherDiv);
                });
            }
        }
        
        // عرض المدرسين الجدد باستايل أصلي (مربع ومتوسط)
        const newContainer = document.getElementById('newTeachers');
        if (newContainer) {
            newContainer.innerHTML = '';
            if (newTeachers.length === 0) {
                newContainer.innerHTML = '<p style="text-align: center; color: #666;">لا يوجد مدرسين جدد حالياً</p>';
            } else {
                newTeachers.forEach((teacher) => {
                    const teacherDiv = document.createElement('div');
                    teacherDiv.className = 'exclusive-teacher1';
                    teacherDiv.style.display = 'inline-block';
                    teacherDiv.style.textAlign = 'center';
                    teacherDiv.style.margin = '0 12px';
                    teacherDiv.innerHTML = `
                        ${teacher.image_url ? `<img src="${getImageUrl(teacher.image_url)}" alt="${teacher.name}">` : ''}
                        <h4 style="font-size:1.1em; margin:0;">${teacher.name}</h4>
                        <p style="font-size:0.95em; color:#1976d2; margin:0;">${teacher.subject}</p>
                    `;
                    newContainer.appendChild(teacherDiv);
                });
            }
        }
        
        console.log('✅ تم تحميل مدرسي الأبطال والمدرسين الجدد');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل مدرسي الأبطال والمدرسين الجدد:', error);
    }
}

// دالة لتعبئة الفلاتر
function fillFilters(type) {
    let grades = type === 'lang' ? gradesLang : gradesState;
    let subjects = type === 'lang' ? subjectsLang : subjectsState;
    if (gradeFilter) gradeFilter.innerHTML = grades.map(g => `<option>${g}</option>`).join('');
    if (subjectFilter) subjectFilter.innerHTML = subjects.map(s => `<option>${s}</option>`).join('');
    if (filteredTeachers) filteredTeachers.innerHTML = "";
}

// دالة لعرض المدرسين حسب الفلاتر
async function showFilteredTeachers(page = 0) {
    if (!filteredTeachers) return;
    
    const selectedSystem = systemTab && systemTab.classList.contains('active') ? systemTab.dataset.system : '';
    const selectedGrade = gradeFilter ? gradeFilter.value : "";
    const selectedSubject = subjectFilter ? subjectFilter.value : "";
    
    if (!selectedSystem || !selectedGrade || !selectedSubject) {
        filteredTeachers.innerHTML = `<div class='no-result'>يرجى اختيار النظام والمرحلة والمادة</div>`;
        return;
    }
    
    // جلب المدرسين من السيرفر مباشرة
    let url = `/api/teachers?system=${selectedSystem}&grade_id=${selectedGrade}&subject=${selectedSubject}`;
    let teachers = [];
    try {
        const response = await fetch(url);
        teachers = await response.json();
    } catch (e) {
        filteredTeachers.innerHTML = `<div class='no-result'>خطأ في تحميل المدرسين</div>`;
        return;
    }
    
    teachersPage = page;
    if (teachers.length === 0) {
        filteredTeachers.innerHTML = `
            <div style="width:100%;text-align:right;">
                <span class="close-teachers-list" style="cursor:pointer;font-size:1.5em;">&times;</span>
            </div>
            <div class='no-result'>لا يوجد مدرسين لهذه المعايير</div>
        `;
        addCloseTeachersListEvent();
        return;
    }
    // سلايدر: كرت واحد فقط في كل مرة
    const start = teachersPage * 1;
    const end = start + 1;
    const currentTeachers = teachers.slice(start, end);

    filteredTeachers.style.opacity = 0;
    setTimeout(() => {
        filteredTeachers.innerHTML = `
            <div style="width:100%;text-align:right;">
                <span class="close-teachers-list" style="cursor:pointer;font-size:1.5em;">&times;</span>
            </div>
            ${currentTeachers.map(t =>
        `<div class="teacher-card">
                    ${t.image_url ? `<img src="${getImageUrl(t.image_url)}" alt="${t.name}">` : ''}
            <h4>${t.name}</h4>
                    <p class="subject">${t.subject}</p>
                    <p class="grade">${t.grade_name || ''}</p>
        </div>`
            ).join('')}
        `;
        // إضافة الأسهم إذا كان هناك صفحات أخرى
        let nav = '';
        if (teachers.length > 1) {
            nav += `<div class="teachers-nav" style="width:100%;text-align:center;margin-top:10px;">
                <button class="teachers-prev" ${teachersPage === 0 ? 'disabled' : ''}>&larr;</button>
                <span style="margin:0 10px;">${teachersPage + 1} / ${teachers.length}</span>
                <button class="teachers-next" ${end >= teachers.length ? 'disabled' : ''}>&rarr;</button>
            </div>`;
        }
        filteredTeachers.innerHTML += nav;
        filteredTeachers.style.opacity = 1;
        // تفعيل الأسهم
        const prevBtn = filteredTeachers.querySelector('.teachers-prev');
        const nextBtn = filteredTeachers.querySelector('.teachers-next');
        if (prevBtn) prevBtn.onclick = () => showFilteredTeachers(teachersPage - 1);
        if (nextBtn) nextBtn.onclick = () => showFilteredTeachers(teachersPage + 1);
        addCloseTeachersListEvent();
    }, 180);
}

// تفعيل أزرار الفلاتر
if (langTab) {
    langTab.onclick = function() {
        langTab.classList.add('active');
        if (stateTab) stateTab.classList.remove('active');
        fillFilters('lang');
    };
}
if (stateTab) {
    stateTab.onclick = function() {
        stateTab.classList.add('active');
        if (langTab) langTab.classList.remove('active');
        fillFilters('state');
    };
}

// عند تغيير الفلاتر امسح المدرسين
if (gradeFilter) gradeFilter.onchange = () => { if (filteredTeachers) filteredTeachers.innerHTML = ""; };
if (subjectFilter) subjectFilter.onchange = () => { if (filteredTeachers) filteredTeachers.innerHTML = ""; };

// زرار عرض المدرسين
if (showTeachersBtn) {
    showTeachersBtn.onclick = () => showFilteredTeachers(0);
}

// تعبئة افتراضية عند التحميل
if (langTab && stateTab && gradeFilter && subjectFilter) {
    fillFilters('lang');
}

let teachersPage = 0;
const teachersPerPage = 1;

// دالة تفعيل زر الإكس
function addCloseTeachersListEvent() {
    const closeBtn = filteredTeachers.querySelector('.close-teachers-list');
    if (closeBtn) {
        closeBtn.onclick = () => { filteredTeachers.innerHTML = ""; };
    }
}

// دالة تحديث أزرار الدخول والخروج في النفيجيشن بار
function updateNavAuthButtons(isLoggedIn) {
  if (!userDropdown) return;
  if (isLoggedIn) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = '';
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// عند تحميل الصفحة تحقق من حالة تسجيل الدخول
fetch('/api/check-auth').then(res => {
  if (res.ok) {
    updateNavAuthButtons(true);
  } else {
    updateNavAuthButtons(false);
  }
}).catch(() => updateNavAuthButtons(false));

window.addEventListener('DOMContentLoaded', async function() {
    // تحميل بيانات الأنظمة التعليمية
    await loadSystemData();
    
    // تحميل مدرسي الكورسات
    await loadCourseTeachers();
    
    // تحميل مدرسي الأبطال والمدرسين الجدد
    await loadHeroesAndNewTeachers();
    
    // تحميل بيانات الكورسات
    await loadCoursesData();
    
  const userDisplay = document.getElementById('userDisplay');
  const username = localStorage.getItem('loggedInUsername');
  if (userDisplay && username) {
    userDisplay.textContent = username;
  }
    
    // مراقبة التغييرات في localStorage لتحديث الصفحة عند حذف مدرس
    window.addEventListener('storage', function(e) {
        if (e.key === 'teachersUpdated') {
            loadHeroesAndNewTeachers();
            loadCourseTeachers();
        }
    });
    
    // إضافة دالة عامة لتحديث المدرسين
    window.updateTeachersOnHomepage = function() {
        loadHeroesAndNewTeachers();
        loadCourseTeachers();
    };
});

// تحميل المراحل والمواد
async function loadCoursesData() {
    // تم إزالة الكود - القسم فارغ الآن
}

// إعداد الفلاتر
function setupCourseFilters() {
    // تم إزالة الكود - القسم فارغ الآن
}

// تحديث قائمة المواد حسب المرحلة المختارة
function updateSubjectFilter() {
    // تم إزالة الكود - القسم فارغ الآن
}

// فلترة المدرسين
function filterTeachers() {
    // تم إزالة الكود - القسم فارغ الآن
}

// عرض المدرسين المفلترة
function displayFilteredTeachers(teachers) {
    // تم إزالة الكود - القسم فارغ الآن
}

// مسح جميع الفلاتر
function clearAllFilters() {
    // تم إزالة الكود - القسم فارغ الآن
}

// إنيميشن الإحصائيات
function animateStats() {
    const statItems = document.querySelectorAll('.stat-item');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetNumber = parseInt(target.dataset.target);
                const numberElement = target.querySelector('.stat-number');
                
                animateNumber(numberElement, 0, targetNumber, 2000);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    statItems.forEach(item => observer.observe(item));
}

// دالة إنيميشن العد
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const increment = (end - start) / (duration / 16);
    let current = start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        
        if (elapsed < duration) {
            current += increment;
            element.textContent = Math.floor(current) + '+';
            element.classList.add('counting');
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = end + '+';
            element.classList.remove('counting');
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// تشغيل إنيميشن الإحصائيات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    animateStats();
});



