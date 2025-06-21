// script.js

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

// // مؤشر المدرس الحالي لكل مرحلة
// const teacherIndex = {
//   primary: 0,
//   prep: 0,
//   secondary: 0
// };

// دالة عرض المدرس الحالي
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

// استرجاع الوضع من localStorage
if (localStorage.getItem('dark-mode') === 'on') {
  body.classList.add('dark-mode');
}

// عند الضغط على زرار الدارك مود
if (darkToggle) {
  darkToggle.onclick = function () {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
      localStorage.setItem('dark-mode', 'on');
    } else {
      localStorage.setItem('dark-mode', 'off');
    }
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
  loginBtn.href = "login.html";
  loginBtn.id = "loginBtn";
  loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
  userDropdown.appendChild(loginBtn);
}

// إذا لم يوجد زرار logout أضفه (احتياطي)
if (!logoutBtn) {
  logoutBtn = document.createElement('a');
  logoutBtn.href = "#";
  logoutBtn.id = "logoutBtn";
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sign Out';
  userDropdown.appendChild(logoutBtn);
}

// تحديث المينيو حسب حالة المستخدم
function updateUserMenu() {
  const username = localStorage.getItem('username');
  if (username) {
    navUsername.textContent = username;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "flex";
  } else {
    navUsername.textContent = "Username";
    loginBtn.style.display = "flex";
    logoutBtn.style.display = "none";
  }
}
updateUserMenu();

// عند تسجيل الدخول (مثلاً بعد التسجيل الناجح)
function onRegisterSuccess(username) {
  localStorage.setItem('username', username);
  updateUserMenu();
}

// عند تسجيل الخروج
logoutBtn.onclick = function(e) {
  e.preventDefault();
  localStorage.removeItem('username');
  updateUserMenu();
  window.location.href = "login.html";
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

// بيانات الفلاتر حسب النوع
const gradesLang = [
    "1st prime", "2nd prime", "3rd prime", "4th prime", "5th prime", "6th prime",
    "1st prep", "2nd prep", "3rd prep",
    "1st Secondary", "2nd Secondary", "3rd Secondary"
];
const subjectsLang = [
    "Math", "Physics", "Chemistry", "Biology", "Arabic", "English", "French", "History", "Geography"
];
const gradesState = [
    "1st prime", "2nd prime", "3rd prime", "4th prime", "5th prime", "6th prime",
    "1st prep", "2nd prep", "3rd prep",
    "1st Secondary", "2nd Secondary", "3rd Secondary"
];
const subjectsState = [
    "Math", "Physics", "Chemistry", "Biology", "Arabic", "English", "French"
];

// عناصر الفلاتر
const langTab = document.getElementById('languageschoolTab');
const stateTab = document.getElementById('stateschoolTab');
const gradeFilter = document.getElementById('gradeFilter');
const subjectFilter = document.getElementById('subjectFilter');
const showTeachersBtn = document.getElementById('showTeachersBtn');
const filteredTeachers = document.getElementById('filteredTeachers');

// بيانات المدرسين التجريبية
const teachersData = [
    { name: "Mr. Khaled Haggag", img: "images/haggag.jpg", subject: "Math", grade: "1st Secondary", type: "lang" },
    { name: "Mr. Hamaki", img: "images/hamaki.jpg", subject: "Math", grade: "1st Secondary", type: "lang" },
    { name: "Mr. Hamaki", img: "images/hamaki.jpg", subject: "Math", grade: "1st Secondary", type: "lang" },
    { name: "Mr. Abdelazem", img: "images/azem.jpg", subject: "English", grade: "3rd Secondary", type: "lang" },
    { name: "Mr. Hekky", img: "images/hekky.jpg", subject: "Physics", grade: "1st Secondary", type: "state" },
    { name: "Mr. Eldesoky", img: "images/deso.jpg", subject: "French", grade: "2nd Secondary", type: "state" },
    { name: "Mr. Yasser Saleh", img: "images/yasser .jpg", subject: "Chemistry", grade: "3rd Secondary", type: "state" }
];

// دالة لتعبئة الفلاتر
function fillFilters(type) {
    let grades = type === 'lang' ? gradesLang : gradesState;
    let subjects = type === 'lang' ? subjectsLang : subjectsState;
    if (gradeFilter) gradeFilter.innerHTML = grades.map(g => `<option>${g}</option>`).join('');
    if (subjectFilter) subjectFilter.innerHTML = subjects.map(s => `<option>${s}</option>`).join('');
    if (filteredTeachers) filteredTeachers.innerHTML = "";
}

// دالة لعرض المدرسين حسب الفلاتر
function showFilteredTeachers() {
    if (!filteredTeachers) return;
    const selectedType = langTab && langTab.classList.contains('active') ? 'lang' : 'state';
    const selectedGrade = gradeFilter ? gradeFilter.value : "";
    const selectedSubject = subjectFilter ? subjectFilter.value : "";
    const filtered = teachersData.filter(t =>
        t.type === selectedType &&
        (selectedGrade === "" || t.grade === selectedGrade) &&
        (selectedSubject === "" || t.subject === selectedSubject)
    );
    if (filtered.length === 0) {
        filteredTeachers.innerHTML = "<div class='no-result'>No result</div>";
        return;
    }
    filteredTeachers.innerHTML = filtered.map(t =>
        `<div class="teacher-card">
            <img src="${t.img}" alt="${t.name}">
            <h4>${t.name}</h4>
        </div>`
    ).join('');
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
    showTeachersBtn.onclick = showFilteredTeachers;
}

// تعبئة افتراضية عند التحميل
if (langTab && stateTab && gradeFilter && subjectFilter) {
    fillFilters('lang');
}

let teachersPage = 0;
const teachersPerPage = 1;

function showFilteredTeachers(page = 0) {
    if (!filteredTeachers) return;
    const selectedType = langTab && langTab.classList.contains('active') ? 'lang' : 'state';
    const selectedGrade = gradeFilter ? gradeFilter.value : "";
    const selectedSubject = subjectFilter ? subjectFilter.value : "";
    const filtered = teachersData.filter(t =>
        t.type === selectedType &&
        (selectedGrade === "" || t.grade === selectedGrade) &&
        (selectedSubject === "" || t.subject === selectedSubject)
    );
    teachersPage = page;
    if (filtered.length === 0) {
        filteredTeachers.innerHTML = `
            <div style="width:100%;text-align:right;">
                <span class="close-teachers-list" style="cursor:pointer;font-size:1.5em;">&times;</span>
            </div>
            <div class='no-result'>No result</div>
        `;
        addCloseTeachersListEvent();
        return;
    }
    // حساب حدود الصفحة
    const start = teachersPage * teachersPerPage;
    const end = start + teachersPerPage;
    const currentTeachers = filtered.slice(start, end);

    // أنيميشن بسيطة
    filteredTeachers.style.opacity = 0;
    setTimeout(() => {
        filteredTeachers.innerHTML = `
            <div style="width:100%;text-align:right;">
                <span class="close-teachers-list" style="cursor:pointer;font-size:1.5em;">&times;</span>
            </div>
            ${currentTeachers.map(t =>
                `<div class="teacher-card">
                    <img src="${t.img}" alt="${t.name}">
                    <h4>${t.name}</h4>
                </div>`
            ).join('')}
        `;

        // إضافة الأسهم إذا كان هناك صفحات أخرى
        let nav = '';
        if (filtered.length > teachersPerPage) {
            nav += `<div class="teachers-nav" style="width:100%;text-align:center;margin-top:10px;">
                <button class="teachers-prev" ${teachersPage === 0 ? 'disabled' : ''}>&larr;</button>
                <span style="margin:0 10px;">${teachersPage + 1} / ${Math.ceil(filtered.length / teachersPerPage)}</span>
                <button class="teachers-next" ${end >= filtered.length ? 'disabled' : ''}>&rarr;</button>
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

// دالة تفعيل زر الإكس
function addCloseTeachersListEvent() {
    const closeBtn = filteredTeachers.querySelector('.close-teachers-list');
    if (closeBtn) {
        closeBtn.onclick = () => { filteredTeachers.innerHTML = ""; };
    }
}

// زرار عرض المدرسين
if (showTeachersBtn) {
    showTeachersBtn.onclick = () => showFilteredTeachers(0);
}

// عند تغيير الفلاتر امسح المدرسين
if (gradeFilter) gradeFilter.onchange = () => { if (filteredTeachers) filteredTeachers.innerHTML = ""; };
if (subjectFilter) subjectFilter.onchange = () => { if (filteredTeachers) filteredTeachers.innerHTML = ""; };

window.addEventListener('DOMContentLoaded', function() {
  const userDisplay = document.getElementById('userDisplay');
  const username = localStorage.getItem('loggedInUsername');
  if (userDisplay && username) {
    userDisplay.textContent = username;
  }
});