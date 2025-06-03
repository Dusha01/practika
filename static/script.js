document.addEventListener('DOMContentLoaded', function() {
    fetch('/data')
        .then(response => response.json())
        .then(data => {
            displayBasicInfo(data);
            
            populateDropdowns(data);
            
            setupEventHandlers(data);
        })
        .catch(error => console.error('Ошибка загрузки данных:', error));
});

function displayBasicInfo(data) {
    const semesterInfo = document.getElementById('semester-info');
    if (data.metadata && data.metadata.semester) {
        semesterInfo.textContent = data.metadata.semester['#text'];
    }
    
    const logo = document.getElementById('university-logo');
    if (data.image && data.image.data) {
        logo.src = `data:image/png;base64,${data.image.data['#text']}`;
    }
    
    const copyright = document.getElementById('copyright');
    if (data.special_characters && data.special_characters.character) {
        const characters = Array.isArray(data.special_characters.character) ? 
            data.special_characters.character : [data.special_characters.character];
        copyright.textContent = characters.find(c => c['#text'].includes('©'))?.['#text'] || '';
    }
    
    const contacts = document.getElementById('contacts');
    if (data.faculties && data.faculties.faculty) {
        const faculties = Array.isArray(data.faculties.faculty) ? 
            data.faculties.faculty : [data.faculties.faculty];
        contacts.textContent = faculties.map(f => f.contact['#text']).join(', ');
    }
}

function populateDropdowns(data) {
    const groupSelect = document.getElementById('group-select');
    const teacherSelect = document.getElementById('teacher-select');
    
    if (data.groups && data.groups.group) {
        const groups = Array.isArray(data.groups.group) ? 
            data.groups.group : [data.groups.group];
            
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group['@attributes'].id;
            option.textContent = group.code['#text'];
            groupSelect.appendChild(option);
        });
    }
    
    if (data.teachers && data.teachers.teacher) {
        const teachers = Array.isArray(data.teachers.teacher) ? 
            data.teachers.teacher : [data.teachers.teacher];
            
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher['@attributes'].id;
            option.textContent = teacher.name['#text'];
            teacherSelect.appendChild(option);
        });
    }
}

function setupEventHandlers(data) {
    const showScheduleBtn = document.getElementById('show-schedule');
    const groupSelect = document.getElementById('group-select');
    const teacherSelect = document.getElementById('teacher-select');
    
    showScheduleBtn.addEventListener('click', function() {
        const selectedGroupId = groupSelect.value;
        const selectedTeacherId = teacherSelect.value;
        
        if (selectedGroupId) {
            displayGroupInfo(selectedGroupId, data);
            displayScheduleForGroup(selectedGroupId, data);
        }
        
        if (selectedTeacherId) {
            displayTeacherInfo(selectedTeacherId, data);
            if (!selectedGroupId) {
                displayScheduleForTeacher(selectedTeacherId, data);
            }
        }
    });
}

function displayGroupInfo(groupId, data) {
    const groupInfoCard = document.getElementById('group-info').querySelector('.card-content');
    
    if (!data.groups || !data.groups.group) return;
    
    const groups = Array.isArray(data.groups.group) ? 
        data.groups.group : [data.groups.group];
    
    const group = groups.find(g => g['@attributes'].id === groupId);
    if (!group) return;
    
    let html = `
        <p><strong>Код группы:</strong> ${group.code['#text']}</p>
        <p><strong>Курс:</strong> ${group.course['#text']}</p>
        <p><strong>Количество студентов:</strong> ${group.students_count['#text']}</p>
        <p><strong>Куратор:</strong> ${group.curator['#text']}</p>
    `;
    
    if (data.faculties && data.faculties.faculty) {
        const faculties = Array.isArray(data.faculties.faculty) ? 
            data.faculties.faculty : [data.faculties.faculty];
        
        const faculty = faculties.find(f => f['@attributes'].id === group['@attributes'].faculty);
        if (faculty) {
            html += `<p><strong>Факультет:</strong> ${faculty.name['#text']}</p>`;
            html += `<p><strong>Декан:</strong> ${faculty.dean['#text']}</p>`;
        }
    }
    
    groupInfoCard.innerHTML = html;
}

function displayTeacherInfo(teacherId, data) {
    const teacherInfoCard = document.getElementById('teacher-info').querySelector('.card-content');
    
    if (!data.teachers || !data.teachers.teacher) return;
    
    const teachers = Array.isArray(data.teachers.teacher) ? 
        data.teachers.teacher : [data.teachers.teacher];
    
    const teacher = teachers.find(t => t['@attributes'].id === teacherId);
    if (!teacher) return;
    
    let html = `
        <p><strong>ФИО:</strong> ${teacher.name['#text']}</p>
        <p><strong>Должность:</strong> ${teacher.position['#text']}</p>
        <p><strong>Кафедра:</strong> ${teacher.department['#text']}</p>
        <p><strong>Ученая степень:</strong> ${teacher.degree['#text']}</p>
    `;
    
    if (teacher.contacts) {
        html += '<p><strong>Контакты:</strong></p><ul>';
        
        if (teacher.contacts.email) {
            html += `<li>Email: ${teacher.contacts.email['#text']}</li>`;
        }
        
        if (teacher.contacts.phone) {
            html += `<li>Телефон: ${teacher.contacts.phone['#text']}</li>`;
        }
        
        html += '</ul>';
    }
    
    teacherInfoCard.innerHTML = html;
}

function displayScheduleForGroup(groupId, data) {
    const scheduleDaysContainer = document.getElementById('schedule-days');
    scheduleDaysContainer.innerHTML = '';
    
    if (!data.schedule || !data.schedule.day) return;
    
    const days = Array.isArray(data.schedule.day) ? 
        data.schedule.day : [data.schedule.day];
    
    days.forEach(day => {
        if (!day.lesson) return;
        
        const lessons = Array.isArray(day.lesson) ? 
            day.lesson : [day.lesson];
            
        const groupLessons = lessons.filter(lesson => 
            lesson.group && lesson.group['@attributes'].ref === groupId
        );
        
        if (groupLessons.length === 0) return;
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day-schedule';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day['@attributes'].name;
        dayElement.appendChild(dayHeader);
        
        groupLessons.forEach(lesson => {
            const lessonElement = document.createElement('div');
            lessonElement.className = 'lesson';
            
            let time = lesson.time ? lesson.time['#text'] : 'Время не указано';
            let subject = lesson.subject ? lesson.subject['#text'] : 'Предмет не указан';
            let type = lesson.type ? lesson.type['#text'] : 'Тип не указан';
            let weekly = lesson.weekly ? lesson.weekly['#text'] : '';
            
            let teacherName = 'Преподаватель не указан';
            if (lesson.teacher && data.teachers && data.teachers.teacher) {
                const teachers = Array.isArray(data.teachers.teacher) ? 
                    data.teachers.teacher : [data.teachers.teacher];
                
                const teacher = teachers.find(t => 
                    t['@attributes'].id === lesson.teacher['@attributes'].ref
                );
                
                if (teacher) {
                    teacherName = teacher.name['#text'];
                }
            }
            
            let classroomInfo = 'Аудитория не указана';
            if (lesson.classroom && data.classrooms && data.classrooms.classroom) {
                const classrooms = Array.isArray(data.classrooms.classroom) ? 
                    data.classrooms.classroom : [data.classrooms.classroom];
                
                const classroom = classrooms.find(r => 
                    r['@attributes'].id === lesson.classroom['@attributes'].ref
                );
                
                if (classroom) {
                    classroomInfo = `${classroom.number['#text']} (${classroom.building['#text']})`;
                }
            }
            
            lessonElement.innerHTML = `
                <div>
                    <strong>${time}</strong><br>
                    ${subject}<br>
                    <em>${type}</em> ${weekly ? `(${weekly})` : ''}
                </div>
                <div>
                    ${teacherName}<br>
                    ${classroomInfo}
                </div>
            `;
            
            dayElement.appendChild(lessonElement);
        });
        
        scheduleDaysContainer.appendChild(dayElement);
    });
}

function displayScheduleForTeacher(teacherId, data) {
    const scheduleDaysContainer = document.getElementById('schedule-days');
    scheduleDaysContainer.innerHTML = '';
    
    if (!data.schedule || !data.schedule.day) return;
    
    const days = Array.isArray(data.schedule.day) ? 
        data.schedule.day : [data.schedule.day];
    
    days.forEach(day => {
        if (!day.lesson) return;
        
        const lessons = Array.isArray(day.lesson) ? 
            day.lesson : [day.lesson];
            
        const teacherLessons = lessons.filter(lesson => 
            lesson.teacher && lesson.teacher['@attributes'].ref === teacherId
        );
        
        if (teacherLessons.length === 0) return;
        
        const dayElement = document.createElement('div');
        dayElement.className = 'day-schedule';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day['@attributes'].name;
        dayElement.appendChild(dayHeader);
        
        teacherLessons.forEach(lesson => {
            const lessonElement = document.createElement('div');
            lessonElement.className = 'lesson';
            
            let time = lesson.time ? lesson.time['#text'] : 'Время не указано';
            let subject = lesson.subject ? lesson.subject['#text'] : 'Предмет не указан';
            let type = lesson.type ? lesson.type['#text'] : 'Тип не указан';
            let weekly = lesson.weekly ? lesson.weekly['#text'] : '';
            
            let groupInfo = 'Группа не указана';
            if (lesson.group && data.groups && data.groups.group) {
                const groups = Array.isArray(data.groups.group) ? 
                    data.groups.group : [data.groups.group];
                
                const group = groups.find(g => 
                    g['@attributes'].id === lesson.group['@attributes'].ref
                );
                
                if (group) {
                    groupInfo = group.code['#text'];
                }
            }
            
            let classroomInfo = 'Аудитория не указана';
            if (lesson.classroom && data.classrooms && data.classrooms.classroom) {
                const classrooms = Array.isArray(data.classrooms.classroom) ? 
                    data.classrooms.classroom : [data.classrooms.classroom];
                
                const classroom = classrooms.find(r => 
                    r['@attributes'].id === lesson.classroom['@attributes'].ref
                );
                
                if (classroom) {
                    classroomInfo = `${classroom.number['#text']} (${classroom.building['#text']})`;
                }
            }
            
            lessonElement.innerHTML = `
                <div>
                    <strong>${time}</strong><br>
                    ${subject}<br>
                    <em>${type}</em> ${weekly ? `(${weekly})` : ''}
                </div>
                <div>
                    Группа: ${groupInfo}<br>
                    ${classroomInfo}
                </div>
            `;
            
            dayElement.appendChild(lessonElement);
        });
        
        scheduleDaysContainer.appendChild(dayElement);
    });
}