import type { ReactNode } from 'react';

type JsonCodeBlockProps = {
  jsonText: string;
  className?: string;
};

const JSON_TOKEN_PATTERN =
  /"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;

function getTokenClassName(token: string, fullText: string, tokenEndIndex: number) {
  if (token === '{' || token === '}' || token === '[' || token === ']' || token === ',' || token === ':') {
    return 'json-code__punctuation';
  }

  if (token === 'true' || token === 'false') {
    return 'json-code__boolean';
  }

  if (token === 'null') {
    return 'json-code__null';
  }

  if (/^-?\d/.test(token)) {
    return 'json-code__number';
  }

  if (token.startsWith('"')) {
    const trailingText = fullText.slice(tokenEndIndex);

    return /^\s*:/.test(trailingText) ? 'json-code__key' : 'json-code__string';
  }

  return 'json-code__text';
}

export function JsonCodeBlock({ jsonText, className }: JsonCodeBlockProps) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  jsonText.replace(
    JSON_TOKEN_PATTERN,
    (token: string, offset: number) => {
      if (offset > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="json-code__text">
            {jsonText.slice(lastIndex, offset)}
          </span>,
        );
      }

      const tokenEndIndex = offset + token.length;

      parts.push(
        <span
          key={`token-${offset}`}
          className={getTokenClassName(token, jsonText, tokenEndIndex)}
        >
          {token}
        </span>,
      );

      lastIndex = tokenEndIndex;
      return token;
    },
  );

  if (lastIndex < jsonText.length) {
    parts.push(
      <span key={`text-${lastIndex}`} className="json-code__text">
        {jsonText.slice(lastIndex)}
      </span>,
    );
  }

  return (
    <pre className={className ? `json-code ${className}` : 'json-code'}>
      <code>{parts}</code>
    </pre>
  );
}
