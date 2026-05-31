import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { en } from '../i18n/translations/en';

export function SiteHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language, setLanguage, translations } = useLanguage();
  const { header } = translations;
  const buyMeACoffeeUrl =
    import.meta.env.VITE_BUY_ME_A_COFFEE_URL || 'https://www.buymeacoffee.com/your-page';

  return (
    <header className="site-strip site-strip--header">
      <div className="hero__eyebrow">
        <img
          className="hero__mark"
          src={`${import.meta.env.BASE_URL}fallen-leaf.png`}
          alt=""
          aria-hidden="true"
        />
        <p className="hero__kicker">{en.header.brandName}</p>
      </div>

      <div className="site-header__actions">
        <a
          className="site-header__action site-header__coffee-link"
          href={buyMeACoffeeUrl}
          target="_blank"
          rel="noreferrer"
        >
          <img
            className="site-header__action-icon"
            src={`${import.meta.env.BASE_URL}coffee.png`}
            alt=""
            aria-hidden="true"
          />
          <span>{header.coffeeTime}</span>
        </a>
        <button
          type="button"
          className="site-header__action site-header__settings-button"
          aria-expanded={isSettingsOpen}
          aria-controls="site-settings-menu"
          onClick={() => setIsSettingsOpen((currentValue) => !currentValue)}
        >
          <img
            className="site-header__action-icon"
            src={`${import.meta.env.BASE_URL}settings.png`}
            alt=""
            aria-hidden="true"
          />
          <span>{header.settings}</span>
        </button>
      </div>

      {isSettingsOpen ? (
        <section
          id="site-settings-menu"
          className="site-header__settings-menu"
          aria-label={header.languageSettings}
        >
          <button
            type="button"
            className="site-header__language-option"
            aria-pressed={language === 'et'}
            onClick={() => {
              setLanguage('et');
              setIsSettingsOpen(false);
            }}
          >
            <img
              className="site-header__language-icon"
              src={`${import.meta.env.BASE_URL}flag-ee.png`}
              alt=""
              aria-hidden="true"
            />
            <span>{header.estonian}</span>
          </button>
          <button
            type="button"
            className="site-header__language-option"
            aria-pressed={language === 'en'}
            onClick={() => {
              setLanguage('en');
              setIsSettingsOpen(false);
            }}
          >
            <img
              className="site-header__language-icon"
              src={`${import.meta.env.BASE_URL}flag-gb.png`}
              alt=""
              aria-hidden="true"
            />
            <span>{header.english}</span>
          </button>
        </section>
      ) : null}
    </header>
  );
}
