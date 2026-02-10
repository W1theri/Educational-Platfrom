# 🎓 EduForge - Online Education Platform

Современная образовательная платформа с REST API для управления курсами, студентами и заданиями.

## 🌟 Возможности

### Для Преподавателей
- ✅ Создание и управление курсами
- ✅ Публичные и приватные курсы с ключами доступа
- ✅ Создание заданий с дедлайнами
- ✅ Проверка и оценка работ студентов
- ✅ Отслеживание прогресса студентов
- ✅ Просмотр списка записавшихся студентов

### Для Студентов
- ✅ Поиск и просмотр курсов
- ✅ Запись на курсы (публичные и по ключу)
- ✅ Просмотр заданий
- ✅ Сдача работ с текстом и ссылками
- ✅ Отслеживание своих оценок и прогресса
- ✅ История сданных работ

### Система
- ✅ JWT аутентификация
- ✅ Role-based access control (Student, Teacher, Admin)
- ✅ MongoDB для хранения данных
- ✅ RESTful API
- ✅ Поиск и фильтрация курсов


## 📦 Технологии

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Auth:** JWT (jsonwebtoken), bcrypt
- **Frontend:** Vanilla JS, HTML5, CSS3

## 🚀 Быстрый старт

### 1. Установка

```bash
git clone https://github.com/W1theri/Educational-Platfrom.git
cd Educational-Platfrom
npm install
```

### 2. Настройка .env

```env
MONGO_URI=mongodb://localhost:27017/education-platform
MONGO_DB_NAME=education-platform
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3000
```

### 3. Запуск MongoDB

```bash
mongod
```

### 4. Запуск сервера

```bash
npm start
```

Сервер: `http://localhost:3000`

## 📚 Документация

- [Установка и настройка](./УСТАНОВКА.md)
- [API документация](./API_ДОКУМЕНТАЦИЯ.md)
- [Тестирование](./ТЕСТИРОВАНИЕ.md)

## 🎯 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### Курсы
- `GET /api/courses` - Список курсов
- `POST /api/courses` - Создать курс (teacher)
- `GET /api/courses/:id` - Получить курс
- `PUT /api/courses/:id` - Обновить курс (teacher)
- `DELETE /api/courses/:id` - Удалить курс (teacher/admin)
- `POST /api/courses/:id/enroll` - Записаться на курс (student)
- `GET /api/courses/my/courses` - Мои курсы
- `GET /api/courses/:id/enrollments` - Студенты курса (teacher)

### Задания
- `POST /api/assignments` - Создать задание (teacher)
- `GET /api/assignments/course/:courseId` - Задания курса
- `POST /api/assignments/:id/submit` - Сдать работу (student)
- `PUT /api/assignments/:id/grade` - Оценить работу (teacher)
- `GET /api/assignments/my/submissions` - Мои работы (student)

### Пользователи
- `GET /api/users/profile` - Профиль
- `PUT /api/users/profile` - Обновить профиль
- `PUT /api/users/profile/password` - Изменить пароль

## 💡 Примеры использования

### Создать курс (Teacher)
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Node.js для начинающих",
    "description": "Полный курс по Node.js",
    "category": "Backend",
    "level": "Beginner"
  }'
```

### Записаться на курс (Student)
```bash
curl -X POST http://localhost:3000/api/courses/COURSE_ID/enroll \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Сдать задание (Student)
```bash
curl -X POST http://localhost:3000/api/assignments/ASSIGNMENT_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Мое решение задачи",
    "fileUrl": "https://github.com/user/repo"
  }'
```

## 👥 Команда

### Абдунур
- Authentication system (register, login, JWT)
- User profile endpoints
- Role-based access middleware

### Абильмансур
- Database schemas (Course, Enrollment, Assignment)
- Course management API
- Enrollment system
- Progress tracking

### Диас
- Assignment и submission system
- Testing & integration
- Documentation
- Project structure

## 🔐 Безопасность

- ✅ Пароли хешируются с bcrypt
- ✅ JWT токены с истечением
- ✅ Role-based доступ к endpoints
- ✅ Валидация входных данных
- ✅ Защита от повторной записи на курсы
- ✅ Проверка прав доступа к ресурсам

## 📊 Модели данных

### User
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  role: "student" | "teacher" | "admin",
  dateOfBirth: Date,
  phoneNumber: String
}
```

### Course
```javascript
{
  title: String,
  description: String,
  teacher: ObjectId (User),
  category: "Backend" | "Frontend" | "Data" | ...,
  level: "Beginner" | "Intermediate" | "Advanced",
  isPublic: Boolean,
  enrollmentKey: String (optional)
}
```

### Enrollment
```javascript
{
  student: ObjectId (User),
  course: ObjectId (Course),
  progress: Number (0-100),
  status: "active" | "completed" | "dropped",
  enrolledAt: Date
}
```

### Assignment
```javascript
{
  title: String,
  description: String,
  course: ObjectId (Course),
  dueDate: Date,
  maxGrade: Number,
  submissions: [{
    student: ObjectId (User),
    content: String,
    fileUrl: String,
    grade: Number,
    feedback: String,
    submittedAt: Date
  }]
}
```

## 🧪 Тестирование

Используй Postman или Thunder Client:

1. Зарегистрируй teacher
2. Создай курс
3. Зарегистрируй student
4. Запишись на курс
5. Создай assignment
6. Сдай работу
7. Оцени работу

Подробнее в [ТЕСТИРОВАНИЕ.md](./ТЕСТИРОВАНИЕ.md)

## 🎓 Для преподавателя

### Что было реализовано

✅ **Database Design**
- User, Course, Enrollment, Assignment models
- Mongoose schemas с валидацией
- Индексы для оптимизации

✅ **API Endpoints**
- RESTful архитектура
- Все endpoints из документации
- Правильная обработка ошибок

✅ **Authentication & Authorization**
- JWT токены
- Role-based access control
- Protected routes

✅ **Features**
- Создание и управление курсами
- Система записи с ключами
- Assignments с дедлайнами
- Grading система
- Progress tracking

✅ **Best Practices**
- Модульная структура
- Proper error handling
- Input validation
- Security (bcrypt, JWT)

