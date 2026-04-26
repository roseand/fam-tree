import familiesData from './families.json';
import peopleData from './people.json';

export type FamilyTreePerson = {
  id: string;
  displayName: string;
  sex: 'female' | 'male' | 'unknown';
  birth: {
    date: string | null;
    dateText: string | null;
    place: string | null;
  };
  death: {
    date: string | null;
    dateText: string | null;
    place: string | null;
  };
  notes: string | null;
};

export type FamilyTreeFamily = {
  id: string;
  parentIds: string[];
  childIds: string[];
};

export type FamilyTreeData = {
  version: string;
  tree: {
    id: string;
    title: string;
    rootPersonId: string;
  };
  people: FamilyTreePerson[];
  families: FamilyTreeFamily[];
};

const people = peopleData as FamilyTreePerson[];
const families = familiesData as FamilyTreeFamily[];

export const initialFamilyTree: FamilyTreeData = {
  version: '1.0',
  tree: {
    id: 'saar-family',
    title: 'Saar Family Tree',
    rootPersonId: 'p_anna',
  },
  people,
  families,
};
