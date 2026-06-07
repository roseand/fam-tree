export type Language = 'et' | 'en';

export type FamilyTreeDataSourceLabel = 'example' | 'uploaded';

export type UploadFormatDocumentationItem = {
  keyPath: string;
  type: string;
  required: boolean;
  acceptedValues?: string;
  notes?: string;
};

export type UploadFormatDocumentationSection = {
  title: string;
  items: UploadFormatDocumentationItem[];
};

export type FamilyTreeValidationMessages = {
  uploadedTreeTitle: string;
  lifeEventMustBeObject: (label: string) => string;
  lifeEventValuesMustBeNullableStrings: (label: string) => string;
  personMustBeObject: (index: number) => string;
  personIdMustBeNonEmpty: (index: number) => string;
  personDisplayNameMustBeNonEmpty: (index: number) => string;
  personSexMustBeValid: (index: number) => string;
  personNotesMustBeNullableString: (index: number) => string;
  familyMustBeObject: (index: number) => string;
  familyIdMustBeNonEmpty: (index: number) => string;
  familyParentIdsMustBeValid: (index: number) => string;
  familyChildIdsMustBeValid: (index: number) => string;
  duplicateId: (label: 'person' | 'family', id: string) => string;
  missingParentReference: (familyId: string, parentId: string) => string;
  missingChildReference: (familyId: string, childId: string) => string;
  treeMustContainPerson: string;
  rootPersonNotFound: (rootPersonId: string) => string;
  uploadedJsonMustIncludeTree: string;
  uploadedJsonMustIncludePeople: string;
  uploadedJsonMustIncludeFamilies: string;
  uploadedJsonMustIncludeTitle: string;
  uploadedJsonMustIncludeRootPersonId: string;
  selectedFileMustBeValidJson: string;
  uploadedJsonMustBeObject: string;
};

export type PdfExportMessages = {
  failedToRenderPreviewPage: string;
  failedToCreatePageImage: string;
  failedToPreparePageCanvas: string;
  failedToCapturePreviewPage: string;
  noPreviewPages: string;
  unknownExportFailure: string;
  exportFailedOnPage: (pageNumber: number, message: string) => string;
};

export type Translations = {
  language: Language;
  header: {
    brandName: string;
    coffeeTime: string;
    settings: string;
    languageSettings: string;
    estonian: string;
    english: string;
  };
  common: {
    unknown: string;
    copy: string;
    copied: string;
    required: string;
    optional: string;
    type: string;
    accepted: string;
    notes: string;
    dataSources: Record<FamilyTreeDataSourceLabel, string>;
  };
  landing: {
    title: string;
    intro: string;
    uploadTitle: string;
    uploadIntro: string;
    chooseJsonFile: string;
    useExampleData: string;
    exampleTreesLabel: string;
    exampleTreeOption: (title: string) => string;
    privacyNotice: string;
    exampleFilePreview: string;
    uploadFormatDocumentation: string;
    interactiveGraph: string;
    showingSource: (sourceLabel: string, title: string) => string;
    rootPerson: (name: string) => string;
    peopleCount: (count: number) => string;
    familyGroupsCount: (count: number) => string;
    openPdfExport: string;
  };
  search: {
    toggleSearch: string;
    title: string;
    dragToMove: string;
    resetPosition: string;
    reset: string;
    placeholder: string;
    previous: string;
    next: string;
    typeAtLeastThreeLetters: string;
    typeMoreLetters: (count: number) => string;
    noMatches: string;
    oneMatch: (name: string) => string;
    multipleMatches: (count: number, currentIndex: number, name: string) => string;
  };
  upload: {
    chooseJsonFileError: string;
    fileCouldNotBeLoaded: string;
    copyFailed: string;
    validation: FamilyTreeValidationMessages;
    documentation: UploadFormatDocumentationSection[];
  };
  pdf: {
    title: string;
    intro: string;
    layoutPreview: string;
    a4PagesCount: (count: number) => string;
    rowsCount: (count: number) => string;
    columnsCount: (count: number) => string;
    skipEmptyPages: string;
    backToGraph: string;
    preparingWithProgress: (progressPercent: number) => string;
    preparing: string;
    download: string;
    exportFailed: string;
    pageBadge: (page: string, row: string, column: string) => string;
    errors: PdfExportMessages;
  };
  personCard: {
    unknownDate: string;
    approximateAge: (age: number) => string;
  };
};
