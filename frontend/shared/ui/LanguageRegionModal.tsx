'use client';

import { Check, Languages, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LanguageRegionModalProps {
  onClose: () => void;
}

interface LocaleOption {
  id: string;
  language: string;
  region: string;
}

const suggestedLocales: LocaleOption[] = [
  { id: 'en-US', language: 'English', region: 'United States' },
  { id: 'en-GB', language: 'English', region: 'United Kingdom' },
  { id: 'hi-IN', language: 'हिन्दी', region: 'भारत' },
  { id: 'kn-IN', language: 'ಕನ್ನಡ', region: 'ಭಾರತ' },
  { id: 'mr-IN', language: 'मराठी', region: 'भारत' },
];

const allLocales: LocaleOption[] = [
  { id: 'en-IN', language: 'English', region: 'India' },
  { id: 'az-AZ', language: 'Azərbaycan dili', region: 'Azərbaycan' },
  { id: 'id-ID', language: 'Bahasa Indonesia', region: 'Indonesia' },
  { id: 'bs-BA', language: 'Bosanski', region: 'Bosna i Hercegovina' },
  { id: 'ca-ES', language: 'Català', region: 'Espanya' },
  { id: 'cs-CZ', language: 'Čeština', region: 'Česká republika' },
  { id: 'cnr-ME', language: 'Crnogorski', region: 'Crna Gora' },
  { id: 'da-DK', language: 'Dansk', region: 'Danmark' },
  { id: 'de-DE', language: 'Deutsch', region: 'Deutschland' },
  { id: 'de-AT', language: 'Deutsch', region: 'Österreich' },
  { id: 'de-CH', language: 'Deutsch', region: 'Schweiz' },
  { id: 'de-LU', language: 'Deutsch', region: 'Luxemburg' },
  { id: 'et-EE', language: 'Eesti', region: 'Eesti' },
  { id: 'en-AU', language: 'English', region: 'Australia' },
  { id: 'en-CA', language: 'English', region: 'Canada' },
  { id: 'es-ES', language: 'Español', region: 'España' },
  { id: 'fr-FR', language: 'Français', region: 'France' },
  { id: 'it-IT', language: 'Italiano', region: 'Italia' },
  { id: 'ja-JP', language: '日本語', region: '日本' },
  { id: 'ko-KR', language: '한국어', region: '대한민국' },
  { id: 'nl-NL', language: 'Nederlands', region: 'Nederland' },
  { id: 'pl-PL', language: 'Polski', region: 'Polska' },
  { id: 'pt-BR', language: 'Português', region: 'Brasil' },
  { id: 'sv-SE', language: 'Svenska', region: 'Sverige' },
  { id: 'tr-TR', language: 'Türkçe', region: 'Türkiye' },
];

export default function LanguageRegionModal({ onClose }: LanguageRegionModalProps) {
  const [selectedLocale, setSelectedLocale] = useState('en-IN');
  const [translationEnabled, setTranslationEnabled] = useState(true);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem('roamly-locale');
    const storedTranslation = window.localStorage.getItem('roamly-auto-translate');
    if (storedLocale) setSelectedLocale(storedLocale);
    if (storedTranslation !== null) setTranslationEnabled(storedTranslation === 'true');

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  function chooseLocale(locale: LocaleOption) {
    setSelectedLocale(locale.id);
    window.localStorage.setItem('roamly-locale', locale.id);
  }

  function toggleTranslation() {
    const nextValue = !translationEnabled;
    setTranslationEnabled(nextValue);
    window.localStorage.setItem('roamly-auto-translate', String(nextValue));
  }

  return (
    <div className="language-modal-backdrop" onMouseDown={onClose}>
      <section
        className="language-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="language-modal-header">
          <button className="language-modal-close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </header>

        <div className="language-modal-content">
          <button className="translation-setting" onClick={toggleTranslation} type="button">
            <span className="translation-copy">
              <strong>
                Translation <Languages size={19} />
              </strong>
              <span>Automatically translate descriptions and reviews to English.</span>
            </span>
            <span
              className={`translation-toggle${translationEnabled ? ' enabled' : ''}`}
              role="switch"
              aria-checked={translationEnabled}
            >
              {translationEnabled && <Check size={18} />}
            </span>
          </button>

          <LanguageGroup
            title="Suggested languages and regions"
            locales={suggestedLocales}
            selectedLocale={selectedLocale}
            onSelect={chooseLocale}
          />
          <LanguageGroup
            title="Choose a language and region"
            locales={allLocales}
            selectedLocale={selectedLocale}
            onSelect={chooseLocale}
          />
        </div>
      </section>
    </div>
  );
}

function LanguageGroup({
  title,
  locales,
  selectedLocale,
  onSelect,
}: {
  title: string;
  locales: LocaleOption[];
  selectedLocale: string;
  onSelect: (locale: LocaleOption) => void;
}) {
  return (
    <section className="language-group">
      <h2 id={title.startsWith('Suggested') ? 'language-modal-title' : undefined}>{title}</h2>
      <div className="language-grid">
        {locales.map((locale) => (
          <button
            className={selectedLocale === locale.id ? 'selected' : ''}
            key={locale.id}
            onClick={() => onSelect(locale)}
            aria-pressed={selectedLocale === locale.id}
          >
            <span>{locale.language}</span>
            <small>{locale.region}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
