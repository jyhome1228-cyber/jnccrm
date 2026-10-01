(() => {
  const FIELD_LABELS = [
    'EXPORTED','DOCUMENT','INQUIRY','TYPE','STATUS','EMAIL','PHONE / WHATSAPP',
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

  const FIELD_SET = new Set(FIELD_LABELS);
  const SECTION_SET = new Set(SECTION_LABELS);
  const ALL_LABELS = [...FIELD_LABELS, ...SECTION_LABELS].sort((a,b) => b.length - a.length);
  const compact = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g,'');
  const FIELD_BY_COMPACT = new Map(FIELD_LABELS.map(label => [compact(label), label]));
  const SECTION_BY_COMPACT = new Map(SECTION_LABELS.map(label => [compact(label), label]));
  const LABEL_COMPACTS = [...FIELD_LABELS, ...SECTION_LABELS]
    .map(label => ({label,key:compact(label),field:FIELD_SET.has(label)}))
    .sort((a,b) => b.key.length - a.key.length);

  function normalizeSpace(value) {
    return String(value || '')
      .replace(/\u00a0/g,' ')
      .replace(/[ \t]+/g,' ')
      .replace(/\s*\n\s*/g,'\n')
      .trim();
  }

  function canonical(value) {
    return normalizeSpace(value).replace(/\n/g,' ').toUpperCase();
  }

  function segmentLabelsFromCompact(value, allowedMap) {
    const key = compact(value);
    if (!key) return [];
    const direct = allowedMap.get(key);
    if (direct) return [direct];

    const choices = [...allowedMap.entries()]
      .map(([part,label]) => ({part,label}))
      .sort((a,b) => b.part.length - a.part.length);
    const memo = new Map();

    function solve(offset) {
      if (offset === key.length) return [];
      if (memo.has(offset)) return memo.get(offset);
      for (const choice of choices) {
        if (!key.startsWith(choice.part, offset)) continue;
        const rest = solve(offset + choice.part.length);
        if (rest) {
          const result = [choice.label, ...rest];
          memo.set(offset, result);
          return result;
        }
      }
      memo.set(offset, null);
      return null;
    }

    return solve(0) || [];
  }

  function rowLabels(cells) {
    const joined = cells.join(' ');
    const sectionOnly = segmentLabelsFromCompact(joined, SECTION_BY_COMPACT);
    if (sectionOnly.length === 1) return {type:'section', labels:sectionOnly};

    // First try each visual cell independently.
    const perCell = [];
    let allCellsAreLabels = true;
    for (const cell of cells) {
      const labels = segmentLabelsFromCompact(cell, FIELD_BY_COMPACT);
      if (!labels.length) {
        allCellsAreLabels = false;
        break;
      }
      perCell.push(...labels);
    }
    if (allCellsAreLabels && perCell.length) return {type:'fields',labels:perCell};

    // PDF.js can fragment a label across several text items/cells. Greedily
    // combine adjacent fragments until they match a known field label.
    const labels = [];
    let index = 0;
    while (index < cells.length) {
      let matched = null;
      let matchedEnd = index;
      for (let end = Math.min(cells.length, index + 24); end > index; end--) {
        const candidate = cells.slice(index,end).join(' ');
        const segmented = segmentLabelsFromCompact(candidate, FIELD_BY_COMPACT);
        if (segmented.length === 1) {
          matched = segmented[0];
          matchedEnd = end;
          break;
        }
      }
      if (!matched) {
        labels.length = 0;
        break;
      }
      labels.push(matched);
      index = matchedEnd;
    }
    if (labels.length) return {type:'fields',labels};

    // Last structured-row fallback: one PDF text cell may contain a whole
    // label row such as TYPE STATUS EMAIL PHONE / WHATSAPP.
    const combined = segmentLabelsFromCompact(joined, FIELD_BY_COMPACT);
    return combined.length ? {type:'fields',labels:combined} : {type:'none',labels:[]};
  }

  function emptyToBlank(value) {
    const v = normalizeSpace(value);
    return (!v || v === '—' || v === '-') ? '' : v;
  }

  function isNoiseCells(cells) {
    const joined = cells.join(' ');
    return /jncostech\.com\/admin/i.test(joined)
      || /Generated from Admin Dashboard/i.test(joined)
      || /JN COS TECH Request/i.test(joined)
      || /^\d+\/\d+$/.test(joined.trim());
  }

  function parseStructured(input) {
    const rows = String(input || '')
      .split(/\n+/)
      .map(line => line.split('\t').map(normalizeSpace).filter(Boolean))
      .filter(row => row.length && !isNoiseCells(row));

    const values = {};
    let i = 0;

    while (i < rows.length) {
      const row = rows[i];
      const detected = rowLabels(row);

      if (detected.type === 'section') {
        i += 1;
        continue;
      }
      if (detected.type !== 'fields' || !detected.labels.length) {
        i += 1;
        continue;
      }

      const labels = detected.labels;

      if (labels.length > 1) {
        let j = i + 1;
        while (j < rows.length && isNoiseCells(rows[j])) j += 1;
        if (j < rows.length) {
          const next = rows[j];
          const nextDetected = rowLabels(next);

          if (nextDetected.type === 'none') {
            // Normal case: next visual row has one value cell per label.
            if (next.length === labels.length) {
              labels.forEach((label,index) => {
                if (!values[label]) values[label] = emptyToBlank(next[index] || '');
              });
              i = j + 1;
              continue;
            }

            // If PDF.js fragmented value text into extra cells, distribute
            // sequentially while preserving the final cell for the final label.
            if (next.length > labels.length) {
              const remaining = [...next];
              labels.forEach((label,index) => {
                if (values[label]) return;
                const labelsLeft = labels.length - index;
                const take = index === labels.length - 1
                  ? remaining.length
                  : Math.max(1, remaining.length - (labelsLeft - 1));
                values[label] = emptyToBlank(remaining.splice(0,take).join(' '));
              });
              i = j + 1;
              continue;
            }

            // Fewer cells than labels: preserve what can be mapped by order.
            labels.forEach((label,index) => {
              if (!values[label] && next[index]) values[label] = emptyToBlank(next[index]);
            });
            i = j + 1;
            continue;
          }
        }
      } else {
        const label = labels[0];
        const collected = [];
        let j = i + 1;

        while (j < rows.length) {
          const next = rows[j];
          if (isNoiseCells(next)) {
            j += 1;
            continue;
          }

          const nextDetected = rowLabels(next);
          if (nextDetected.type === 'section' || nextDetected.type === 'fields') break;

          collected.push(next.join(' '));
          j += 1;
        }

        if (!values[label]) values[label] = emptyToBlank(collected.join('\n'));
        i = j;
        continue;
      }

      i += 1;
    }

    return values;
  }

  function stripNoise(value) {
    return normalizeSpace(value)
      .replace(/https?:\/\/jncostech\.com\/admin\/?\s*\d+\/\d+/gi,' ')
      .replace(/\b[12]\/2\b/g,' ')
      .replace(/\s{2,}/g,' ')
      .trim();
  }

  function compactTextWithMap(text) {
    const original = String(text || '');
    let normalized = '';
    const map = [];
    for (let i=0;i<original.length;i++) {
      const ch = original[i].toUpperCase();
      if (/[A-Z0-9]/.test(ch)) {
        normalized += ch;
        map.push(i);
      }
    }
    return {original,normalized,map};
  }

  function occurrences(text) {
    const source = compactTextWithMap(text);
    const candidates = [];

    for (const item of LABEL_COMPACTS) {
      let from = 0;
      while (from < source.normalized.length) {
        const index = source.normalized.indexOf(item.key, from);
        if (index < 0) break;
        const endIndex = index + item.key.length - 1;
        candidates.push({
          label:item.label,
          compactStart:index,
          compactEnd:index + item.key.length,
          index:source.map[index] ?? 0,
          end:(source.map[endIndex] ?? source.original.length - 1) + 1,
          length:item.key.length
        });
        from = index + Math.max(1,item.key.length);
      }
    }

    candidates.sort((a,b) => a.compactStart - b.compactStart || b.length - a.length);
    const accepted = [];
    for (const candidate of candidates) {
      const overlaps = accepted.some(existing =>
        candidate.compactStart < existing.compactEnd &&
        candidate.compactEnd > existing.compactStart
      );
      if (!overlaps) accepted.push(candidate);
    }
    return accepted.sort((a,b) => a.index - b.index);
  }

  function valueAfter(text, label, occurrenceIndex = 0) {
    const found = occurrences(text);
    const matches = found.filter(x => x.label === label);
    const current = matches[occurrenceIndex];
    if (!current) return '';

    const currentPosition = found.indexOf(current);
    const next = found.slice(currentPosition + 1).find(x => x.index >= current.end);
    const raw = String(text || '').slice(current.end, next ? next.index : String(text || '').length);
    return normalizeSpace(raw)
      .replace(/^[\s:·—-]+/,'')
      .replace(/[\s:·—-]+$/,'')
      .trim();
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
    const structured = parseStructured(input);
    const legacyText = stripNoise(input).replace(/\s+/g,' ').trim();
    const get = label => emptyToBlank(structured[label] || valueAfter(legacyText,label));

    const serviceType = get('SERVICE TYPE');
    const inquiryText = get('INQUIRY');
    const parsed = {
      exportedAt: get('EXPORTED'),
      sourceDocumentId: get('DOCUMENT'),
      sourceInquiryTitle: inquiryText.split(/\n/)[0] || inquiryText,
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

    const inputCompact = compact(input);
    const looksStandard = inputCompact.includes(compact('PROJECT REQUEST SUMMARY'))
      && inputCompact.includes(compact('COMPANY / BRAND'))
      && inputCompact.includes(compact('SERVICE TYPE'));

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