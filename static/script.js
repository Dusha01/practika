document.addEventListener('DOMContentLoaded', function() {
    fetchScheduleData();
    
    // Обработчик кнопки "Показать расписание"
    document.getElementById('show-schedule').addEventListener('click', function() {
        const groupId = document.getElementById('group-select').value;
        const teacherId = document.getElementById('teacher-select').value;
        displaySchedule(groupId, teacherId);
    });
});

async function fetchScheduleData() {
    try {
        const response = await fetch('http://localhost:5000/data', {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Сервер вернул ошибку ${response.status}: ${errorText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Ожидался JSON, получили: ${contentType}. Ответ: ${text}`);
        }
        
        const data = await response.json();
        
        processData(data);
        
    } catch (error) {
        console.error('Полная ошибка:', error);
        alert(`Не удалось загрузить данные расписания: ${error.message}`);
        
        if (error.response) {
            console.error('Детали ответа:', error.response);
        }
    }
}

function processData(data) {
    if (data.metadata && data.metadata.semester) {
        document.getElementById('semester-info').textContent = data.metadata.semester;
    }
    
    if (data.special_characters && data.special_characters.character) {
        const copyright = Array.isArray(data.special_characters.character) ? 
            data.special_characters.character[0] : data.special_characters.character;
        document.getElementById('copyright').textContent = copyright;
    }
    
    if (data.metadata && data.metadata.university_name) {
        document.getElementById('contacts').textContent = `info@${data.metadata.university_name.toLowerCase().replace(/\s+/g, '')}.edu`;
    }
    
    populateDropdowns(data);
    
    displayLogo(data);
}

function populateDropdowns(data) {
    const groupSelect = document.getElementById('group-select');
    const teacherSelect = document.getElementById('teacher-select');
    
    // Группы
    if (data.groups && data.groups.group) {
        const groups = Array.isArray(data.groups.group) ? data.groups.group : [data.groups.group];
        
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group['@attributes'].id;
            option.textContent = group.code;
            groupSelect.appendChild(option);
        });
    }
    
    if (data.teachers && data.teachers.teacher) {
        const teachers = Array.isArray(data.teachers.teacher) ? data.teachers.teacher : [data.teachers.teacher];
        
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher['@attributes'].id;
            option.textContent = teacher.name;
            teacherSelect.appendChild(option);
        });
    }
}

function displayLogo(data) {
    if (data.image) {
        const logo = document.getElementById('university-logo');
        logo.src = `data:image/${data.image.format};base64,${data.image.data}`;
    }
}

async function displaySchedule(groupId, teacherId) {
    try {
        const response = await fetch('/data');
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        const data = await response.json();
        
        const scheduleDays = document.getElementById('schedule-days');
        scheduleDays.innerHTML = '';
        
        if (data.schedule && data.schedule.day) {
            const days = Array.isArray(data.schedule.day) ? data.schedule.day : [data.schedule.day];
            
            days.forEach(day => {
                const dayElement = document.createElement('div');
                dayElement.className = 'day-schedule';
                
                const dayTitle = document.createElement('div');
                dayTitle.className = 'day-title';
                dayTitle.textContent = day['@attributes'].name;
                dayElement.appendChild(dayTitle);
                
                if (day.lesson) {
                    const lessons = Array.isArray(day.lesson) ? day.lesson : [day.lesson];
                    
                    lessons.forEach(lesson => {
                        if ((groupId && lesson.group && lesson.group['@attributes'].ref === groupId) || 
                            (teacherId && lesson.teacher && lesson.teacher['@attributes'].ref === teacherId)) {
                            
                            const lessonElement = document.createElement('div');
                            lessonElement.className = 'lesson';
                            
                            const timeElement = document.createElement('div');
                            timeElement.className = 'lesson-time';
                            timeElement.textContent = lesson.time;
                            lessonElement.appendChild(timeElement);
                            
                            const infoElement = document.createElement('div');
                            infoElement.className = 'lesson-info';
                            
                            let infoText = lesson.subject;
                            if (lesson.type) infoText += ` (${lesson.type})`;
                            if (lesson.classroom && lesson.classroom['@attributes']) {
                                const classroom = findClassroom(data, lesson.classroom['@attributes'].ref);
                                if (classroom) infoText += `, ауд. ${classroom.number}`;
                            }
                            if (lesson.teacher && lesson.teacher['@attributes']) {
                                const teacher = findTeacher(data, lesson.teacher['@attributes'].ref);
                                if (teacher) infoText += `, ${teacher.name}`;
                            }
                            
                            infoElement.textContent = infoText;
                            lessonElement.appendChild(infoElement);
                            
                            dayElement.appendChild(lessonElement);
                        }
                    });
                }
                
                if (dayElement.children.length > 1) {
                    scheduleDays.appendChild(dayElement);
                }
            });
        }
        
        updateInfoCards(data, groupId, teacherId);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить расписание');
    }
}

// Вспомогательные функции для поиска данных
function findClassroom(data, id) {
    if (data.classrooms && data.classrooms.classroom) {
        const classrooms = Array.isArray(data.classrooms.classroom) ? 
            data.classrooms.classroom : [data.classrooms.classroom];
        return classrooms.find(c => c['@attributes'].id === id);
    }
    return null;
}

function findTeacher(data, id) {
    if (data.teachers && data.teachers.teacher) {
        const teachers = Array.isArray(data.teachers.teacher) ? 
            data.teachers.teacher : [data.teachers.teacher];
        return teachers.find(t => t['@attributes'].id === id);
    }
    return null;
}

function findGroup(data, id) {
    if (data.groups && data.groups.group) {
        const groups = Array.isArray(data.groups.group) ? 
            data.groups.group : [data.groups.group];
        return groups.find(g => g['@attributes'].id === id);
    }
    return null;
}

function updateInfoCards(data, groupId, teacherId) {
    const groupInfoCard = document.querySelector('#group-info .card-content');
    const teacherInfoCard = document.querySelector('#teacher-info .card-content');
    
    groupInfoCard.innerHTML = '<p>Выберите группу для отображения информации</p>';
    teacherInfoCard.innerHTML = '<p>Выберите преподавателя для отображения информации</p>';
    
    if (groupId) {
        const group = findGroup(data, groupId);
        if (group) {
            let html = `<h4>${group.code}</h4>`;
            html += `<p>Курс: ${group.course}</p>`;
            html += `<p>Количество студентов: ${group.students_count}</p>`;
            
            if (group.curator) {
                const curator = findTeacher(data, group.curator['@attributes'].ref);
                if (curator) {
                    html += `<p>Куратор: ${curator.name}</p>`;
                }
            }
            
            if (group['@attributes'].faculty) {
                const faculty = findFaculty(data, group['@attributes'].faculty);
                if (faculty) {
                    html += `<p>Факультет: ${faculty.name}</p>`;
                }
            }
            
            groupInfoCard.innerHTML = html;
        }
    }
    
    if (teacherId) {
        const teacher = findTeacher(data, teacherId);
        if (teacher) {
            let html = `<h4>${teacher.name}</h4>`;
            html += `<p>Должность: ${teacher.position}</p>`;
            html += `<p>Кафедра: ${teacher.department}</p>`;
            html += `<p>Ученая степень: ${teacher.degree}</p>`;
            
            if (teacher.contacts) {
                if (teacher.contacts.email) {
                    html += `<p>Email: <a href="mailto:${teacher.contacts.email}">${teacher.contacts.email}</a></p>`;
                }
                if (teacher.contacts.phone) {
                    html += `<p>Телефон: ${teacher.contacts.phone}</p>`;
                }
            }
            
            teacherInfoCard.innerHTML = html;
        }
    }
}

function findFaculty(data, id) {
    if (data.faculties && data.faculties.faculty) {
        const faculties = Array.isArray(data.faculties.faculty) ? 
            data.faculties.faculty : [data.faculties.faculty];
        return faculties.find(f => f['@attributes'].id === id);
    }
    return null;
}