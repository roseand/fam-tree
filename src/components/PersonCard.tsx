import type { ReactNode } from 'react';
import type { PersonNodeData } from '../lib/familyTreeGraph';

function formatLifeEvent(
  date: string | null,
  place: string | null,
  dateText: string | null,
) {
  const resolvedDate = dateText ?? date ?? 'Unknown date';
  const resolvedPlace = place ?? 'Unknown place';

  return `${resolvedDate} - ${resolvedPlace}`;
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
  const resolvedClassName = className
    ? `${getPersonCardClassName(data)} ${className}`
    : getPersonCardClassName(data);

  return (
    <article className={resolvedClassName}>
      {topAdornment}
      <h2 className="person-node__name">{person.displayName}</h2>
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
