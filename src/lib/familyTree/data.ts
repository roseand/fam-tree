import type {
  FamilyTreeData,
  FamilyTreeDataSource,
  FamilyTreeFamily,
  FamilyTreePerson,
} from './types';

type JsonModuleMap<T> = Record<string, T>;

const peopleModules = import.meta.glob('/data/*/people.json', {
  eager: true,
  import: 'default',
}) as JsonModuleMap<FamilyTreePerson[]>;

const familiesModules = import.meta.glob('/data/*/families.json', {
  eager: true,
  import: 'default',
}) as JsonModuleMap<FamilyTreeFamily[]>;

function resolveDataSource() {
  const hasMainPeople = '/data/main/people.json' in peopleModules;
  const hasMainFamilies = '/data/main/families.json' in familiesModules;

  if (hasMainPeople && hasMainFamilies) {
    return 'main' as const;
  }

  if (hasMainPeople !== hasMainFamilies) {
    throw new Error(
      'The data/main folder must contain both people.json and families.json.',
    );
  }

  const hasExamplePeople = '/data/example/people.json' in peopleModules;
  const hasExampleFamilies = '/data/example/families.json' in familiesModules;

  if (hasExamplePeople && hasExampleFamilies) {
    return 'example' as const;
  }

  throw new Error(
    'No family tree data was found. Add people.json and families.json under data/main or data/example.',
  );
}

function deriveRootPersonId(
  people: FamilyTreePerson[],
  families: FamilyTreeFamily[],
) {
  const childIds = new Set(families.flatMap((family) => family.childIds));

  return people.find((person) => !childIds.has(person.id))?.id ?? people[0]?.id;
}

function buildFamilyTreeData(source: FamilyTreeDataSource): FamilyTreeData {
  const people = peopleModules[`/data/${source}/people.json`];
  const families = familiesModules[`/data/${source}/families.json`];
  const rootPersonId = deriveRootPersonId(people, families);

  if (!rootPersonId) {
    throw new Error('The loaded family tree data does not contain any people.');
  }

  return {
    version: '1.0',
    tree: {
      id: 'family-tree',
      title: 'Family Tree',
      rootPersonId,
    },
    people,
    families,
  };
}

export const familyTreeDataSource = resolveDataSource();

export const familyTreeData = buildFamilyTreeData(familyTreeDataSource);
