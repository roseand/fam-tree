import { useLanguage } from '../i18n/LanguageContext';

function getFooterLinkFromUrl(urlValue: string | undefined) {
  const href = urlValue?.trim();

  if (!href) {
    return null;
  }

  try {
    const parsedUrl = new URL(href);
    const path = parsedUrl.pathname.replace(/\/$/, '');

    return {
      href,
      label: `${parsedUrl.hostname}${path}`,
    };
  } catch {
    return {
      href,
      label: href.replace(/^https?:\/\//i, '').replace(/\/$/, ''),
    };
  }
}

export function SiteFooter() {
  const { translations } = useLanguage();
  const githubRepositoryLink = getFooterLinkFromUrl(
    import.meta.env.VITE_GITHUB_REPOSITORY_URL,
  );
  const isCoffeeTimeVisible =
    import.meta.env.VITE_SHOW_COFFEE_TIME?.toLowerCase() === 'true';
  const buyMeACoffeeUrl =
    import.meta.env.VITE_BUY_ME_A_COFFEE_URL || 'https://www.buymeacoffee.com/your-page';

  return (
    <footer className="site-strip site-strip--footer">
      {githubRepositoryLink ? (
        <a
          className="site-footer__github-link"
          href={githubRepositoryLink.href}
          target="_blank"
          rel="noreferrer"
        >
          <svg
            className="site-footer__github-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.95c.85 0 1.71.12 2.51.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.82-4.57 5.08.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.15 10.15 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
            />
          </svg>
          <span>{githubRepositoryLink.label}</span>
        </a>
      ) : null}
      {isCoffeeTimeVisible ? (
        <div className="site-footer__actions">
          <a
            className="site-strip__action site-footer__coffee-link"
            href={buyMeACoffeeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="site-strip__action-icon"
              src={`${import.meta.env.BASE_URL}coffee.png`}
              alt=""
              aria-hidden="true"
            />
            <span>{translations.header.coffeeTime}</span>
          </a>
        </div>
      ) : null}
    </footer>
  );
}
