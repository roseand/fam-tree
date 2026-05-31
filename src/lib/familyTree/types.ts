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

export type FamilyTreeDataSource = 'example' | 'uploaded';

export type FamilyTreeState = {
  data: FamilyTreeData;
  source: FamilyTreeDataSource;
};
