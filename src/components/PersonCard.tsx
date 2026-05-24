import type { ReactNode } from 'react';
import type { PersonNodeData } from '../lib/familyTreeGraph';

function parseExactDate(value: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  return {
    day: Number(match[1]),
    month: Number(match[2]),
    year: Number(match[3]),
  };
}

function parseApproximateYear(value: string) {
  const match = /^ca\s+(\d{4})$/i.exec(value.trim());

  return match ? Number(match[1]) : null;
}

function hasDeathInfo(person: PersonNodeData['person']) {
  return Boolean(person.death.date || person.death.dateText || person.death.place);
}

function getBirthYear(person: PersonNodeData['person']) {
  if (person.birth.date) {
    return parseExactDate(person.birth.date)?.year ?? null;
  }

  if (person.birth.dateText) {
    return parseApproximateYear(person.birth.dateText);
  }

  return null;
}

function isConsideredDeceased(person: PersonNodeData['person']) {
  if (hasDeathInfo(person)) {
    return true;
  }

  const birthYear = getBirthYear(person);

  return birthYear !== null && birthYear < 1940;
}

function getAgeAtDate(
  birthDate: ReturnType<typeof parseExactDate>,
  targetDate: { day: number; month: number; year: number },
) {
  if (!birthDate) {
    return null;
  }

  let age = targetDate.year - birthDate.year;

  if (
    targetDate.month < birthDate.month ||
    (targetDate.month === birthDate.month && targetDate.day < birthDate.day)
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getAgeSuffix(person: PersonNodeData['person']) {
  const isDeceased = isConsideredDeceased(person);

  if (person.birth.date && person.death.date) {
    const birthDate = parseExactDate(person.birth.date);
    const deathDate = parseExactDate(person.death.date);

    if (!deathDate) {
      return null;
    }

    const age = getAgeAtDate(birthDate, deathDate);

    return age !== null ? ` (${age})` : null;
  }

  if (person.birth.dateText && person.death.dateText) {
    const birthYear = parseApproximateYear(person.birth.dateText);
    const deathYear = parseApproximateYear(person.death.dateText);

    if (birthYear === null || deathYear === null) {
      return null;
    }

    const age = deathYear - birthYear;

    return age >= 0 ? ` (ca ${age})` : null;
  }

  if (
    isDeceased &&
    (person.birth.date || person.birth.dateText) &&
    (person.death.date || person.death.dateText)
  ) {
    const birthYear = person.birth.date
      ? parseExactDate(person.birth.date)?.year ?? null
      : person.birth.dateText
        ? parseApproximateYear(person.birth.dateText)
        : null;
    const deathYear = person.death.date
      ? parseExactDate(person.death.date)?.year ?? null
      : person.death.dateText
        ? parseApproximateYear(person.death.dateText)
        : null;

    if (birthYear === null || deathYear === null) {
      return null;
    }

    const age = deathYear - birthYear;

    return age >= 0 ? ` (ca ${age})` : null;
  }

  if (!isDeceased && person.birth.date) {
    const birthDate = parseExactDate(person.birth.date);
    const today = new Date();
    const age = getAgeAtDate(birthDate, {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    });

    return age !== null ? ` (${age})` : null;
  }

  if (!isDeceased && person.birth.dateText) {
    const birthYear = parseApproximateYear(person.birth.dateText);

    if (birthYear === null) {
      return null;
    }

    const age = new Date().getFullYear() - birthYear;

    return age >= 0 ? ` (ca ${age})` : null;
  }

  return null;
}

function formatLifeEvent(
  date: string | null,
  place: string | null,
  dateText: string | null,
) {
  const resolvedDate = dateText ?? date ?? 'Unknown date';
  const resolvedPlace = place?.trim();

  return resolvedPlace ? `${resolvedDate} - ${resolvedPlace}` : resolvedDate;
}

export function getPersonCardClassName(data: PersonNodeData) {
  const sexClassName =
    data.person.sex === 'female'
      ? 'person-node--female'
      : data.person.sex === 'male'
        ? 'person-node--male'
        : 'person-node--unknown';
  const lineageClassName = data.isBloodRelative
    ? 'person-node--bloodline'
    : 'person-node--married-in';

  return `person-node ${sexClassName} ${lineageClassName}`;
}

type PersonCardProps = {
  data: PersonNodeData;
  topAdornment?: ReactNode;
  bottomAdornment?: ReactNode;
  className?: string;
};

export function PersonCard({
  data,
  topAdornment,
  bottomAdornment,
  className,
}: PersonCardProps) {
  const { person } = data;
  const ageSuffix = getAgeSuffix(person);
  const namePrefix = isConsideredDeceased(person) ? '\u2020 ' : '';
  const resolvedClassName = className
    ? `${getPersonCardClassName(data)} ${className}`
    : getPersonCardClassName(data);

  return (
    <article className={resolvedClassName}>
      {topAdornment}
      <h2 className="person-node__name">
        {namePrefix}
        {person.displayName}
        {ageSuffix}
      </h2>
      {person.birth.date || person.birth.dateText || person.birth.place ? (
        <p className="person-node__detail">
          {formatLifeEvent(
            person.birth.date,
            person.birth.place,
            person.birth.dateText,
          )}
        </p>
      ) : null}
      {person.death.date || person.death.dateText || person.death.place ? (
        <p className="person-node__detail">
          {formatLifeEvent(
            person.death.date,
            person.death.place,
            person.death.dateText,
          )}
        </p>
      ) : null}
      {person.notes ? <p className="person-node__notes">{person.notes}</p> : null}
      {bottomAdornment}
    </article>
  );
}
