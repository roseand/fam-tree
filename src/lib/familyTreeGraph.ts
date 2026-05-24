import type { Edge, Node, XYPosition } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type {
  FamilyTreeData,
  FamilyTreeFamily,
  FamilyTreePerson,
} from './familyTree';

export type PersonNodeData = {
  person: FamilyTreePerson;
  isBloodRelative: boolean;
  hasParentConnection: boolean;
  hasChildConnection: boolean;
  isSearchHighlighted?: boolean;
  searchHighlightKey?: number;
};

export type FamilyNodeData = {
  family: FamilyTreeFamily;
};

export type PersonGraphNode = Node<PersonNodeData, 'person'>;
export type FamilyGraphNode = Node<FamilyNodeData, 'family'>;
export type FamilyTreeGraphNode = PersonGraphNode | FamilyGraphNode;

const PERSON_WIDTH = 192;
const PERSON_HEIGHT = 192;
const FAMILY_SIZE = 12;
const GENERATION_GAP = 360;
const FAMILY_GAP = 400;
const PARTNER_GAP = 280;
const CHILD_GAP = 260;
const FAMILY_OFFSET_Y = 276;
const PERSON_CENTER_OFFSET_X = PERSON_WIDTH / 2;
const FAMILY_CENTER_OFFSET_X = FAMILY_SIZE / 2;
const MULTI_FAMILY_GAP = 80;
const SIBLING_SUBTREE_GAP = 60;

function buildChildFamilyLookup(tree: FamilyTreeData) {
  const childFamilyIdsByPerson = new Map<string, string[]>();

  for (const family of tree.families) {
    for (const childId of family.childIds) {
      const current = childFamilyIdsByPerson.get(childId) ?? [];
      current.push(family.id);
      childFamilyIdsByPerson.set(childId, current);
    }
  }

  return childFamilyIdsByPerson;
}

function buildParentFamilyLookup(tree: FamilyTreeData) {
  const parentFamilyIdsByPerson = new Map<string, string[]>();

  for (const family of tree.families) {
    for (const parentId of family.parentIds) {
      const current = parentFamilyIdsByPerson.get(parentId) ?? [];
      current.push(family.id);
      parentFamilyIdsByPerson.set(parentId, current);
    }
  }

  return parentFamilyIdsByPerson;
}

function buildFamiliesByParentLookup(tree: FamilyTreeData) {
  const familiesByParent = new Map<string, FamilyTreeFamily[]>();

  for (const family of tree.families) {
    for (const parentId of family.parentIds) {
      const current = familiesByParent.get(parentId) ?? [];
      current.push(family);
      familiesByParent.set(parentId, current);
    }
  }

  return familiesByParent;
}

function inferLevels(tree: FamilyTreeData) {
  const childFamilyIdsByPerson = buildChildFamilyLookup(tree);
  const personLevels = new Map<string, number>();
  const familyLevels = new Map<string, number>();

  for (const person of tree.people) {
    if (!childFamilyIdsByPerson.has(person.id)) {
      personLevels.set(person.id, 0);
    }
  }

  let changed = true;

  while (changed) {
    changed = false;

    for (const family of tree.families) {
      const knownParentLevels = family.parentIds
        .map((parentId) => personLevels.get(parentId))
        .filter((level): level is number => level !== undefined);

      if (knownParentLevels.length > 0) {
        const nextFamilyLevel = Math.max(...knownParentLevels);

        if (familyLevels.get(family.id) !== nextFamilyLevel) {
          familyLevels.set(family.id, nextFamilyLevel);
          changed = true;
        }

        for (const childId of family.childIds) {
          const nextChildLevel = nextFamilyLevel + 1;
          const currentChildLevel = personLevels.get(childId);

          if (
            currentChildLevel === undefined ||
            currentChildLevel < nextChildLevel
          ) {
            personLevels.set(childId, nextChildLevel);
            changed = true;
          }
        }
      }
    }
  }

  return { personLevels, familyLevels };
}

function buildBloodRelativeSet(tree: FamilyTreeData) {
  const familiesByParent = new Map<string, FamilyTreeFamily[]>();
  const familiesByChild = new Map<string, FamilyTreeFamily[]>();

  for (const family of tree.families) {
    for (const parentId of family.parentIds) {
      const current = familiesByParent.get(parentId) ?? [];
      current.push(family);
      familiesByParent.set(parentId, current);
    }

    for (const childId of family.childIds) {
      const current = familiesByChild.get(childId) ?? [];
      current.push(family);
      familiesByChild.set(childId, current);
    }
  }

  const descendantIds = new Set<string>();
  const ancestorIds = new Set<string>();

  function walkDescendants(personId: string) {
    if (descendantIds.has(personId)) {
      return;
    }

    descendantIds.add(personId);

    for (const family of familiesByParent.get(personId) ?? []) {
      for (const childId of family.childIds) {
        walkDescendants(childId);
      }
    }
  }

  function walkAncestors(personId: string) {
    if (ancestorIds.has(personId)) {
      return;
    }

    ancestorIds.add(personId);

    for (const family of familiesByChild.get(personId) ?? []) {
      for (const parentId of family.parentIds) {
        walkAncestors(parentId);
      }
    }
  }

  walkDescendants(tree.tree.rootPersonId);
  walkAncestors(tree.tree.rootPersonId);

  return new Set([...descendantIds, ...ancestorIds]);
}

function findAnchorParentIndex(
  family: FamilyTreeFamily,
  personById: Map<string, FamilyTreePerson>,
) {
  const motherIndex = family.parentIds.findIndex(
    (parentId) => personById.get(parentId)?.sex === 'female',
  );

  return motherIndex >= 0 ? motherIndex : 0;
}

function getPersonCenterX(position: XYPosition) {
  return position.x + PERSON_CENTER_OFFSET_X;
}

function getPersonLeftX(centerX: number) {
  return centerX - PERSON_CENTER_OFFSET_X;
}

function getFamilyLeftX(centerX: number) {
  return centerX - FAMILY_CENTER_OFFSET_X;
}

function estimateFamilyCenterXFromParents(
  family: FamilyTreeFamily,
  personById: Map<string, FamilyTreePerson>,
  personPositions: Map<string, XYPosition>,
) {
  const anchorIndex = findAnchorParentIndex(family, personById);
  const anchorParentId = family.parentIds[anchorIndex];
  const anchorParentPosition = personPositions.get(anchorParentId);

  if (anchorParentPosition) {
    return getPersonCenterX(anchorParentPosition);
  }

  for (let index = 0; index < family.parentIds.length; index += 1) {
    if (index === anchorIndex) {
      continue;
    }

    const parentId = family.parentIds[index];
    const parentPosition = personPositions.get(parentId);

    if (!parentPosition) {
      continue;
    }

    return getPersonCenterX(parentPosition) + (anchorIndex - index) * PARTNER_GAP;
  }

  return undefined;
}

function getInitialFamilyCenterX(slot: number, anchorIndex: number) {
  return slot * FAMILY_GAP + PERSON_CENTER_OFFSET_X + anchorIndex * PARTNER_GAP;
}

type HorizontalReach = {
  leftReach: number;
  rightReach: number;
};

function getFamilyRightmostExtent(
  family: FamilyTreeFamily,
  familyCenterX: number,
  familyReach: HorizontalReach,
) {
  return familyCenterX + familyReach.rightReach;
}

function getFamilyBaseCenterXForParent(
  family: FamilyTreeFamily,
  personId: string,
  personById: Map<string, FamilyTreePerson>,
) {
  const anchorIndex = findAnchorParentIndex(family, personById);
  const parentIndex = family.parentIds.indexOf(personId);

  return (anchorIndex - parentIndex) * PARTNER_GAP;
}

function getChildCenterOffsetsForFamily(
  family: FamilyTreeFamily,
  personById: Map<string, FamilyTreePerson>,
  familiesByParent: Map<string, FamilyTreeFamily[]>,
  subtreeReachByPersonId: Map<string, HorizontalReach>,
  childCenterOffsetsByFamilyId: Map<string, number[]>,
  familyReachByFamilyId: Map<string, HorizontalReach>,
) {
  const existingOffsets = childCenterOffsetsByFamilyId.get(family.id);

  if (existingOffsets) {
    return existingOffsets;
  }

  const childCenterOffsets: number[] = [];
  let previousRightmostExtent = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < family.childIds.length; index += 1) {
    const childId = family.childIds[index];
    const centeredIndex = index - (family.childIds.length - 1) / 2;
    const baseCenterX = centeredIndex * CHILD_GAP;
    const childReach = measurePersonSubtreeReach(
      childId,
      personById,
      familiesByParent,
      subtreeReachByPersonId,
      childCenterOffsetsByFamilyId,
      familyReachByFamilyId,
    );

    const childCenterX =
      previousRightmostExtent !== Number.NEGATIVE_INFINITY
        ? Math.max(
            baseCenterX,
            previousRightmostExtent + SIBLING_SUBTREE_GAP + childReach.leftReach,
          )
        : baseCenterX;

    childCenterOffsets.push(childCenterX);
    previousRightmostExtent = childCenterX + childReach.rightReach;
  }

  childCenterOffsetsByFamilyId.set(family.id, childCenterOffsets);

  return childCenterOffsets;
}

function getFamilyReach(
  family: FamilyTreeFamily,
  personById: Map<string, FamilyTreePerson>,
  familiesByParent: Map<string, FamilyTreeFamily[]>,
  subtreeReachByPersonId: Map<string, HorizontalReach>,
  childCenterOffsetsByFamilyId: Map<string, number[]>,
  familyReachByFamilyId: Map<string, HorizontalReach>,
) {
  const existingReach = familyReachByFamilyId.get(family.id);

  if (existingReach) {
    return existingReach;
  }

  const anchorIndex = findAnchorParentIndex(family, personById);
  let leftReach = FAMILY_CENTER_OFFSET_X;
  let rightReach = FAMILY_CENTER_OFFSET_X;

  for (let index = 0; index < family.parentIds.length; index += 1) {
    const parentOffset = (index - anchorIndex) * PARTNER_GAP;

    leftReach = Math.max(leftReach, PERSON_CENTER_OFFSET_X - parentOffset);
    rightReach = Math.max(rightReach, parentOffset + PERSON_CENTER_OFFSET_X);
  }

  const childCenterOffsets = getChildCenterOffsetsForFamily(
    family,
    personById,
    familiesByParent,
    subtreeReachByPersonId,
    childCenterOffsetsByFamilyId,
    familyReachByFamilyId,
  );

  for (let index = 0; index < family.childIds.length; index += 1) {
    const childId = family.childIds[index];
    const childCenterX = childCenterOffsets[index];
    const childReach = measurePersonSubtreeReach(
      childId,
      personById,
      familiesByParent,
      subtreeReachByPersonId,
      childCenterOffsetsByFamilyId,
      familyReachByFamilyId,
    );

    leftReach = Math.max(leftReach, childReach.leftReach - childCenterX);
    rightReach = Math.max(rightReach, childCenterX + childReach.rightReach);
  }

  const familyReach = { leftReach, rightReach };
  familyReachByFamilyId.set(family.id, familyReach);

  return familyReach;
}

function measurePersonSubtreeReach(
  personId: string,
  personById: Map<string, FamilyTreePerson>,
  familiesByParent: Map<string, FamilyTreeFamily[]>,
  subtreeReachByPersonId: Map<string, HorizontalReach>,
  childCenterOffsetsByFamilyId: Map<string, number[]>,
  familyReachByFamilyId: Map<string, HorizontalReach>,
) {
  const existingReach = subtreeReachByPersonId.get(personId);

  if (existingReach) {
    return existingReach;
  }

  let leftReach = PERSON_CENTER_OFFSET_X;
  let rightReach = PERSON_CENTER_OFFSET_X;
  let previousFamilyRightmostExtent = Number.NEGATIVE_INFINITY;

  for (const family of familiesByParent.get(personId) ?? []) {
    const familyBaseCenterX = getFamilyBaseCenterXForParent(
      family,
      personId,
      personById,
    );
    const familyReach = getFamilyReach(
      family,
      personById,
      familiesByParent,
      subtreeReachByPersonId,
      childCenterOffsetsByFamilyId,
      familyReachByFamilyId,
    );
    const familyCenterX =
      previousFamilyRightmostExtent !== Number.NEGATIVE_INFINITY
        ? Math.max(
            familyBaseCenterX,
            previousFamilyRightmostExtent +
              MULTI_FAMILY_GAP +
              familyReach.leftReach,
          )
        : familyBaseCenterX;

    leftReach = Math.max(leftReach, familyReach.leftReach - familyCenterX);
    rightReach = Math.max(rightReach, familyCenterX + familyReach.rightReach);
    previousFamilyRightmostExtent = Math.max(
      previousFamilyRightmostExtent,
      familyCenterX + familyReach.rightReach,
    );
  }

  const subtreeReach = { leftReach, rightReach };
  subtreeReachByPersonId.set(personId, subtreeReach);

  return subtreeReach;
}

function assignPartnerPositions(
  family: FamilyTreeFamily,
  personById: Map<string, FamilyTreePerson>,
  familyCenterX: number,
  familyY: number,
  personPositions: Map<string, XYPosition>,
) {
  const anchorIndex = findAnchorParentIndex(family, personById);

  for (let index = 0; index < family.parentIds.length; index += 1) {
    const parentId = family.parentIds[index];

    if (personPositions.has(parentId)) {
      continue;
    }

    personPositions.set(parentId, {
      x: getPersonLeftX(familyCenterX + (index - anchorIndex) * PARTNER_GAP),
      y: familyY,
    });
  }
}

function assignChildPositions(
  family: FamilyTreeFamily,
  familyCenterX: number,
  familyY: number,
  childCenterOffsetsByFamilyId: Map<string, number[]>,
  personPositions: Map<string, XYPosition>,
) {
  const childCenterOffsets = childCenterOffsetsByFamilyId.get(family.id) ?? [];

  for (let index = 0; index < family.childIds.length; index += 1) {
    const childId = family.childIds[index];

    if (personPositions.has(childId)) {
      continue;
    }

    personPositions.set(childId, {
      x: getPersonLeftX(familyCenterX + (childCenterOffsets[index] ?? 0)),
      y: familyY,
    });
  }
}

export function buildFamilyTreeGraph(tree: FamilyTreeData) {
  const { personLevels, familyLevels } = inferLevels(tree);
  const bloodRelativeIds = buildBloodRelativeSet(tree);
  const childFamilyIdsByPerson = buildChildFamilyLookup(tree);
  const parentFamilyIdsByPerson = buildParentFamilyLookup(tree);
  const familiesByParent = buildFamiliesByParentLookup(tree);
  const personById = new Map(tree.people.map((person) => [person.id, person]));
  const personPositions = new Map<string, XYPosition>();
  const familyPositions = new Map<string, XYPosition>();
  const subtreeReachByPersonId = new Map<string, HorizontalReach>();
  const childCenterOffsetsByFamilyId = new Map<string, number[]>();
  const familyReachByFamilyId = new Map<string, HorizontalReach>();
  const rightmostChildEdgeByParentId = new Map<string, number>();
  const usedSlotsByLevel = new Map<number, number>();

  const sortedFamilies = [...tree.families].sort((left, right) => {
    const leftLevel = familyLevels.get(left.id) ?? 0;
    const rightLevel = familyLevels.get(right.id) ?? 0;

    if (leftLevel !== rightLevel) {
      return leftLevel - rightLevel;
    }

    return left.id.localeCompare(right.id);
  });

  for (const family of sortedFamilies) {
    const familyLevel = familyLevels.get(family.id) ?? 0;
    const anchorIndex = findAnchorParentIndex(family, personById);
    let familyCenterX: number;
    const estimatedFamilyCenterX = estimateFamilyCenterXFromParents(
      family,
      personById,
      personPositions,
    );

    if (estimatedFamilyCenterX !== undefined) {
      familyCenterX = estimatedFamilyCenterX;
    } else {
      const slot = usedSlotsByLevel.get(familyLevel) ?? 0;
      familyCenterX = getInitialFamilyCenterX(slot, anchorIndex);
      usedSlotsByLevel.set(familyLevel, slot + 1);
    }

    const familyReach = getFamilyReach(
      family,
      personById,
      familiesByParent,
      subtreeReachByPersonId,
      childCenterOffsetsByFamilyId,
      familyReachByFamilyId,
    );

    const requiredCenterXFromPreviousFamilies = Math.max(
      ...family.parentIds.map((parentId) => {
        const rightmostEdge = rightmostChildEdgeByParentId.get(parentId);

        return rightmostEdge !== undefined
          ? rightmostEdge + MULTI_FAMILY_GAP + familyReach.leftReach
          : Number.NEGATIVE_INFINITY;
      }),
    );

    if (requiredCenterXFromPreviousFamilies !== Number.NEGATIVE_INFINITY) {
      familyCenterX = Math.max(familyCenterX, requiredCenterXFromPreviousFamilies);
    }

    const familyY = familyLevel * GENERATION_GAP + FAMILY_OFFSET_Y;

    familyPositions.set(family.id, { x: getFamilyLeftX(familyCenterX), y: familyY });
    assignPartnerPositions(
      family,
      personById,
      familyCenterX,
      familyLevel * GENERATION_GAP,
      personPositions,
    );
    assignChildPositions(
      family,
      familyCenterX,
      (familyLevel + 1) * GENERATION_GAP,
      childCenterOffsetsByFamilyId,
      personPositions,
    );

    const familyRightmostChildEdge = getFamilyRightmostExtent(
      family,
      familyCenterX,
      familyReach,
    );

    for (const parentId of family.parentIds) {
      const currentRightmostEdge = rightmostChildEdgeByParentId.get(parentId);

      rightmostChildEdgeByParentId.set(
        parentId,
        currentRightmostEdge !== undefined
          ? Math.max(currentRightmostEdge, familyRightmostChildEdge)
          : familyRightmostChildEdge,
      );
    }
  }

  const remainingSlotsByLevel = new Map<number, number>();

  for (const person of tree.people) {
    if (personPositions.has(person.id)) {
      continue;
    }

    const level = personLevels.get(person.id) ?? 0;
    const slot = remainingSlotsByLevel.get(level) ?? 0;

    personPositions.set(person.id, {
      x: slot * FAMILY_GAP,
      y: level * GENERATION_GAP,
    });

    remainingSlotsByLevel.set(level, slot + 1);
  }

  const nodes: FamilyTreeGraphNode[] = [
    ...tree.people.map((person) => ({
      id: person.id,
      type: 'person' as const,
      position: personPositions.get(person.id) ?? { x: 0, y: 0 },
      data: {
        person,
        isBloodRelative: bloodRelativeIds.has(person.id),
        hasParentConnection: childFamilyIdsByPerson.has(person.id),
        hasChildConnection: parentFamilyIdsByPerson.has(person.id),
      },
      style: {
        width: PERSON_WIDTH,
        height: PERSON_HEIGHT,
      },
      draggable: false,
      selectable: true,
    })),
    ...tree.families.map((family) => ({
      id: family.id,
      type: 'family' as const,
      position: familyPositions.get(family.id) ?? { x: 0, y: 0 },
      data: { family },
      style: {
        width: FAMILY_SIZE,
        height: FAMILY_SIZE,
      },
      draggable: false,
      selectable: false,
    })),
  ];

  const edges: Edge[] = [];

  for (const family of tree.families) {
    for (const parentId of family.parentIds) {
      edges.push({
        id: `edge-${parentId}-${family.id}`,
        source: parentId,
        target: family.id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#000000',
          strokeWidth: 2,
        },
      });
    }

    for (const childId of family.childIds) {
      edges.push({
        id: `edge-${family.id}-${childId}`,
        source: family.id,
        target: childId,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#000000',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: '#000000',
        },
      });
    }
  }

  return {
    nodes,
    edges,
    dimensions: {
      personWidth: PERSON_WIDTH,
      personHeight: PERSON_HEIGHT,
      familySize: FAMILY_SIZE,
    },
  };
}
