/**
 * i18n - Internationalization Module
 * Handles automatic language detection and dynamic content translation
 * 
 * Supports: English, Spanish, French, German, Portuguese
 * Author: ENDEV
 */

(function (window) {
    'use strict';

    const i18n = {
        // Current language
        currentLanguage: 'en',

        // Available languages
        availableLanguages: ['en', 'es', 'fr', 'de', 'pt'],

        // Language names in their native language
        languageNames: {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'pt': 'Português'
        },

        // Translations cache
        translations: {},

        // Default fallback language
        defaultLanguage: 'en',

        /**
         * Initialize the i18n system
         */
        init: function () {
            console.log('[i18n] Initializing internationalization...');

            // Detect and set language
            const detectedLang = this.detectLanguage();
            this.currentLanguage = detectedLang;

            console.log('[i18n] Detected language:', detectedLang);

            // Load translations and apply
            this.loadLanguage(detectedLang).then(() => {
                this.applyTranslations();
                this.updateLanguageSelector();
                this.setupEventListeners();
                console.log('[i18n] Initialization complete');
            }).catch(err => {
                console.error('[i18n] Failed to initialize:', err);
                // Fallback to default language
                this.loadLanguage(this.defaultLanguage).then(() => {
                    this.applyTranslations();
                });
            });
        },

        /**
         * Detect the browser language or retrieve from localStorage
         * @returns {string} Language code
         */
        detectLanguage: function () {
            // First, check localStorage for saved preference
            const savedLang = localStorage.getItem('endev_language');
            if (savedLang && this.availableLanguages.indexOf(savedLang) !== -1) {
                console.log('[i18n] Using saved language preference:', savedLang);
                return savedLang;
            }

            // Get browser language
            const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
            console.log('[i18n] Browser language:', browserLang);

            // Extract the main language code (e.g., 'en' from 'en-US')
            const langCode = browserLang.split('-')[0];

            // Check if we support this language
            if (this.availableLanguages.indexOf(langCode) !== -1) {
                return langCode;
            }

            // Default to English
            return this.defaultLanguage;
        },

        /**
         * Load translation file for a specific language
         * @param {string} lang - Language code
         * @returns {Promise}
         */
        loadLanguage: function (lang) {
            return new Promise((resolve, reject) => {
                // Check if already loaded
                if (this.translations[lang]) {
                    console.log('[i18n] Language already cached:', lang);
                    resolve(this.translations[lang]);
                    return;
                }

                console.log('[i18n] Loading language file:', lang);

                // Load the JSON file
                fetch(`assets/i18n/${lang}.json`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load ${lang}.json`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        this.translations[lang] = data;
                        console.log('[i18n] Language loaded successfully:', lang);
                        resolve(data);
                    })
                    .catch(error => {
                        console.error('[i18n] Error loading language file:', error);
                        reject(error);
                    });
            });
        },

        /**
         * Get a translation by key path
         * @param {string} key - Translation key (e.g., 'nav.home')
         * @returns {string} Translated text
         */
        translate: function (key) {
            const keys = key.split('.');
            let value = this.translations[this.currentLanguage];

            // Navigate through the nested object
            for (let i = 0; i < keys.length; i++) {
                if (value && value[keys[i]]) {
                    value = value[keys[i]];
                } else {
                    console.warn('[i18n] Translation not found for key:', key);
                    return key; // Return the key itself if translation not found
                }
            }

            return value;
        },

        /**
         * Apply translations to all elements with data-i18n attribute
         */
        applyTranslations: function () {
            console.log('[i18n] Applying translations...');

            // Update page title
            const pageTitle = this.translate('meta.title');
            if (pageTitle) {
                document.title = pageTitle;
            }

            // Update html lang attribute
            document.documentElement.setAttribute('lang', this.currentLanguage);

            // Find all elements with data-i18n attribute
            const elements = document.querySelectorAll('[data-i18n]');

            elements.forEach(element => {
                const key = element.getAttribute('data-i18n');
                const translation = this.translate(key);

                // Check if element is an input/textarea with placeholder
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.hasAttribute('placeholder')) {
                        element.setAttribute('placeholder', translation);
                    }
                } else {
                    // Regular text content
                    element.textContent = translation;
                }
            });

            console.log('[i18n] Translations applied to', elements.length, 'elements');
        },

        /**
         * Change the current language
         * @param {string} lang - Language code
         */
        setLanguage: function (lang) {
            if (this.availableLanguages.indexOf(lang) === -1) {
                console.error('[i18n] Language not supported:', lang);
                return;
            }

            console.log('[i18n] Changing language to:', lang);
            this.currentLanguage = lang;

            // Save to localStorage
            localStorage.setItem('endev_language', lang);

            // Load and apply
            this.loadLanguage(lang).then(() => {
                this.applyTranslations();
                this.updateLanguageSelector();
            });
        },

        /**
         * Update the language selector UI
         */
        updateLanguageSelector: function () {
            const selector = document.getElementById('languageSelect');
            if (selector) {
                selector.value = this.currentLanguage;
            }
        },

        /**
         * Setup event listeners
         */
        setupEventListeners: function () {
            // Language selector change event
            const selector = document.getElementById('languageSelect');
            if (selector) {
                selector.addEventListener('change', (e) => {
                    this.setLanguage(e.target.value);
                });
            }
        }
    };

    // Expose i18n to global scope
    window.i18n = i18n;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            i18n.init();
        });
    } else {
        // DOM already loaded
        i18n.init();
    }

})(window);
