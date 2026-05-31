import type { Translations } from '../types';

export const et: Translations = {
  language: 'et',
  header: {
    brandName: 'Sugupuu visualiseerija',
    coffeeTime: 'Kohvipaus',
    settings: 'Seaded',
    languageSettings: 'Keele seaded',
    estonian: 'eesti keeles',
    english: 'in english',
  },
  common: {
    unknown: 'teadmata',
    copy: 'Kopeeri',
    copied: 'Kopeeritud',
    required: 'Kohustuslik',
    optional: 'Valikuline',
    type: 'Tüüp',
    accepted: 'Lubatud',
    notes: 'Märkused',
    dataSources: {
      example: 'näidisandmed',
      uploaded: 'üles laaditud JSON',
    },
  },
  landing: {
    title: 'Sugupuu visualiseerija',
    intro:
      'Avasta oma perekonna lugu selge ja interaktiivse sugupuu abil. Laadi üles oma andmed ning loo prinditav PDF, mis koondab põlvkonnad ühte vaatesse.',
    uploadTitle: 'Visualiseeri oma sugupuu',
    uploadIntro:
      'Kasuta näidisfaili juhisena, et koostada oma sugupuu JSON-fail. Kui fail on valmis, vali see altpoolt, et uurida oma perekonda interaktiivsel graafikul ja luua prinditav PDF.',
    chooseJsonFile: 'Vali JSON-fail',
    useExampleData: 'Kasuta näidisandmeid',
    currentTree: (title, fileName) =>
      `Praegune sugupuu: ${title}${fileName ? ` (${fileName})` : ''}`,
    privacyNotice:
      'Sinu fail jääb privaatseks: seda loetakse kohapeal ja säilitatakse ainult selle brauseriseansi jooksul. Faili ei laadita serverisse.',
    exampleFilePreview: 'Näidisfaili eelvaade',
    uploadFormatDocumentation: 'Üleslaadimisvormingu dokumentatsioon',
    interactiveGraph: 'Interaktiivne graafik',
    showingSource: (sourceLabel) => `Kuvatakse: ${sourceLabel}`,
    rootPerson: (name) => `Juurisik: ${name}`,
    peopleCount: (count) => `${count} ${count === 1 ? 'isik' : 'isikut'}`,
    familyGroupsCount: (count) =>
      `${count} ${count === 1 ? 'peregrupp' : 'peregruppi'}`,
    openPdfExport: 'Ava PDF-eksport',
  },
  search: {
    toggleSearch: 'Lülita otsing sisse või välja',
    title: 'Otsi inimesi',
    dragToMove: 'Lohista liigutamiseks',
    resetPosition: 'Taasta otsingupaneeli asukoht',
    reset: 'Taasta',
    placeholder: 'Vähemalt 3 tähte',
    previous: 'Eelmine',
    next: 'Järgmine',
    typeAtLeastThreeLetters: 'Nime järgi otsimiseks sisesta vähemalt 3 tähte.',
    typeMoreLetters: (count) =>
      `Otsingu alustamiseks sisesta veel ${count} ${count === 1 ? 'täht' : 'tähte'}.`,
    noMatches: 'Sobivaid inimesi ei leitud.',
    oneMatch: (name) => `1 vaste: ${name}`,
    multipleMatches: (count, currentIndex, name) =>
      `${count} vastet, kuvatakse ${currentIndex}/${count}: ${name}`,
  },
  upload: {
    chooseJsonFileError: 'Palun vali .json-fail.',
    fileCouldNotBeLoaded: 'JSON-faili ei õnnestunud laadida.',
    copyFailed: 'Eelvaate teksti ei õnnestunud lõikelauale kopeerida.',
    validation: {
      uploadedTreeTitle: 'Üles laaditud sugupuu',
      lifeEventMustBeObject: (label) => `${label} peab olema objekt.`,
      lifeEventValuesMustBeNullableStrings: (label) =>
        `${label} väljad date, dateText ja place peavad olema tekst või null.`,
      personMustBeObject: (index) => `people[${index}] peab olema objekt.`,
      personIdMustBeNonEmpty: (index) =>
        `people[${index}].id peab olema mittetühi tekst.`,
      personDisplayNameMustBeNonEmpty: (index) =>
        `people[${index}].displayName peab olema mittetühi tekst.`,
      personSexMustBeValid: (index) =>
        `people[${index}].sex peab olema "female", "male" või "unknown".`,
      personNotesMustBeNullableString: (index) =>
        `people[${index}].notes peab olema tekst või null.`,
      familyMustBeObject: (index) => `families[${index}] peab olema objekt.`,
      familyIdMustBeNonEmpty: (index) =>
        `families[${index}].id peab olema mittetühi tekst.`,
      familyParentIdsMustBeValid: (index) =>
        `families[${index}].parentIds peab olema mittetühjade tekstide massiiv.`,
      familyChildIdsMustBeValid: (index) =>
        `families[${index}].childIds peab olema mittetühjade tekstide massiiv.`,
      duplicateId: (label, id) =>
        `Leiti korduv ${label === 'person' ? 'isiku' : 'pere'} id "${id}".`,
      missingParentReference: (familyId, parentId) =>
        `Pere "${familyId}" viitab puuduvale vanemale "${parentId}".`,
      missingChildReference: (familyId, childId) =>
        `Pere "${familyId}" viitab puuduvale lapsele "${childId}".`,
      treeMustContainPerson: 'Sugupuu peab sisaldama vähemalt ühte isikut.',
      rootPersonNotFound: (rootPersonId) =>
        `Välja rootPersonId väärtust "${rootPersonId}" ei leitud people massiivist.`,
      uploadedJsonMustIncludeTree: 'Üles laaditud JSON peab sisaldama tree objekti.',
      uploadedJsonMustIncludePeople:
        'Üles laaditud JSON peab sisaldama people massiivi.',
      uploadedJsonMustIncludeFamilies:
        'Üles laaditud JSON peab sisaldama families massiivi.',
      uploadedJsonMustIncludeTitle:
        'Üles laaditud JSON peab sisaldama mittetühja tree.title väärtust.',
      uploadedJsonMustIncludeRootPersonId:
        'Üles laaditud JSON peab sisaldama mittetühja tree.rootPersonId väärtust.',
      selectedFileMustBeValidJson: 'Valitud fail ei ole korrektne JSON.',
      uploadedJsonMustBeObject: 'Üles laaditud JSON peab olema objekt.',
    },
    documentation: [
      {
        title: 'Põhiobjekt',
        items: [
          {
            keyPath: 'version',
            type: 'tekst',
            required: false,
            acceptedValues: 'Mistahes mittetühi tekst, tavaliselt "1.0".',
            notes: 'Kui väli puudub, kasutatakse väärtust "1.0".',
          },
          {
            keyPath: 'tree',
            type: 'objekt',
            required: true,
            notes:
              'Määrab metaandmed ja visuaalse juurisiku ning peab sisaldama välju title ja rootPersonId.',
          },
          {
            keyPath: 'people',
            type: 'objektide massiiv',
            required: true,
            notes: 'Iga element peab olema täielik isiku objekt.',
          },
          {
            keyPath: 'families',
            type: 'objektide massiiv',
            required: true,
            notes: 'Iga element peab olema täielik peresuhte objekt.',
          },
        ],
      },
      {
        title: 'tree objekt',
        items: [
          {
            keyPath: 'tree.id',
            type: 'tekst',
            required: false,
            acceptedValues: 'Mistahes mittetühi tekst.',
            notes: 'Kui väli puudub, tuletatakse see sugupuu pealkirjast.',
          },
          {
            keyPath: 'tree.title',
            type: 'tekst',
            required: true,
            acceptedValues: 'Mistahes mittetühi tekst.',
            notes: 'Kasutatakse kasutajaliideses ja eksporditud PDF-i failinime alusena.',
          },
          {
            keyPath: 'tree.rootPersonId',
            type: 'tekst',
            required: true,
            acceptedValues: 'Peab vastama people[] massiivis olevale isiku id-le.',
            notes: 'Määrab visuaalse juurisiku ja peab viitama olemasolevale isikule.',
          },
        ],
      },
      {
        title: 'Isiku objekt',
        items: [
          {
            keyPath: 'people[].id',
            type: 'tekst',
            required: true,
            acceptedValues: 'Unikaalne mittetühi tekst.',
            notes: 'Kõik isikute id-d peavad failis olema unikaalsed.',
          },
          {
            keyPath: 'people[].displayName',
            type: 'tekst',
            required: true,
            acceptedValues: 'Mistahes mittetühi tekst.',
          },
          {
            keyPath: 'people[].sex',
            type: 'tekst',
            required: true,
            acceptedValues: '"female", "male" või "unknown".',
          },
          {
            keyPath: 'people[].birth',
            type: 'objekt',
            required: true,
            notes:
              'Peab sisaldama välju date, dateText ja place ka siis, kui väärtused on null.',
          },
          {
            keyPath: 'people[].death',
            type: 'objekt',
            required: true,
            notes:
              'Peab sisaldama välju date, dateText ja place ka siis, kui väärtused on null.',
          },
          {
            keyPath: 'people[].notes',
            type: 'tekst | null',
            required: true,
            notes: 'Kui märkused puuduvad, kasuta väärtust null.',
          },
        ],
      },
      {
        title: 'Sünni / surma sündmuse objekt',
        items: [
          {
            keyPath: 'people[].birth.date / people[].death.date',
            type: 'tekst | null',
            required: true,
            acceptedValues: 'Täpsed kuupäevad peaksid kasutama vormingut pp.kk.aaaa.',
          },
          {
            keyPath: 'people[].birth.dateText / people[].death.dateText',
            type: 'tekst | null',
            required: true,
            acceptedValues: 'Vabatekst, näiteks "ca 1924".',
            notes: 'Kasuta seda välja, kui täpne kuupäev ei ole teada.',
          },
          {
            keyPath: 'people[].birth.place / people[].death.place',
            type: 'tekst | null',
            required: true,
            acceptedValues: 'Mistahes kohanimi või null.',
          },
        ],
      },
      {
        title: 'Pere objekt',
        items: [
          {
            keyPath: 'families[].id',
            type: 'tekst',
            required: true,
            acceptedValues: 'Unikaalne mittetühi tekst.',
          },
          {
            keyPath: 'families[].parentIds',
            type: 'tekstide massiiv',
            required: true,
            acceptedValues: 'People[] massiivis olemasolevate isikute id-d.',
            notes: 'Iga viidatud id peab vastama olemasolevale isikule.',
          },
          {
            keyPath: 'families[].childIds',
            type: 'tekstide massiiv',
            required: true,
            acceptedValues: 'People[] massiivis olemasolevate isikute id-d.',
            notes: 'Iga viidatud id peab vastama olemasolevale isikule.',
          },
        ],
      },
    ],
  },
  pdf: {
    title: 'PDF-eksport',
    intro:
      'Vaata oma sugupuud prinditavate A4-lehtedena. Laadi PDF alla, prindi lehed välja ja paiguta need servapidi kokku, et luua seinale suur sugupuu.',
    layoutPreview: 'Graafiku paigutuse eelvaade',
    a4PagesCount: (count) => `${count} A4 rõhtpaigutusega ${count === 1 ? 'leht' : 'lehte'}`,
    rowsCount: (count) => `${count} ${count === 1 ? 'rida' : 'rida'}`,
    columnsCount: (count) => `${count} ${count === 1 ? 'veerg' : 'veergu'}`,
    skipEmptyPages: 'Jäta tühjad lehed PDF-ist välja',
    backToGraph: 'Tagasi graafikule',
    preparingWithProgress: (progressPercent) => `PDF-i ettevalmistamine (${progressPercent}%)...`,
    preparing: 'PDF-i ettevalmistamine...',
    download: 'Laadi PDF alla',
    exportFailed: 'PDF-i eksport ebaõnnestus. Palun proovi uuesti.',
    pageBadge: (page, row, column) => `l${page}, r${row}, v${column}`,
    errors: {
      failedToRenderPreviewPage: 'Eelvaate lehe renderdamine ebaõnnestus.',
      failedToCreatePageImage: 'PDF-i lehe kujutise loomine ebaõnnestus.',
      failedToPreparePageCanvas: 'PDF-i lehe lõuendi ettevalmistamine ebaõnnestus.',
      failedToCapturePreviewPage:
        'Eelvaate lehe jäädvustamine PDF-ekspordiks ebaõnnestus.',
      noPreviewPages: 'Eksportimiseks ei olnud ühtegi eelvaate lehte.',
      unknownExportFailure: 'Tundmatu ekspordiviga.',
      exportFailedOnPage: (pageNumber, message) =>
        `PDF-i eksport ebaõnnestus lehel ${pageNumber}: ${message}`,
    },
  },
  personCard: {
    unknownDate: 'Kuupäev teadmata',
    approximateAge: (age) => `ca ${age}`,
  },
};
