'use strict';

const { normalizeLanguage, translate } = window.SGSI18n;
const languageKey = 'sgs-language';
let language = 'uk';
try { language = normalizeLanguage(localStorage.getItem(languageKey)); } catch { /* Storage may be unavailable. */ }

const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const applicationForm = document.getElementById('applicationForm');
// Native required-field validation remains available when JavaScript is disabled.
applicationForm.noValidate = true;
let submitting = false;
let feedback = null;
const t = key => translate(language, key);

function applyLanguage(nextLanguage, persist = true) {
    language = normalizeLanguage(nextLanguage);
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
    ['placeholder', 'aria-label', 'alt', 'content', 'value'].forEach(attribute => {
        document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
            element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
        });
    });
    document.querySelector('meta[property="og:locale"]').content = language === 'en' ? 'en_US' : 'uk_UA';
    document.querySelectorAll('[data-language]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.language === language));
    });
    updateMenuLabel();
    renderFeedback();
    if (persist) {
        try { localStorage.setItem(languageKey, language); } catch { /* Keep the current session usable. */ }
    }
}

document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => applyLanguage(button.dataset.language));
});

function updateMenuLabel() {
    navToggle.setAttribute('aria-label', t(navToggle.getAttribute('aria-expanded') === 'true' ? 'nav.close' : 'nav.open'));
}

function setMenuOpen(open, restoreFocus = false) {
    navMenu.classList.toggle('active', open);
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    updateMenuLabel();
    if (open) navMenu.querySelector('a').focus();
    else if (restoreFocus) navToggle.focus();
}

navToggle.addEventListener('click', () => setMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') setMenuOpen(false, true);
});
document.addEventListener('click', event => {
    if (!navMenu.contains(event.target) && !navToggle.contains(event.target)) setMenuOpen(false);
});
window.matchMedia('(max-width: 1100px)').addEventListener('change', () => setMenuOpen(false));

function scrollToSection(target) {
    if (!target) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
        const id = anchor.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        setMenuOpen(false);
        scrollToSection(target);
        history.replaceState(null, '', `#${id}`);
        if (anchor.classList.contains('skip-link')) target.focus({ preventScroll: true });
    });
});

function scrollToForm() { scrollToSection(document.getElementById('contact')); }

function selectSubscription(lessons) {
    const select = document.getElementById('subscription');
    const value = `${lessons}-lessons`;
    if (!Array.from(select.options).some(option => option.value === value)) return;
    select.value = value;
    scrollToForm();
    select.focus({ preventScroll: true });
}

function validationErrors(data) {
    const errors = [];
    if (!data.name || data.name.trim().length < 2) errors.push({ field: 'name', key: 'form.errorName' });
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.push({ field: 'email', key: 'form.errorEmail' });
    if (!['mental-arithmetic', 'speed-reading', 'school-preparation'].includes(data.course)) errors.push({ field: 'course', key: 'form.errorCourse' });
    if (!['trial-lesson', '12-lessons', '24-lessons', '48-lessons'].includes(data.subscription)) errors.push({ field: 'subscription', key: 'form.errorPackage' });
    return errors;
}

function renderFeedback() {
    if (!feedback || !applicationForm) return;
    let container = document.getElementById('form-feedback');
    if (!container) {
        container = document.createElement('div');
        container.id = 'form-feedback';
        applicationForm.prepend(container);
    }
    container.replaceChildren();
    container.className = feedback.type === 'success' ? 'success-message' : 'error-message';
    container.setAttribute('role', feedback.type === 'success' ? 'status' : 'alert');
    container.style.display = 'block';
    if (feedback.errors) {
        const list = document.createElement('ul');
        feedback.errors.forEach(error => {
            const item = document.createElement('li');
            item.textContent = t(error.key);
            list.append(item);
        });
        container.append(list);
    } else {
        const message = document.createElement('p');
        message.textContent = t(feedback.key);
        container.append(message);
        if (feedback.emailHref) {
            const link = document.createElement('a');
            link.href = feedback.emailHref;
            link.textContent = t('form.emailUs');
            container.append(link);
        }
    }
}

function setSubmitting(value) {
    submitting = value;
    const button = applicationForm.querySelector('.submit-button');
    button.disabled = value;
    button.setAttribute('aria-busy', String(value));
    const label = button.querySelector('span');
    label.dataset.i18n = value ? 'form.sending' : 'form.submit';
    label.textContent = t(label.dataset.i18n);
}

applicationForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    applicationForm.querySelectorAll('[aria-invalid]').forEach(field => {
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
    });
    const formData = new FormData(applicationForm);
    formData.set('_subject', t('form.subject'));
    const data = Object.fromEntries(formData);
    const errors = validationErrors(data);
    if (errors.length) {
        feedback = { type: 'error', errors };
        renderFeedback();
        errors.forEach(error => {
            const field = document.getElementById(error.field);
            field.setAttribute('aria-invalid', 'true');
            field.setAttribute('aria-describedby', 'form-feedback');
        });
        document.getElementById(errors[0].field).focus();
        return;
    }

    feedback = null;
    document.getElementById('form-feedback')?.remove();
    setSubmitting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
        const response = await fetch(applicationForm.action, {
            method: 'POST', body: formData, headers: { Accept: 'application/json' }, signal: controller.signal,
        });
        if (!response.ok) throw new Error('Application request failed');
        feedback = { type: 'success', key: 'form.success' };
        applicationForm.reset();
    } catch {
        // Delivery has not succeeded. Keep the form and offer an explicit email action.
        const body = `${t('form.name')} ${data.name}\nEmail: ${data.email}\n${t('form.course')} ${data.course}\n${t('form.package')} ${data.subscription}\n${t('form.message')}: ${data.message || ''}`;
        feedback = {
            type: 'error', key: 'form.failure',
            emailHref: `mailto:schoolsmartgarden@gmail.com?subject=${encodeURIComponent(t('form.subject'))}&body=${encodeURIComponent(body)}`,
        };
    } finally {
        clearTimeout(timeout);
        setSubmitting(false);
        renderFeedback();
    }
});

applyLanguage(language, false);
