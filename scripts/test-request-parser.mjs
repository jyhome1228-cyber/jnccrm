import '../request-pdf-parser.js';

const sample = `
JN COS TECH
PROJECT REQUEST SUMMARY
EXPORTED
1 Oct 2026, 6:05 pm
DOCUMENT
87091740
INQUIRY
Bewley Advisory
87091740 · 30 Sept 2026, 9:18 pm
TYPE
Inquiry
STATUS
New
EMAIL
martin.bewley@example.com
PHONE / WHATSAPP
2079460101
CONTACT INFORMATION
COMPANY / BRAND
Bewley Advisory
CONTACT PERSON
Martin
POSITION
Operations Manager
COMPANY TYPE
Manufacturer / Industry Partner
EMAIL
martin.bewley@example.com
PHONE / WHATSAPP
2079460101
COUNTRY / REGION
United Kingdom
WEBSITE / SOCIAL
www.example-consulting.test
PREFERRED CONTACT METHOD
—
PREFERRED CONTACT TIME
Please contact me with more information.
PROJECT SCOPE
SERVICE TYPE
ODM — Develop a new product with JN COS TECH
PRODUCT CATEGORIES
Serum / Ampoule
PROJECT STAGE
Idea / Early concept
TARGET MARKETS
Please contact me with more information.
LAUNCH TIMING
Not decided yet
INITIAL QUANTITY
—
FORMULATION
SKIN / PRODUCT CONCERNS
Hydration
TEXTURES / FINISH
Lightweight / Watery
HERO INGREDIENTS / AVOID LIST
Follow-up on an earlier message
CLAIMS / POSITIONING
Vegan
FRAGRANCE
Open to recommendation
REFERENCE PRODUCTS
Hello,
I wrote to you a little while ago and wanted to check whether my message arrived.
Kind regards,
Martin Bewley
PACKAGING & MARKET REQUIREMENTS
PACKAGING SUPPORT
Need full packaging sourcing support
PRIMARY PACKAGING
Dropper / Ampoule
SECONDARY PACKAGING
Folding carton
DESIGN SUPPORT
Need design support
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
JN COS TECH Pvt. Ltd. · Generated from Admin Dashboard · 1 Oct 2026, 6:05 pm
`;

const parsed = globalThis.JNCRequestParser.parse(sample);
const expected = {
  sourceDocumentId:'87091740',
  company:'Bewley Advisory',
  contact:'Martin',
  position:'Operations Manager',
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
  marketRequirements:'EU',
  privacyConsent:'Yes'
};

for (const [key,value] of Object.entries(expected)) {
  if (parsed[key] !== value) {
    throw new Error(`Parser mismatch for ${key}: expected "${value}", got "${parsed[key]}"`);
  }
}

if (parsed.warnings.length) throw new Error('Expected no parser warnings: ' + parsed.warnings.join(', '));
console.log('Request PDF parser test passed.');
