import exampleFamilyTreeJson from '../../../data-example/family-tree.json';
import { en } from '../../i18n/translations/en';
import type { FamilyTreeValidationMessages } from '../../i18n/types';
import type {
  FamilyTreeData,
  FamilyTreeDataSource,
  FamilyTreeFamily,
  FamilyTreePerson,
  FamilyTreeState,
} from './types';

const UPLOADED_TREE_STORAGE_KEY = 'family-tree-uploaded-json-v1';
const DEFAULT_VALIDATION_MESSAGES = en.upload.validation;

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

function fileNameToTitle(fileName: string, fallbackTitle: string) {
  const baseName = fileName.replace(/\.json$/i, '').trim();

  return baseName || fallbackTitle;
}

function parseLifeEvent(
  value: unknown,
  label: string,
  messages: FamilyTreeValidationMessages,
): FamilyTreePerson['birth'] | FamilyTreePerson['death'] {
  if (!isRecord(value)) {
    throw new Error(messages.lifeEventMustBeObject(label));
  }

  const { date, dateText, place } = value;

  if (!isNullableString(date) || !isNullableString(dateText) || !isNullableString(place)) {
    throw new Error(
      messages.lifeEventValuesMustBeNullableStrings(label),
    );
  }

  return {
    date,
    dateText,
    place,
  };
}

function parsePerson(
  value: unknown,
  index: number,
  messages: FamilyTreeValidationMessages,
): FamilyTreePerson {
  if (!isRecord(value)) {
    throw new Error(messages.personMustBeObject(index));
  }

  const { id, displayName, sex, birth, death, notes } = value;

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(messages.personIdMustBeNonEmpty(index));
  }

  if (typeof displayName !== 'string' || !displayName.trim()) {
    throw new Error(messages.personDisplayNameMustBeNonEmpty(index));
  }

  if (!isSex(sex)) {
    throw new Error(
      messages.personSexMustBeValid(index),
    );
  }

  if (!isNullableString(notes)) {
    throw new Error(messages.personNotesMustBeNullableString(index));
  }

  return {
    id: id.trim(),
    displayName: displayName.trim(),
    sex,
    birth: parseLifeEvent(birth, `people[${index}].birth`, messages),
    death: parseLifeEvent(death, `people[${index}].death`, messages),
    notes,
  };
}

function parseFamily(
  value: unknown,
  index: number,
  messages: FamilyTreeValidationMessages,
): FamilyTreeFamily {
  if (!isRecord(value)) {
    throw new Error(messages.familyMustBeObject(index));
  }

  const { id, parentIds, childIds } = value;

  if (typeof id !== 'string' || !id.trim()) {
    throw new Error(messages.familyIdMustBeNonEmpty(index));
  }

  if (
    !Array.isArray(parentIds) ||
    parentIds.some((parentId) => typeof parentId !== 'string' || !parentId.trim())
  ) {
    throw new Error(
      messages.familyParentIdsMustBeValid(index),
    );
  }

  if (
    !Array.isArray(childIds) ||
    childIds.some((childId) => typeof childId !== 'string' || !childId.trim())
  ) {
    throw new Error(
      messages.familyChildIdsMustBeValid(index),
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

function validateUniqueIds<T extends { id: string }>(
  items: T[],
  label: 'person' | 'family',
  messages: FamilyTreeValidationMessages,
) {
  const seenIds = new Set<string>();

  for (const item of items) {
    if (seenIds.has(item.id)) {
      throw new Error(messages.duplicateId(label, item.id));
    }

    seenIds.add(item.id);
  }
}

function validateFamilyReferences(
  people: FamilyTreePerson[],
  families: FamilyTreeFamily[],
  messages: FamilyTreeValidationMessages,
) {
  const peopleIds = new Set(people.map((person) => person.id));

  for (const family of families) {
    for (const parentId of family.parentIds) {
      if (!peopleIds.has(parentId)) {
        throw new Error(
          messages.missingParentReference(family.id, parentId),
        );
      }
    }

    for (const childId of family.childIds) {
      if (!peopleIds.has(childId)) {
        throw new Error(
          messages.missingChildReference(family.id, childId),
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
  messages: FamilyTreeValidationMessages,
): FamilyTreeData {
  validateUniqueIds(people, 'person', messages);
  validateUniqueIds(families, 'family', messages);
  validateFamilyReferences(people, families, messages);

  const rootPersonId =
    typeof inputTree?.rootPersonId === 'string' && inputTree.rootPersonId.trim()
      ? inputTree.rootPersonId.trim()
      : deriveRootPersonId(people, families);

  if (!rootPersonId) {
    throw new Error(messages.treeMustContainPerson);
  }

  if (!people.some((person) => person.id === rootPersonId)) {
    throw new Error(messages.rootPersonNotFound(rootPersonId));
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
  messages: FamilyTreeValidationMessages,
): FamilyTreeData {
  if (!isRecord(input.tree)) {
    throw new Error(messages.uploadedJsonMustIncludeTree);
  }

  if (!Array.isArray(input.people)) {
    throw new Error(messages.uploadedJsonMustIncludePeople);
  }

  if (!Array.isArray(input.families)) {
    throw new Error(messages.uploadedJsonMustIncludeFamilies);
  }
  const tree = input.tree as FamilyTreeInputTree;

  if (typeof tree.title !== 'string' || !tree.title.trim()) {
    throw new Error(messages.uploadedJsonMustIncludeTitle);
  }

  if (typeof tree.rootPersonId !== 'string' || !tree.rootPersonId.trim()) {
    throw new Error(
      messages.uploadedJsonMustIncludeRootPersonId,
    );
  }

  const people = input.people.map((person, index) =>
    parsePerson(person, index, messages),
  );
  const families = input.families.map((family, index) =>
    parseFamily(family, index, messages),
  );

  return buildFamilyTreeData(
    people,
    families,
    tree,
    fallbackTitle,
    input.version,
    messages,
  );
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
  'Estonian Family Tree Example',
  DEFAULT_VALIDATION_MESSAGES,
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

export function getExampleFamilyTreeState(): FamilyTreeState {
  return {
    data: exampleFamilyTreeData,
    source: 'example',
  };
}

export function parseUploadedFamilyTreeJson(
  jsonText: string,
  fileName = 'uploaded.json',
  messages = DEFAULT_VALIDATION_MESSAGES,
) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(messages.selectedFileMustBeValidJson);
  }

  if (!isRecord(parsed)) {
    throw new Error(messages.uploadedJsonMustBeObject);
  }

  return parseFamilyTreeInput(
    parsed as FamilyTreeInput,
    fileNameToTitle(fileName, messages.uploadedTreeTitle),
    messages,
  );
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
        data: parseUploadedFamilyTreeJson(
          storedJson,
          DEFAULT_VALIDATION_MESSAGES.uploadedTreeTitle,
        ),
        source: 'uploaded',
      };
    } catch {
      clearPersistedUploadedFamilyTree();
    }
  }

  return getExampleFamilyTreeState();
}

export type { FamilyTreeDataSource };
