import type { Translations } from '../types';

export const en: Translations = {
  language: 'en',
  header: {
    brandName: 'Family Tree Visualiser',
    coffeeTime: 'Coffee Time',
    settings: 'Settings',
    languageSettings: 'Language settings',
    estonian: 'eesti keeles',
    english: 'in english',
  },
  common: {
    unknown: 'unknown',
    copy: 'Copy',
    copied: 'Copied',
    required: 'Required',
    optional: 'Optional',
    type: 'Type',
    accepted: 'Accepted',
    notes: 'Notes',
    dataSources: {
      example: 'example',
      uploaded: 'uploaded',
    },
  },
  landing: {
    title: 'Family Tree Visualiser',
    intro:
      'Explore your family history in a clear, interactive tree. Upload your own data and create a printable PDF that brings generations together in one view.',
    uploadTitle: 'Visualise Your Own Family Tree',
    uploadIntro:
      'Use the example as a guide to build your own family-tree JSON file. When it is ready, choose the file below to explore your family in the interactive graph and create a printable PDF.',
    chooseJsonFile: 'Choose JSON File',
    useExampleData: 'Use Example Data',
    exampleTreesLabel: 'Example Trees',
    exampleTreeOption: (title) => title,
    privacyNotice:
      'Your file stays private: it is read locally and kept only in this browser session. It is not uploaded to a server.',
    exampleFilePreview: 'Example File Preview',
    uploadFormatDocumentation: 'Upload Format Documentation',
    interactiveGraph: 'Interactive Graph',
    showingSource: (sourceLabel, title) => `Showing ${sourceLabel}: ${title}`,
    rootPerson: (name) => `Root person: ${name}`,
    peopleCount: (count) => `${count} ${count === 1 ? 'person' : 'people'}`,
    familyGroupsCount: (count) =>
      `${count} family ${count === 1 ? 'group' : 'groups'}`,
    openPdfExport: 'Open PDF Export',
  },
  search: {
    toggleSearch: 'Toggle search',
    title: 'Search People',
    dragToMove: 'Drag to move',
    resetPosition: 'Reset search panel position',
    reset: 'Reset',
    placeholder: 'At least 3 letters',
    previous: 'Prev',
    next: 'Next',
    typeAtLeastThreeLetters: 'Type at least 3 letters to search by name.',
    typeMoreLetters: (count) =>
      `Type ${count} more ${count === 1 ? 'letter' : 'letters'} to start searching.`,
    noMatches: 'No matching people found.',
    oneMatch: (name) => `1 match: ${name}`,
    multipleMatches: (count, currentIndex, name) =>
      `${count} matches, showing ${currentIndex} of ${count}: ${name}`,
  },
  upload: {
    chooseJsonFileError: 'Please choose a .json file.',
    fileCouldNotBeLoaded: 'The JSON file could not be loaded.',
    copyFailed: 'Could not copy the preview text to the clipboard.',
    validation: {
      uploadedTreeTitle: 'Uploaded Family Tree',
      lifeEventMustBeObject: (label) => `${label} must be an object.`,
      lifeEventValuesMustBeNullableStrings: (label) =>
        `${label} must use string-or-null values for date, dateText, and place.`,
      personMustBeObject: (index) => `people[${index}] must be an object.`,
      personIdMustBeNonEmpty: (index) =>
        `people[${index}].id must be a non-empty string.`,
      personDisplayNameMustBeNonEmpty: (index) =>
        `people[${index}].displayName must be a non-empty string.`,
      personSexMustBeValid: (index) =>
        `people[${index}].sex must be "female", "male", or "unknown".`,
      personNotesMustBeNullableString: (index) =>
        `people[${index}].notes must be a string or null.`,
      familyMustBeObject: (index) => `families[${index}] must be an object.`,
      familyIdMustBeNonEmpty: (index) =>
        `families[${index}].id must be a non-empty string.`,
      familyParentIdsMustBeValid: (index) =>
        `families[${index}].parentIds must be an array of non-empty strings.`,
      familyChildIdsMustBeValid: (index) =>
        `families[${index}].childIds must be an array of non-empty strings.`,
      duplicateId: (label, id) => `Duplicate ${label} id "${id}" was found.`,
      missingParentReference: (familyId, parentId) =>
        `Family "${familyId}" references missing parent "${parentId}".`,
      missingChildReference: (familyId, childId) =>
        `Family "${familyId}" references missing child "${childId}".`,
      treeMustContainPerson: 'The family tree must contain at least one person.',
      rootPersonNotFound: (rootPersonId) =>
        `The rootPersonId "${rootPersonId}" was not found in people.`,
      uploadedJsonMustIncludeTree: 'The uploaded JSON must include a tree object.',
      uploadedJsonMustIncludePeople:
        'The uploaded JSON must include a people array.',
      uploadedJsonMustIncludeFamilies:
        'The uploaded JSON must include a families array.',
      uploadedJsonMustIncludeTitle:
        'The uploaded JSON must include tree.title as a non-empty string.',
      uploadedJsonMustIncludeRootPersonId:
        'The uploaded JSON must include tree.rootPersonId as a non-empty string.',
      selectedFileMustBeValidJson: 'The selected file is not valid JSON.',
      uploadedJsonMustBeObject: 'The uploaded JSON must be an object.',
    },
    documentation: [
      {
        title: 'Top-Level Object',
        items: [
          {
            keyPath: 'version',
            type: 'string',
            required: false,
            acceptedValues: 'Any non-empty string, typically "1.0".',
            notes: 'If omitted, the app falls back to "1.0".',
          },
          {
            keyPath: 'tree',
            type: 'object',
            required: true,
            notes:
              'Defines metadata and the visual root person, and must include title and rootPersonId.',
          },
          {
            keyPath: 'people',
            type: 'array<object>',
            required: true,
            notes: 'Each item must be a full person object.',
          },
          {
            keyPath: 'families',
            type: 'array<object>',
            required: true,
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
            required: false,
            acceptedValues: 'Any non-empty string.',
            notes: 'If omitted, it is derived from the tree title.',
          },
          {
            keyPath: 'tree.title',
            type: 'string',
            required: true,
            acceptedValues: 'Any non-empty string.',
            notes: 'Used in the UI and as the exported PDF filename base.',
          },
          {
            keyPath: 'tree.rootPersonId',
            type: 'string',
            required: true,
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
            required: true,
            acceptedValues: 'Unique non-empty string.',
            notes: 'All person ids must be unique across the file.',
          },
          {
            keyPath: 'people[].displayName',
            type: 'string',
            required: true,
            acceptedValues: 'Any non-empty string.',
          },
          {
            keyPath: 'people[].sex',
            type: 'string',
            required: true,
            acceptedValues: '"female", "male", or "unknown".',
          },
          {
            keyPath: 'people[].birth',
            type: 'object',
            required: true,
            notes:
              'Must contain date, dateText, and place keys even when the values are null.',
          },
          {
            keyPath: 'people[].death',
            type: 'object',
            required: true,
            notes:
              'Must contain date, dateText, and place keys even when the values are null.',
          },
          {
            keyPath: 'people[].notes',
            type: 'string | null',
            required: true,
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
            required: true,
            acceptedValues: 'Exact dates should use dd.mm.yyyy.',
          },
          {
            keyPath: 'people[].birth.dateText / people[].death.dateText',
            type: 'string | null',
            required: true,
            acceptedValues: 'Free text such as "ca 1924".',
            notes: 'Use this when the exact date is not known.',
          },
          {
            keyPath: 'people[].birth.place / people[].death.place',
            type: 'string | null',
            required: true,
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
            required: true,
            acceptedValues: 'Unique non-empty string.',
          },
          {
            keyPath: 'families[].parentIds',
            type: 'array<string>',
            required: true,
            acceptedValues: 'Person ids that already exist in people[].',
            notes: 'Every referenced id must match an existing person.',
          },
          {
            keyPath: 'families[].childIds',
            type: 'array<string>',
            required: true,
            acceptedValues: 'Person ids that already exist in people[].',
            notes: 'Every referenced id must match an existing person.',
          },
        ],
      },
    ],
  },
  pdf: {
    title: 'PDF Export',
    intro:
      'Preview your family tree as printable A4 sheets. Download the PDF, print the pages, and align them edge to edge to create a wall-sized family tree.',
    layoutPreview: 'Graph Layout Preview',
    a4PagesCount: (count) => `${count} A4 landscape ${count === 1 ? 'page' : 'pages'}`,
    rowsCount: (count) => `${count} ${count === 1 ? 'row' : 'rows'}`,
    columnsCount: (count) => `${count} ${count === 1 ? 'column' : 'columns'}`,
    skipEmptyPages: 'Skip Empty Pages In PDF',
    backToGraph: 'Back To Graph',
    preparingWithProgress: (progressPercent) => `Preparing PDF (${progressPercent}%)...`,
    preparing: 'Preparing PDF...',
    download: 'Download PDF',
    exportFailed: 'PDF export failed. Please try again.',
    pageBadge: (page, row, column) => `p${page}, r${row}, c${column}`,
    errors: {
      failedToRenderPreviewPage: 'Failed to render preview page.',
      failedToCreatePageImage: 'Failed to create the PDF page image.',
      failedToPreparePageCanvas: 'Failed to prepare the PDF page canvas.',
      failedToCapturePreviewPage:
        'Failed to capture the preview page for PDF export.',
      noPreviewPages: 'No preview pages were available to export.',
      unknownExportFailure: 'Unknown export failure.',
      exportFailedOnPage: (pageNumber, message) =>
        `PDF export failed on page ${pageNumber}: ${message}`,
    },
  },
  personCard: {
    unknownDate: 'Unknown date',
    approximateAge: (age) => `ca ${age}`,
  },
};
