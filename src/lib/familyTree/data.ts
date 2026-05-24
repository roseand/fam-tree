import exampleFamilyTreeJson from '../../../data-example/family-tree.json';
import type {
  FamilyTreeData,
  FamilyTreeDataSource,
  FamilyTreeFamily,
  FamilyTreePerson,
  FamilyTreeState,
} from './types';

const UPLOADED_TREE_STORAGE_KEY = 'family-tree-uploaded-json-v1';

type FamilyTreeInput = {
  version?: unknown;
  tree?: unknown;
  people?: unknown;
  families?: unknown;
};

type FamilyTreeInputTree = {
  id?: unknown;
  title?: unknown;
  rootPersonId?: unknown;
};

export type UploadFormatDocumentationItem = {
  keyPath: string;
  type: string;
  required: 'Yes' | 'No';
  acceptedValues?: string;
  notes?: string;
};

export type UploadFormatDocumentationSection = {
  title: string;
  items: UploadFormatDocumentationItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isSex(value: unknown): value is FamilyTreePerson['sex'] {
  return value === 'female' || value === 'male' || value === 'unknown';
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function fileNameToTitle(fileName: string) {
  const baseName = fileName.replace(/\.json$/i, '').trim();

  return baseName || 'Uploaded Family Tree';
}

function parseLifeEvent(
  value: unknown,
  label: string,
): FamilyTreePerson['birth'] | FamilyTreePerson['death'] {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }

  const { date, dateText, place } = value;

  if (!isNullableString(date) || !isNullableString(dateText) || !isNullableString(place)) {
    throw new Error(
      `${label} must use string-or-null values for date, dateText, and place.`,
    );
  }

  return {
    date,
    dateText,
    place,
  };
}

function parsePerson(value: unknown, index: number): FamilyTreePerson {
  if (!isRecord(value)) {
    throw new Error(`people[${index}] must be an object.`);
  }

  const { id, displayName, sex, birth, death, notes } = value;

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(`people[${index}].id must be a non-empty string.`);
  }

  if (typeof displayName !== 'string' || !displayName.trim()) {
    throw new Error(`people[${index}].displayName must be a non-empty string.`);
  }

  if (!isSex(sex)) {
    throw new Error(
      `people[${index}].sex must be "female", "male", or "unknown".`,
    );
  }

  if (!isNullableString(notes)) {
    throw new Error(`people[${index}].notes must be a string or null.`);
  }

  return {
    id: id.trim(),
    displayName: displayName.trim(),
    sex,
    birth: parseLifeEvent(birth, `people[${index}].birth`),
    death: parseLifeEvent(death, `people[${index}].death`),
    notes,
  };
}

function parseFamily(value: unknown, index: number): FamilyTreeFamily {
  if (!isRecord(value)) {
    throw new Error(`families[${index}] must be an object.`);
  }

  const { id, parentIds, childIds } = value;

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(`families[${index}].id must be a non-empty string.`);
  }

  if (
    !Array.isArray(parentIds) ||
    parentIds.some((parentId) => typeof parentId !== 'string' || !parentId.trim())
  ) {
    throw new Error(
      `families[${index}].parentIds must be an array of non-empty strings.`,
    );
  }

  if (
    !Array.isArray(childIds) ||
    childIds.some((childId) => typeof childId !== 'string' || !childId.trim())
  ) {
    throw new Error(
      `families[${index}].childIds must be an array of non-empty strings.`,
    );
  }

  return {
    id: id.trim(),
    parentIds: parentIds.map((parentId) => parentId.trim()),
    childIds: childIds.map((childId) => childId.trim()),
  };
}

function deriveRootPersonId(
  people: FamilyTreePerson[],
  families: FamilyTreeFamily[],
) {
  const childIds = new Set(families.flatMap((family) => family.childIds));

  return people.find((person) => !childIds.has(person.id))?.id ?? people[0]?.id;
}

function validateUniqueIds<T extends { id: string }>(items: T[], label: string) {
  const seenIds = new Set<string>();

  for (const item of items) {
    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate ${label} id "${item.id}" was found.`);
    }

    seenIds.add(item.id);
  }
}

function validateFamilyReferences(
  people: FamilyTreePerson[],
  families: FamilyTreeFamily[],
) {
  const peopleIds = new Set(people.map((person) => person.id));

  for (const family of families) {
    for (const parentId of family.parentIds) {
      if (!peopleIds.has(parentId)) {
        throw new Error(
          `Family "${family.id}" references missing parent "${parentId}".`,
        );
      }
    }

    for (const childId of family.childIds) {
      if (!peopleIds.has(childId)) {
        throw new Error(
          `Family "${family.id}" references missing child "${childId}".`,
        );
      }
    }
  }
}

function buildFamilyTreeData(
  people: FamilyTreePerson[],
  families: FamilyTreeFamily[],
  inputTree: FamilyTreeInputTree | undefined,
  fallbackTitle: string,
  version: unknown,
): FamilyTreeData {
  validateUniqueIds(people, 'person');
  validateUniqueIds(families, 'family');
  validateFamilyReferences(people, families);

  const rootPersonId =
    typeof inputTree?.rootPersonId === 'string' && inputTree.rootPersonId.trim()
      ? inputTree.rootPersonId.trim()
      : deriveRootPersonId(people, families);

  if (!rootPersonId) {
    throw new Error('The family tree must contain at least one person.');
  }

  if (!people.some((person) => person.id === rootPersonId)) {
    throw new Error(`The rootPersonId "${rootPersonId}" was not found in people.`);
  }

  const title =
    typeof inputTree?.title === 'string' && inputTree.title.trim()
      ? inputTree.title.trim()
      : fallbackTitle;
  const id =
    typeof inputTree?.id === 'string' && inputTree.id.trim()
      ? inputTree.id.trim()
      : slugify(title) || 'family-tree';

  return {
    version: typeof version === 'string' && version.trim() ? version.trim() : '1.0',
    tree: {
      id,
      title,
      rootPersonId,
    },
    people,
    families,
  };
}

function parseFamilyTreeInput(
  input: FamilyTreeInput,
  fallbackTitle: string,
): FamilyTreeData {
  if (!isRecord(input.tree)) {
    throw new Error('The uploaded JSON must include a tree object.');
  }

  if (!Array.isArray(input.people)) {
    throw new Error('The uploaded JSON must include a people array.');
  }

  if (!Array.isArray(input.families)) {
    throw new Error('The uploaded JSON must include a families array.');
  }
  const tree = input.tree as FamilyTreeInputTree;

  if (typeof tree.title !== 'string' || !tree.title.trim()) {
    throw new Error('The uploaded JSON must include tree.title as a non-empty string.');
  }

  if (typeof tree.rootPersonId !== 'string' || !tree.rootPersonId.trim()) {
    throw new Error(
      'The uploaded JSON must include tree.rootPersonId as a non-empty string.',
    );
  }

  const people = input.people.map(parsePerson);
  const families = input.families.map(parseFamily);

  return buildFamilyTreeData(people, families, tree, fallbackTitle, input.version);
}

function readStoredUploadedTree() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage.getItem(UPLOADED_TREE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredUploadedTree(value: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value === null) {
      window.sessionStorage.removeItem(UPLOADED_TREE_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(UPLOADED_TREE_STORAGE_KEY, value);
  } catch {
    // Ignore storage failures and keep the current in-memory data.
  }
}

export const exampleFamilyTreeData = parseFamilyTreeInput(
  exampleFamilyTreeJson as FamilyTreeInput,
  'Family Tree Example',
);

export const uploadFormatPreview = JSON.stringify(
  {
    version: '1.0',
    tree: {
      title: 'My Family Tree',
      rootPersonId: exampleFamilyTreeData.tree.rootPersonId,
    },
    people: exampleFamilyTreeData.people.slice(0, 2),
    families: exampleFamilyTreeData.families.slice(0, 1),
  },
  null,
  2,
);

export const exampleFamilyTreePreview = JSON.stringify(
  {
    version: exampleFamilyTreeData.version,
    tree: exampleFamilyTreeData.tree,
    people: exampleFamilyTreeData.people.slice(0, 3),
    families: exampleFamilyTreeData.families.slice(0, 2),
  },
  null,
  2,
);

export const uploadFormatDocumentation: UploadFormatDocumentationSection[] = [
  {
    title: 'Top-Level Object',
    items: [
      {
        keyPath: 'version',
        type: 'string',
        required: 'No',
        acceptedValues: 'Any non-empty string, typically "1.0".',
        notes: 'If omitted, the app falls back to "1.0".',
      },
      {
        keyPath: 'tree',
        type: 'object',
        required: 'Yes',
        notes: 'Defines metadata and the visual root person, and must include title and rootPersonId.',
      },
      {
        keyPath: 'people',
        type: 'array<object>',
        required: 'Yes',
        notes: 'Each item must be a full person object.',
      },
      {
        keyPath: 'families',
        type: 'array<object>',
        required: 'Yes',
        notes: 'Each item must be a full family relationship object.',
      },
    ],
  },
  {
    title: 'tree Object',
    items: [
      {
        keyPath: 'tree.id',
        type: 'string',
        required: 'No',
        acceptedValues: 'Any non-empty string.',
        notes: 'If omitted, it is derived from the tree title.',
      },
      {
        keyPath: 'tree.title',
        type: 'string',
        required: 'Yes',
        acceptedValues: 'Any non-empty string.',
        notes: 'Used in the UI and as the exported PDF filename base.',
      },
      {
        keyPath: 'tree.rootPersonId',
        type: 'string',
        required: 'Yes',
        acceptedValues: 'Must match a person id from people[].',
        notes: 'Controls the visual root and must point to an existing person.',
      },
    ],
  },
  {
    title: 'Person Object',
    items: [
      {
        keyPath: 'people[].id',
        type: 'string',
        required: 'Yes',
        acceptedValues: 'Unique non-empty string.',
        notes: 'All person ids must be unique across the file.',
      },
      {
        keyPath: 'people[].displayName',
        type: 'string',
        required: 'Yes',
        acceptedValues: 'Any non-empty string.',
      },
      {
        keyPath: 'people[].sex',
        type: 'string',
        required: 'Yes',
        acceptedValues: '"female", "male", or "unknown".',
      },
      {
        keyPath: 'people[].birth',
        type: 'object',
        required: 'Yes',
        notes: 'Must contain date, dateText, and place keys even when the values are null.',
      },
      {
        keyPath: 'people[].death',
        type: 'object',
        required: 'Yes',
        notes: 'Must contain date, dateText, and place keys even when the values are null.',
      },
      {
        keyPath: 'people[].notes',
        type: 'string | null',
        required: 'Yes',
        notes: 'Use null if there are no notes.',
      },
    ],
  },
  {
    title: 'birth / death Event Object',
    items: [
      {
        keyPath: 'people[].birth.date / people[].death.date',
        type: 'string | null',
        required: 'Yes',
        acceptedValues: 'Exact dates should use dd.mm.yyyy.',
      },
      {
        keyPath: 'people[].birth.dateText / people[].death.dateText',
        type: 'string | null',
        required: 'Yes',
        acceptedValues: 'Free text such as "ca 1924".',
        notes: 'Use this when the exact date is not known.',
      },
      {
        keyPath: 'people[].birth.place / people[].death.place',
        type: 'string | null',
        required: 'Yes',
        acceptedValues: 'Any place text or null.',
      },
    ],
  },
  {
    title: 'Family Object',
    items: [
      {
        keyPath: 'families[].id',
        type: 'string',
        required: 'Yes',
        acceptedValues: 'Unique non-empty string.',
      },
      {
        keyPath: 'families[].parentIds',
        type: 'array<string>',
        required: 'Yes',
        acceptedValues: 'Person ids that already exist in people[].',
        notes: 'Every referenced id must match an existing person.',
      },
      {
        keyPath: 'families[].childIds',
        type: 'array<string>',
        required: 'Yes',
        acceptedValues: 'Person ids that already exist in people[].',
        notes: 'Every referenced id must match an existing person.',
      },
    ],
  },
];

export function getExampleFamilyTreeState(): FamilyTreeState {
  return {
    data: exampleFamilyTreeData,
    source: 'example',
    sourceLabel: 'example data',
  };
}

export function parseUploadedFamilyTreeJson(
  jsonText: string,
  fileName = 'uploaded.json',
) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!isRecord(parsed)) {
    throw new Error('The uploaded JSON must be an object.');
  }

  return parseFamilyTreeInput(parsed as FamilyTreeInput, fileNameToTitle(fileName));
}

export function persistUploadedFamilyTree(data: FamilyTreeData) {
  writeStoredUploadedTree(JSON.stringify(data));
}

export function clearPersistedUploadedFamilyTree() {
  writeStoredUploadedTree(null);
}

export function loadInitialFamilyTreeState(): FamilyTreeState {
  const storedJson = readStoredUploadedTree();

  if (storedJson) {
    try {
      return {
        data: parseUploadedFamilyTreeJson(storedJson, 'Uploaded Family Tree'),
        source: 'uploaded',
        sourceLabel: 'uploaded JSON',
      };
    } catch {
      clearPersistedUploadedFamilyTree();
    }
  }

  return getExampleFamilyTreeState();
}

export type { FamilyTreeDataSource };
