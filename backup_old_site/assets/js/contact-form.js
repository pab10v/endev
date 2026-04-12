/**
 * Contact Form Handler with EmailJS
 * Replaces PHP backend for GitHub Pages compatibility
 * 
 * @author ENDEV
 * @requires emailjs-com@3.x
 */

(function (window, document) {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    /**
     * EmailJS Configuration
     * IMPORTANT: User must update these values after creating EmailJS account
     * See README_EMAILJS.md for setup instructions
     */
    const EMAIL_CONFIG = {
        serviceID: 'artesanous',      // Replace with your EmailJS service ID
        templateID: 'endev001',    // Replace with your EmailJS template ID
        publicKey: 'LrvW_eq15TU-SfpRs'       // Replace with your EmailJS public key
    };

    // Check if configuration is set
    const isConfigured = () => {
        return EMAIL_CONFIG.serviceID !== 'YOUR_SERVICE_ID' &&
            EMAIL_CONFIG.templateID !== 'YOUR_TEMPLATE_ID' &&
            EMAIL_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY';
    };

    // ============================================
    // FORM VALIDATION
    // ============================================

    const validators = {
        name: (value) => {
            if (!value || value.trim().length < 4) {
                return 'Please enter at least 4 characters';
            }
            return null;
        },

        email: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value || !emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
            return null;
        },

        subject: (value) => {
            if (!value || value.trim().length < 4) {
                return 'Please enter at least 4 characters';
            }
            return null;
        },

        message: (value) => {
            if (!value || value.trim().length < 10) {
                return 'Please write at least 10 characters';
            }
            return null;
        }
    };

    /**
     * Validate a single field
     */
    function validateField(fieldName, value) {
        if (validators[fieldName]) {
            return validators[fieldName](value);
        }
        return null;
    }

    /**
     * Validate entire form
     */
    function validateForm(formData) {
        const errors = {};
        let isValid = true;

        Object.keys(validators).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                errors[field] = error;
                isValid = false;
            }
        });

        return { isValid, errors };
    }

    // ============================================
    // UI FEEDBACK
    // ============================================

    const UI = {
        elements: null,

        init: function (form) {
            this.elements = {
                form: form,
                submitButton: form.querySelector('button[type="submit"]'),
                loading: form.querySelector('.loading'),
                errorMessage: form.querySelector('.error-message'),
                successMessage: form.querySelector('.sent-message'),
                fields: {
                    name: form.querySelector('#name'),
                    email: form.querySelector('#email'),
                    subject: form.querySelector('#subject'),
                    message: form.querySelector('#message')
                }
            };
        },

        showLoading: function () {
            this.hideAllMessages();
            this.elements.loading.style.display = 'block';
            this.elements.submitButton.disabled = true;
        },

        hideLoading: function () {
            this.elements.loading.style.display = 'none';
            this.elements.submitButton.disabled = false;
        },

        showSuccess: function (message) {
            this.hideLoading();
            this.elements.successMessage.textContent = message || 'Your message has been sent. Thank you!';
            this.elements.successMessage.style.display = 'block';

            // Hide success message after 5 seconds
            setTimeout(() => {
                this.elements.successMessage.style.display = 'none';
            }, 5000);
        },

        showError: function (message) {
            this.hideLoading();
            this.elements.errorMessage.textContent = message || 'There was an error. Please try again.';
            this.elements.errorMessage.style.display = 'block';

            // Hide error message after 5 seconds
            setTimeout(() => {
                this.elements.errorMessage.style.display = 'none';
            }, 5000);
        },

        hideAllMessages: function () {
            this.elements.loading.style.display = 'none';
            this.elements.errorMessage.style.display = 'none';
            this.elements.successMessage.style.display = 'none';
        },

        showFieldError: function (fieldName, errorMessage) {
            const field = this.elements.fields[fieldName];
            if (field) {
                const validateDiv = field.parentElement.querySelector('.validate');
                if (validateDiv) {
                    validateDiv.textContent = errorMessage;
                    validateDiv.style.display = 'block';
                    field.classList.add('is-invalid');
                }
            }
        },

        clearFieldErrors: function () {
            Object.values(this.elements.fields).forEach(field => {
                // Skip if field doesn't exist in DOM
                if (!field) return;

                const validateDiv = field.parentElement.querySelector('.validate');
                if (validateDiv) {
                    validateDiv.textContent = '';
                    validateDiv.style.display = 'none';
                    field.classList.remove('is-invalid');
                }
            });
        },

        resetForm: function () {
            this.elements.form.reset();
            this.clearFieldErrors();
            this.hideAllMessages();
        }
    };

    // ============================================
    // EMAIL SENDING
    // ============================================

    const EmailService = {
        initialized: false,

        init: function () {
            if (typeof emailjs === 'undefined') {
                console.error('[ContactForm] EmailJS library not loaded');
                return false;
            }

            if (!isConfigured()) {
                console.warn('[ContactForm] EmailJS not configured. Please update EMAIL_CONFIG in contact-form.js');
                return false;
            }

            try {
                emailjs.init(EMAIL_CONFIG.publicKey);
                this.initialized = true;
                console.log('[ContactForm] EmailJS initialized successfully');
                return true;
            } catch (error) {
                console.error('[ContactForm] Failed to initialize EmailJS:', error);
                return false;
            }
        },

        send: function (formData) {
            return new Promise((resolve, reject) => {
                if (!this.initialized) {
                    reject(new Error('EmailJS not initialized'));
                    return;
                }

                // Prepare template parameters
                const templateParams = {
                    from_name: formData.name,
                    from_email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    to_email: 'contact@endev.us'  // Your email
                };

                console.log('[ContactForm] Sending email via EmailJS...');

                emailjs.send(EMAIL_CONFIG.serviceID, EMAIL_CONFIG.templateID, templateParams)
                    .then(response => {
                        console.log('[ContactForm] Email sent successfully:', response);
                        resolve(response);
                    })
                    .catch(error => {
                        console.error('[ContactForm] Failed to send email:', error);
                        reject(error);
                    });
            });
        }
    };

    // ============================================
    // FORM HANDLER
    // ============================================

    const ContactForm = {
        form: null,

        init: function () {
            console.log('[ContactForm] Initializing contact form...');

            // Wait for DOM and i18n to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        },

        setup: function () {
            this.form = document.getElementById('contactForm');

            if (!this.form) {
                console.error('[ContactForm] Form element not found');
                return;
            }

            // Initialize UI
            UI.init(this.form);

            // Initialize EmailJS
            EmailService.init();

            // Attach event listeners
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Real-time validation (optional)
            Object.keys(UI.elements.fields).forEach(fieldName => {
                const field = UI.elements.fields[fieldName];

                // Skip if field doesn't exist
                if (!field) return;

                field.addEventListener('blur', () => {
                    const error = validateField(fieldName, field.value);
                    if (error) {
                        UI.showFieldError(fieldName, error);
                    } else {
                        const validateDiv = field.parentElement.querySelector('.validate');
                        if (validateDiv) {
                            validateDiv.style.display = 'none';
                            field.classList.remove('is-invalid');
                        }
                    }
                });
            });

            console.log('[ContactForm] Setup complete');
        },

        handleSubmit: function (e) {
            e.preventDefault();
            console.log('[ContactForm] Form submitted');

            // Clear previous errors
            UI.clearFieldErrors();

            // Get form data with null checks
            const formData = {
                name: UI.elements.fields.name?.value?.trim() || '',
                email: UI.elements.fields.email?.value?.trim() || '',
                subject: UI.elements.fields.subject?.value?.trim() || '',
                message: UI.elements.fields.message?.value?.trim() || ''
            };

            // Validate form
            const validation = validateForm(formData);

            if (!validation.isValid) {
                console.log('[ContactForm] Validation failed:', validation.errors);
                Object.keys(validation.errors).forEach(field => {
                    UI.showFieldError(field, validation.errors[field]);
                });
                return;
            }

            // Check if EmailJS is configured
            if (!isConfigured()) {
                UI.showError('Contact form is not configured yet. Please contact the administrator.');
                return;
            }

            // Show loading state
            UI.showLoading();

            // Send email
            EmailService.send(formData)
                .then(response => {
                    // Get success message from i18n if available
                    const successMsg = window.i18n ?
                        window.i18n.translate('contact.success_message') :
                        'Your message has been sent successfully. Thank you!';

                    UI.showSuccess(successMsg);

                    // Optional: Reset form after successful submission
                    // Set to false if you want to keep the form data after sending
                    const AUTO_RESET_FORM = true;

                    if (AUTO_RESET_FORM) {
                        UI.resetForm();
                    }
                })
                .catch(error => {
                    // Get error message from i18n if available
                    const errorMsg = window.i18n ?
                        window.i18n.translate('contact.error_message') :
                        'There was an error sending your message. Please try again later.';

                    UI.showError(errorMsg);
                });
        }
    };

    // ============================================
    // AUTO-INITIALIZE
    // ============================================

    ContactForm.init();

    // Expose to global scope for debugging
    window.ContactForm = ContactForm;

})(window, document);
