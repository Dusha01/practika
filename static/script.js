document.addEventListener('DOMContentLoaded', function() {
    // Загрузка данных с сервера
    fetch('/data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }
            return response.json();
        })
        .then(data => {
            // Отображение основной информации
            displayBasicInfo(data);
            
            // Заполнение выпадающих списков
            populateDropdowns(data);
            
            // Настройка обработчиков событий
            setupEventHandlers(data);
        })
        .catch(error => {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
        });
});


function displayBasicInfo(data) {
    // Отображение информации о семестре
    const semesterInfo = document.getElementById('semester-info');
    if (data.university_info && data.university_info.semester) {
        semesterInfo.textContent = data.university_info.semester['#text'] || data.university_info.semester;
    }
    
    // Отображение логотипа
    const logo = document.getElementById('university-logo');
    if (data.images?.image) {
        const images = Array.isArray(data.images.image) ? data.images.image : [data.images.image];
        logo.src = images[0].url?.['#text'] || images[0].url || '';
    }
    
    // Отображение информации в футере
    const copyright = document.getElementById('copyright');
    if (data.special_chars && data.special_chars.char) {
        const chars = Array.isArray(data.special_chars.char) ? 
            data.special_chars.char : [data.special_chars.char];
        copyright.textContent = chars[0]['#text'] || chars[0];
    }
}

function populateDropdowns(data) {
    const groupSelect = document.getElementById('group-select');
    const teacherSelect = document.getElementById('teacher-select');
    
    // Очищаем выпадающие списки
    groupSelect.innerHTML = '<option value="">Выберите группу</option>';
    teacherSelect.innerHTML = '<option value="">Выберите преподавателя</option>';
    
    // Заполняем группы
    if (data.groups?.group) {
        const groups = Array.isArray(data.groups.group) ? data.groups.group : [data.groups.group];
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id?.['#text'] || group.id || '';
            option.textContent = group.code?.['#text'] || group.code || '';
            groupSelect.appendChild(option);
        });
    }
    
    // Добавляем заполнение преподавателей
    if (data.teachers?.teacher) {
        const teachers = Array.isArray(data.teachers.teacher) ? data.teachers.teacher : [data.teachers.teacher];
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id?.['#text'] || teacher.id || '';
            option.textContent = teacher.name?.['#text'] || teacher.name || '';
            teacherSelect.appendChild(option);
        });
    }
}


function setupEventHandlers(data) {
    const showScheduleBtn = document.getElementById('show-schedule');
    
    showScheduleBtn.addEventListener('click', function() {
        const selectedGroupId = document.getElementById('group-select').value;
        const selectedTeacherId = document.getElementById('teacher-select').value;
        
        if (selectedGroupId) {
            displayGroupInfo(selectedGroupId, data);
            displayScheduleForGroup(selectedGroupId, data);
        } 
        else if (selectedTeacherId) {
            displayTeacherInfo(selectedTeacherId, data);
            displayScheduleForTeacher(selectedTeacherId, data);
        }
        else {
            alert('Пожалуйста, выберите группу или преподавателя');
        }
    });
}


function displayGroupInfo(groupId, data) {
    const groupInfoCard = document.getElementById('group-info').querySelector('.card-content');
    
    if (!data.groups || !data.groups.group) return;
    
    const groups = Array.isArray(data.groups.group) ? 
        data.groups.group : [data.groups.group];
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    let html = `
        <p><strong>Код группы:</strong> ${group.code}</p>
    `;
    
    if (data.faculties && data.faculties.faculty) {
        const faculties = Array.isArray(data.faculties.faculty) ? 
            data.faculties.faculty : [data.faculties.faculty];
        
        const faculty = faculties.find(f => f.id === group.faculty);
        if (faculty) {
            html += `<p><strong>Факультет:</strong> ${faculty.name}</p>`;
        }
    }
    
    groupInfoCard.innerHTML = html;
}

function displayTeacherInfo(teacherId, data) {
    const teacherInfoCard = document.getElementById('teacher-info').querySelector('.card-content');
    
    if (!data.teachers?.teacher) return;
    
    const teachers = Array.isArray(data.teachers.teacher) ? data.teachers.teacher : [data.teachers.teacher];
    const teacher = teachers.find(t => (t.id?.['#text'] || t.id) === teacherId);
    
    if (!teacher) return;
    
    teacherInfoCard.innerHTML = `
        <p><strong>Имя:</strong> ${teacher.name?.['#text'] || teacher.name || ''}</p>
        ${teacher.department ? `<p><strong>Кафедра:</strong> ${teacher.department?.['#text'] || teacher.department || ''}</p>` : ''}
    `;
}

function displayScheduleForTeacher(teacherId, data) {
    const scheduleDaysContainer = document.getElementById('schedule-days');
    scheduleDaysContainer.innerHTML = '<h4>Расписание преподавателя</h4>';
    
    if (!data.lessons?.lesson) {
        scheduleDaysContainer.innerHTML += '<p>Нет данных о занятиях</p>';
        return;
    }
    
    const lessons = Array.isArray(data.lessons.lesson) ? data.lessons.lesson : [data.lessons.lesson];
    const teacherLessons = lessons.filter(lesson => 
        (lesson.teacher?.['#text'] || lesson.teacher) === teacherId
    );
    
    if (teacherLessons.length === 0) {
        scheduleDaysContainer.innerHTML += '<p>Нет занятий у выбранного преподавателя</p>';
        return;
    }
    
    const scheduleList = document.createElement('ul');
    scheduleList.className = 'schedule-list';
    
    teacherLessons.forEach(lesson => {
        const day = lesson.day?.['#text'] || lesson.day || '';
        const time = lesson.time?.['#text'] || lesson.time || '';
        const subject = lesson.subject?.['#text'] || lesson.subject || '';
        const groupId = lesson.group?.['#text'] || lesson.group || '';
        
        if (day && time && subject) {
            const lessonItem = document.createElement('li');
            lessonItem.className = 'schedule-item';
            lessonItem.innerHTML = `
                <strong>${day}</strong>: ${time} - ${subject} 
                (Группа: ${getGroupName(groupId, data)})
            `;
            scheduleList.appendChild(lessonItem);
        }
    });
    
    scheduleDaysContainer.appendChild(scheduleList);
}

// Вспомогательная функция для получения названия группы по ID
function getGroupName(groupId, data) {
    if (!data.groups?.group) return groupId;
    
    const groups = Array.isArray(data.groups.group) ? data.groups.group : [data.groups.group];
    const group = groups.find(g => (g.id?.['#text'] || g.id) === groupId);
    
    return group?.code?.['#text'] || group?.code || groupId;
}


function displayScheduleForGroup(groupId, data) {
    const scheduleDaysContainer = document.getElementById('schedule-days');
    scheduleDaysContainer.innerHTML = '<h4>Расписание</h4>';
    
    if (!data.lessons || !data.lessons.lesson) {
        scheduleDaysContainer.innerHTML += '<p>Нет данных о занятиях</p>';
        return;
    }
    
    const lessons = Array.isArray(data.lessons.lesson) ? 
        data.lessons.lesson : [data.lessons.lesson];
    
    const groupLessons = lessons.filter(lesson => 
        (lesson.group?.['#text'] || lesson.group) === groupId
    );
    
    if (groupLessons.length === 0) {
        scheduleDaysContainer.innerHTML += '<p>Нет занятий для выбранной группы</p>';
        return;
    }
    
    const scheduleList = document.createElement('ul');
    
    groupLessons.forEach(lesson => {
        const day = lesson.day?.['#text'] || lesson.day || '';
        const time = lesson.time?.['#text'] || lesson.time || '';
        const subject = lesson.subject?.['#text'] || lesson.subject || '';
        
        if (day && time && subject) {
            const lessonItem = document.createElement('li');
            lessonItem.innerHTML = `
                <strong>${day}</strong>: ${time} - ${subject}
            `;
            scheduleList.appendChild(lessonItem);
        }
    });
    
    scheduleDaysContainer.appendChild(scheduleList);
}