(() => {
  const FIELD_LABELS = [
    'DOCUMENT','INQUIRY','TYPE','STATUS','EMAIL','PHONE / WHATSAPP',
    'COMPANY / BRAND','CONTACT PERSON','POSITION','COMPANY TYPE',
    'COUNTRY / REGION','WEBSITE / SOCIAL','PREFERRED CONTACT METHOD','PREFERRED CONTACT TIME',
    'SERVICE TYPE','PRODUCT CATEGORIES','PROJECT STAGE','TARGET MARKETS','LAUNCH TIMING','INITIAL QUANTITY',
    'SKIN / PRODUCT CONCERNS','TEXTURES / FINISH','HERO INGREDIENTS / AVOID LIST',
    'CLAIMS / POSITIONING','FRAGRANCE','REFERENCE PRODUCTS',
    'PACKAGING SUPPORT','PRIMARY PACKAGING','SECONDARY PACKAGING','DESIGN SUPPORT',
    'CERTIFICATIONS / MARKET REQUIREMENTS','KEY REQUIREMENTS','ADDITIONAL NOTES',
    'HOW THEY FOUND US','PRIVACY CONSENT'
  ];

  const SECTION_LABELS = [
    'PROJECT REQUEST SUMMARY','CONTACT INFORMATION','PROJECT SCOPE','FORMULATION',
    'PACKAGING & MARKET REQUIREMENTS','ADDITIONAL REQUIREMENTS'
  ];

  const ALL_LABELS = [...FIELD_LABELS, ...SECTION_LABELS]
    .sort((a,b) => b.length - a.length);

  function normalizeSpace(value) {
    return String(value || '')
      .replace(/\u00a0/g,' ')
      .replace(/[\t\r\n]+/g,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  function stripNoise(value) {
    return normalizeSpace(value)
      .replace(/https?:\/\/jncostech\.com\/admin\/?\s*\d+\/\d+/gi,' ')
      .replace(/JN COS TECH Pvt\. Ltd\.\s*·\s*Generated from Admin Dashboard\s*·[^]*?(?=(CLAIMS \/ POSITIONING|PACKAGING & MARKET REQUIREMENTS|ADDITIONAL REQUIREMENTS|$))/gi,' ')
      .replace(/\d{2}\.\s*\d{1,2}\.\s*\d{1,2}\.[^]{0,140}?JN COS TECH Request/gi,' ')
      .replace(/\b[12]\/2\b/g,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  function occurrences(text) {
    const upper = text.toUpperCase();
    const found = [];
    for (const label of ALL_LABELS) {
      let from = 0;
      const needle = label.toUpperCase();
      while (from < upper.length) {
        const index = upper.indexOf(needle, from);
        if (index < 0) break;
        found.push({ label, index, end:index + label.length });
        from = index + label.length;
      }
    }
    return found.sort((a,b) => a.index - b.index || b.label.length - a.label.length);
  }

  function valueAfter(text, label, occurrenceIndex = 0) {
    const found = occurrences(text);
    const matches = found.filter(x => x.label === label);
    const current = matches[occurrenceIndex];
    if (!current) return '';

    const next = found.find(x => x.index >= current.end && x.label !== label);
    const raw = text.slice(current.end, next ? next.index : text.length);
    return normalizeSpace(raw)
      .replace(/^[\s:·—-]+/,'')
      .replace(/[\s:·—-]+$/,'')
      .trim();
  }

  function emptyToBlank(value) {
    const v = normalizeSpace(value);
    return (!v || v === '—' || v === '-') ? '' : v;
  }

  function normalizeEnquiryType(serviceType) {
    const v = String(serviceType || '');
    if (/\bODM\b/i.test(v)) return 'ODM';
    if (/\bOEM\b/i.test(v)) return 'OEM';
    if (/private\s*label/i.test(v)) return 'Private Label';
    if (/export/i.test(v)) return 'Export';
    if (/distributor/i.test(v)) return 'Distributor';
    if (/dealer/i.test(v)) return 'Dealer';
    if (/retail/i.test(v)) return 'Retail';
    return 'Other';
  }

  function parse(input) {
    const text = stripNoise(input);
    const looksStandard = /PROJECT REQUEST SUMMARY/i.test(text)
      && /COMPANY \/ BRAND/i.test(text)
      && /SERVICE TYPE/i.test(text);

    const get = (label, occurrence = 0) => emptyToBlank(valueAfter(text,label,occurrence));

    const serviceType = get('SERVICE TYPE');
    const parsed = {
      sourceDocumentId: get('DOCUMENT'),
      sourceInquiryTitle: get('INQUIRY'),
      sourceRequestType: get('TYPE'),
      sourceRequestStatus: get('STATUS'),
      company: get('COMPANY / BRAND'),
      contact: get('CONTACT PERSON'),
      position: get('POSITION'),
      companyType: get('COMPANY TYPE'),
      email: get('EMAIL'),
      phone: get('PHONE / WHATSAPP'),
      country: get('COUNTRY / REGION'),
      website: get('WEBSITE / SOCIAL'),
      preferredContactMethod: get('PREFERRED CONTACT METHOD'),
      preferredContactTime: get('PREFERRED CONTACT TIME'),
      serviceType,
      type: normalizeEnquiryType(serviceType),
      productCategory: get('PRODUCT CATEGORIES'),
      projectStage: get('PROJECT STAGE'),
      targetMarkets: get('TARGET MARKETS'),
      launchTiming: get('LAUNCH TIMING'),
      initialQuantity: get('INITIAL QUANTITY'),
      concerns: get('SKIN / PRODUCT CONCERNS'),
      texture: get('TEXTURES / FINISH'),
      heroIngredientsAvoidList: get('HERO INGREDIENTS / AVOID LIST'),
      claims: get('CLAIMS / POSITIONING'),
      fragrance: get('FRAGRANCE'),
      referenceProducts: get('REFERENCE PRODUCTS'),
      packagingSupport: get('PACKAGING SUPPORT'),
      primaryPackaging: get('PRIMARY PACKAGING'),
      secondaryPackaging: get('SECONDARY PACKAGING'),
      designSupport: get('DESIGN SUPPORT'),
      marketRequirements: get('CERTIFICATIONS / MARKET REQUIREMENTS'),
      keyRequirements: get('KEY REQUIREMENTS'),
      additionalNotes: get('ADDITIONAL NOTES'),
      howFoundUs: get('HOW THEY FOUND US'),
      privacyConsent: get('PRIVACY CONSENT')
    };

    parsed.details = parsed.keyRequirements || parsed.additionalNotes || parsed.referenceProducts || '';
    parsed.source = 'Website Request PDF';
    parsed.status = 'New';
    parsed.warnings = [];

    if (!looksStandard) parsed.warnings.push('This PDF does not match the standard JN COS TECH request format.');
    if (!parsed.company) parsed.warnings.push('Company / Brand was not detected.');
    if (!parsed.contact) parsed.warnings.push('Contact Person was not detected.');
    if (!parsed.email) parsed.warnings.push('Email was not detected.');
    if (!parsed.serviceType) parsed.warnings.push('Service Type was not detected.');

    parsed.confidence = Math.max(0, 100 - parsed.warnings.length * 20);
    return parsed;
  }

  const api = { parse, normalizeEnquiryType, FIELD_LABELS:[...FIELD_LABELS] };
  globalThis.JNCRequestParser = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();