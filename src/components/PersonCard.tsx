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

function getAgeSuffix(person: PersonNodeData['person']) {
  if (person.birth.date && person.death.date) {
    const birthDate = parseExactDate(person.birth.date);
    const deathDate = parseExactDate(person.death.date);

    if (!birthDate || !deathDate) {
      return null;
    }

    let age = deathDate.year - birthDate.year;

    if (
      deathDate.month < birthDate.month ||
      (deathDate.month === birthDate.month && deathDate.day < birthDate.day)
    ) {
      age -= 1;
    }

    return age >= 0 ? ` (${age})` : null;
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
  const resolvedClassName = className
    ? `${getPersonCardClassName(data)} ${className}`
    : getPersonCardClassName(data);

  return (
    <article className={resolvedClassName}>
      {topAdornment}
      <h2 className="person-node__name">
        {person.displayName}
        {ageSuffix}
      </h2>
      <p className="person-node__detail">
        {formatLifeEvent(person.birth.date, person.birth.place, person.birth.dateText)}
      </p>
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
