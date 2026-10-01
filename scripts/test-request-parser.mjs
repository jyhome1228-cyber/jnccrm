import '../request-pdf-parser.js';

const sample = `
PROJECT REQUEST SUMMARY
EXPORTED
1 Oct 2026, 6:05 pm
DOCUMENT
87091740
INQUIRY
Bewley Advisory
87091740 · 30 Sept 2026, 9:18 pm
TYPE\tSTATUS\tEMAIL\tPHONE / WHATSAPP
Inquiry\tNew\tmartin.bewley@example.com\t2079460101
CONTACT INFORMATION
COMPANY / BRAND\tCONTACT PERSON
Bewley Advisory\tMartin
POSITION\tCOMPANY TYPE
Operations Manager\tManufacturer / Industry Partner
EMAIL\tPHONE / WHATSAPP
martin.bewley@example.com\t2079460101
COUNTRY / REGION\tWEBSITE / SOCIAL
United Kingdom\twww.example-consulting.test
PREFERRED CONTACT METHOD\tPREFERRED CONTACT TIME
—\tPlease contact me with more information.
PROJECT SCOPE
SERVICE TYPE\tPRODUCT CATEGORIES
ODM — Develop a new product with JN COS TECH\tSerum / Ampoule
PROJECT STAGE\tTARGET MARKETS
Idea / Early concept\tPlease contact me with more information.
LAUNCH TIMING\tINITIAL QUANTITY
Not decided yet\t—
FORMULATION
SKIN / PRODUCT CONCERNS\tTEXTURES / FINISH
Hydration\tLightweight / Watery
HERO INGREDIENTS / AVOID LIST
Follow-up on an earlier message
CLAIMS / POSITIONING\tFRAGRANCE
Vegan\tOpen to recommendation
REFERENCE PRODUCTS
Hello,
I wrote to you a little while ago and wanted to check whether my message arrived. I am still interested and happy to provide any further details you need.
Kind regards,
Martin Bewley
PACKAGING & MARKET REQUIREMENTS
PACKAGING SUPPORT\tPRIMARY PACKAGING
Need full packaging sourcing support\tDropper / Ampoule
SECONDARY PACKAGING\tDESIGN SUPPORT
Folding carton\tNeed design support
CERTIFICATIONS / MARKET REQUIREMENTS
EU
ADDITIONAL REQUIREMENTS
KEY REQUIREMENTS
I would like to know more about your services.
ADDITIONAL NOTES
I would like to know more about your services.
HOW THEY FOUND US
—
PRIVACY CONSENT
Yes
`;

const parsed = globalThis.JNCRequestParser.parse(sample);
const expected = {
  exportedAt:'1 Oct 2026, 6:05 pm',
  sourceDocumentId:'87091740',
  company:'Bewley Advisory',
  contact:'Martin',
  position:'Operations Manager',
  companyType:'Manufacturer / Industry Partner',
  email:'martin.bewley@example.com',
  phone:'2079460101',
  country:'United Kingdom',
  website:'www.example-consulting.test',
  type:'ODM',
  productCategory:'Serum / Ampoule',
  projectStage:'Idea / Early concept',
  concerns:'Hydration',
  texture:'Lightweight / Watery',
  heroIngredientsAvoidList:'Follow-up on an earlier message',
  claims:'Vegan',
  fragrance:'Open to recommendation',
  packagingSupport:'Need full packaging sourcing support',
  primaryPackaging:'Dropper / Ampoule',
  secondaryPackaging:'Folding carton',
  designSupport:'Need design support',
  marketRequirements:'EU',
  privacyConsent:'Yes'
};

for (const [key,value] of Object.entries(expected)) {
  if (parsed[key] !== value) {
    throw new Error(`Parser mismatch for ${key}: expected "${value}", got "${parsed[key]}"`);
  }
}

if (!parsed.referenceProducts.includes('Martin Bewley')) {
  throw new Error('Multi-line reference products were not preserved.');
}
if (parsed.warnings.length) throw new Error('Expected no parser warnings: ' + parsed.warnings.join(', '));
console.log('Request PDF multi-column parser test passed.');


const fragmented = `
P R O J E C T   R E Q U E S T   S U M M A R Y
D O C U M E N T
87091740
C O M P A N Y / B R A N D\tC O N T A C T   P E R S O N
Bewley Advisory\tMartin
E M A I L\tP H O N E / W H A T S A P P
martin.bewley@example.com\t2079460101
C O U N T R Y / R E G I O N\tW E B S I T E / S O C I A L
United Kingdom\twww.example-consulting.test
S E R V I C E   T Y P E\tP R O D U C T   C A T E G O R I E S
ODM — Develop a new product with JN COS TECH\tSerum / Ampoule
P R O J E C T   S T A G E\tT A R G E T   M A R K E T S
Idea / Early concept\tEU
S K I N / P R O D U C T   C O N C E R N S\tT E X T U R E S / F I N I S H
Hydration\tLightweight / Watery
C L A I M S / P O S I T I O N I N G\tF R A G R A N C E
Vegan\tOpen to recommendation
P A C K A G I N G   S U P P O R T\tP R I M A R Y   P A C K A G I N G
Need full packaging sourcing support\tDropper / Ampoule
S E C O N D A R Y   P A C K A G I N G\tD E S I G N   S U P P O R T
Folding carton\tNeed design support
C E R T I F I C A T I O N S / M A R K E T   R E Q U I R E M E N T S
EU
`;

const fragmentedParsed = globalThis.JNCRequestParser.parse(fragmented);
for (const [key,value] of Object.entries({
  company:'Bewley Advisory',
  contact:'Martin',
  email:'martin.bewley@example.com',
  country:'United Kingdom',
  type:'ODM',
  productCategory:'Serum / Ampoule',
  projectStage:'Idea / Early concept',
  concerns:'Hydration',
  texture:'Lightweight / Watery',
  claims:'Vegan',
  fragrance:'Open to recommendation',
  packagingSupport:'Need full packaging sourcing support',
  primaryPackaging:'Dropper / Ampoule',
  secondaryPackaging:'Folding carton',
  designSupport:'Need design support',
  marketRequirements:'EU'
})) {
  if (fragmentedParsed[key] !== value) {
    throw new Error(`Fragmented-label mismatch for ${key}: expected "${value}", got "${fragmentedParsed[key]}"`);
  }
}
console.log('Request PDF fragmented-label parser test passed.');
