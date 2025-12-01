// Initialize EmailJS
(function() {
    emailjs.init("YOUR_USER_ID"); // Replace with your EmailJS user ID
})();

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
}

// Scroll to form function
function scrollToForm() {
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
        contactSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Select subscription function
function selectSubscription(lessons, price) {
    const subscriptionSelect = document.getElementById('subscription');
    if (subscriptionSelect) {
        let value = '';
        if (lessons === 12) {
            value = '12-lessons';
        } else if (lessons === 24) {
            value = '24-lessons';
        } else if (lessons === 48) {
            value = '48-lessons';
        }
        
        subscriptionSelect.value = value;
        
        // Scroll to form
        const contactSection = document.querySelector('#contact');
        if (contactSection) {
            contactSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        
        // Highlight the selected subscription in the form
        setTimeout(() => {
            subscriptionSelect.focus();
            subscriptionSelect.style.borderColor = '#fbbf24';
            subscriptionSelect.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.3)';
            
            setTimeout(() => {
                subscriptionSelect.style.borderColor = '';
                subscriptionSelect.style.boxShadow = '';
            }, 2000);
        }, 500);
    }
}

// Form submission handling
const applicationForm = document.getElementById('applicationForm');
if (applicationForm) {
    applicationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);
        
        // Validate form
        if (!validateForm(data)) {
            return;
        }
        
        // Show loading state
        const submitButton = this.querySelector('.submit-button');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-rocket fa-spin"></i> Запускаємо ракету...';
        submitButton.disabled = true;
        
        // Submit form to Formspree
        fetch(this.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Show success message
                showMessage('🚀 Ура! Ваша космічна заявка успішно відправлена! Ми зв\'яжемося з вами найближчим часом для обговорення місії.', 'success');
                
                // Reset form
                this.reset();
            } else {
                throw new Error('Network response was not ok');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Fallback: use mailto method
            const emailSubject = 'Нова заявка на навчання - Smart Garden School';
            const emailBody = `
Нова заявка на навчання:

Ім'я: ${data.name}
Email: ${data.email}
Курс: ${data.course}
Додаткова інформація: ${data.message || 'Не вказано'}

Дата відправки: ${new Date().toLocaleString('uk-UA')}
            `;
            
            const mailtoLink = `mailto:schoolsmartgarden@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            
            try {
                // Create a temporary link and click it
                const tempLink = document.createElement('a');
                tempLink.href = mailtoLink;
                tempLink.style.display = 'none';
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                
                showMessage('📧 Ваша заявка готова до відправки! Будь ласка, перевірте ваш email клієнт та відправте лист на schoolsmartgarden@gmail.com', 'success');
                
            } catch (mailtoError) {
                // Final fallback: show instructions
                showMessage('📧 Ваша заявка готова до відправки! Будь ласка, скопіюйте наступну інформацію та відправте на schoolsmartgarden@gmail.com', 'success');
                
                const emailContent = `
Ім'я: ${data.name}
Email: ${data.email}
Курс: ${data.course}
Додаткова інформація: ${data.message || 'Не вказано'}
                `;
                
                alert(`📧 Скопіюйте цю інформацію та відправте на schoolsmartgarden@gmail.com:\n\n${emailContent}`);
            }
        })
        .finally(() => {
            // Reset button
            setTimeout(() => {
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }, 3000);
        });
    });
}

// Form validation
function validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Ім\'я космонавта повинно містити мінімум 2 символи');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Введіть коректний email адрес');
    }
    
    if (!data.course) {
        errors.push('Оберіть космічний курс');
    }
    
    if (!data.subscription) {
        errors.push('Оберіть абонемент');
    }
    
    if (errors.length > 0) {
        showMessage(errors.join('<br>'), 'error');
        return false;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.innerHTML = message;
    messageDiv.style.display = 'block';
    
    // Add to form
    const form = document.getElementById('applicationForm');
    if (form) {
        form.insertBefore(messageDiv, form.firstChild);
        
        // Auto remove after 8 seconds for success, 5 seconds for error
        setTimeout(() => {
            messageDiv.remove();
        }, type === 'success' ? 8000 : 5000);
    }
}

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(10, 10, 26, 0.98)';
        } else {
            header.style.background = 'rgba(10, 10, 26, 0.95)';
        }
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.course-card, .about-text, .contact-form');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Counter animation for stats
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/[^\d]/g, ''));
        let current = 0;
        const increment = target / 100;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                const suffix = counter.textContent.includes('+') ? '+' : 
                             counter.textContent.includes('%') ? '%' : '';
                counter.textContent = Math.ceil(current) + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = counter.textContent;
            }
        };
        
        updateCounter();
    });
}

// Trigger counter animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroSection = document.querySelector('.hero');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// Add hover effects to course cards
document.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
        this.style.boxShadow = '0 20px 40px rgba(251, 191, 36, 0.4)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    });
});

// Form input focus effects
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'translateX(5px)';
        this.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.3)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'translateX(0)';
        this.style.boxShadow = 'none';
    });
});

// Add loading animation to submit button
document.addEventListener('DOMContentLoaded', () => {
    const submitButton = document.querySelector('.submit-button');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            if (!this.disabled) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 150);
            }
        });
    }
});

// Mobile menu functionality
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (navMenu && navToggle) {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
        
        // Close menu when clicking on a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }
});

// Add cosmic effects to characters
document.addEventListener('DOMContentLoaded', () => {
    const characters = document.querySelectorAll('.character');
    characters.forEach((character, index) => {
        character.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(5deg)';
            this.style.filter = 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.5))';
        });
        
        character.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
            this.style.filter = 'none';
        });
    });
});

// Add planet rotation effects
document.addEventListener('DOMContentLoaded', () => {
    const planets = document.querySelectorAll('.planet');
    planets.forEach(planet => {
        planet.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
            this.style.transform = 'scale(1.2)';
        });
        
        planet.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
            this.style.transform = 'scale(1)';
        });
    });
});

// Add rocket trail effects
function createRocketTrail() {
    const rockets = document.querySelectorAll('.rocket');
    rockets.forEach(rocket => {
        const trail = document.createElement('div');
        trail.style.position = 'absolute';
        trail.style.width = '4px';
        trail.style.height = '20px';
        trail.style.background = 'linear-gradient(to top, #fbbf24, transparent)';
        trail.style.borderRadius = '2px';
        trail.style.left = '50%';
        trail.style.top = '100%';
        trail.style.transform = 'translateX(-50%)';
        trail.style.animation = 'trail 1s ease-out forwards';
        
        rocket.appendChild(trail);
        
        setTimeout(() => {
            trail.remove();
        }, 1000);
    });
}

// Add trail animation
const style = document.createElement('style');
style.textContent = `
    @keyframes trail {
        0% {
            height: 20px;
            opacity: 1;
        }
        100% {
            height: 0px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Trigger rocket trails periodically
setInterval(createRocketTrail, 3000);
