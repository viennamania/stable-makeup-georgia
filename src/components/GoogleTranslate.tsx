'use client';

import React, { useEffect } from 'react';

declare global {
    interface Window {
        googleTranslateElementInit?: () => void;
        google?: any;
    }
}

const GoogleTranslate: React.FC = () => {
    useEffect(() => {
        const initializeGoogleTranslate = () => {
            if (!window.google?.translate?.TranslateElement) {
                return;
            }

            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'ko',
                    includedLanguages: 'ko,en',
                    autoDisplay: false,
                },
                'google_translate_element'
            );
        };

        const addGoogleTranslateScript = () => {
            if (document.querySelector('script[data-google-translate="true"]')) {
                initializeGoogleTranslate();
                return;
            }

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            script.dataset.googleTranslate = 'true';
            document.body.appendChild(script);
        };

        window.googleTranslateElementInit = () => {
            initializeGoogleTranslate();
        };

        addGoogleTranslateScript();

    }, []);

    return (
        <>
        <div
            id="google_translate_element"
            aria-hidden="true"
            className="hidden"
            style={{ display: 'none' }}
        />
        </>
    );
};

export default GoogleTranslate;
