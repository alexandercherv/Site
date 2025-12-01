# Налаштування відправки заявок на email

## Варіант 1: Formspree (Рекомендований)

### Кроки налаштування:

1. **Зареєструйтесь на Formspree:**
   - Перейдіть на https://formspree.io
   - Створіть безкоштовний акаунт
   - Підтвердіть ваш email: `schoolsmartgarden@gmail.com`

2. **Створіть нову форму:**
   - Натисніть "New Form"
   - Назвіть форму "Smart Garden School Applications"
   - Скопіюйте endpoint URL (виглядає як `https://formspree.io/f/xqk...`)

3. **Оновіть HTML:**
   - Замініть в `index.html` рядок:
   ```html
   <form class="contact-form" id="applicationForm" action="ВАШ_ENDPOINT_URL" method="POST">
   ```

4. **Перевірте налаштування:**
   - Відправте тестову заявку
   - Перевірте, чи прийшов email на `schoolsmartgarden@gmail.com`

## Варіант 2: EmailJS

### Кроки налаштування:

1. **Зареєструйтесь на EmailJS:**
   - Перейдіть на https://www.emailjs.com
   - Створіть безкоштовний акаунт

2. **Налаштуйте Email Service:**
   - Додайте Gmail як email сервіс
   - Використовуйте `schoolsmartgarden@gmail.com`

3. **Створіть Email Template:**
   - Template ID: `smart_garden_school_template`
   - Subject: `Нова заявка на навчання - Smart Garden School`
   - Body:
   ```
   Нова заявка на навчання:

   Ім'я: {{name}}
   Email: {{email}}
   Курс: {{course}}
   Додаткова інформація: {{message}}

   Дата відправки: {{date}}
   ```

4. **Оновіть JavaScript:**
   - Замініть `YOUR_USER_ID` на ваш EmailJS User ID
   - Замініть `YOUR_SERVICE_ID` на ваш Service ID
   - Замініть `YOUR_TEMPLATE_ID` на ваш Template ID

## Варіант 3: Netlify Forms (Якщо сайт на Netlify)

1. **Додайте атрибут до форми:**
   ```html
   <form class="contact-form" id="applicationForm" name="applications" netlify>
   ```

2. **Налаштуйте у Netlify Dashboard:**
   - Перейдіть до Settings > Forms
   - Налаштуйте email notifications на `schoolsmartgarden@gmail.com`

## Варіант 4: Google Apps Script

1. **Створіть Google Apps Script:**
   ```javascript
   function doPost(e) {
     var data = JSON.parse(e.postData.contents);
     var emailBody = `
       Нова заявка на навчання:
       
       Ім'я: ${data.name}
       Email: ${data.email}
       Курс: ${data.course}
       Додаткова інформація: ${data.message}
       
       Дата: ${new Date()}
     `;
     
     GmailApp.sendEmail(
       'schoolsmartgarden@gmail.com',
       'Нова заявка на навчання - Smart Garden School',
       emailBody
     );
     
     return ContentService.createTextOutput(JSON.stringify({status: 'success'}));
   }
   ```

2. **Опублікуйте як веб-додаток**

3. **Оновіть HTML action на URL веб-додатку**

## Поточний стан

Зараз форма налаштована на Formspree з fallback на mailto. Для повної функціональності потрібно:

1. Зареєструватися на Formspree
2. Отримати endpoint URL
3. Оновити action в HTML
4. Протестувати відправку

## Тестування

Після налаштування:
1. Відправте тестову заявку
2. Перевірте, чи прийшов email
3. Перевірте, чи працює fallback при помилках

## Безпека

- Formspree має вбудований захист від спаму
- EmailJS вимагає налаштування CORS
- Всі варіанти безпечні для використання

