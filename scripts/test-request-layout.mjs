import '../request-pdf-layout.js';
import '../request-pdf-parser.js';

const items = [];
let index = 0;
function word(text,x,y){ items.push({text,x,y,index:index++}); }
function line(y, groups) {
  for (const group of groups) {
    let x = group.x;
    for (const token of group.tokens) {
      word(token,x,y);
      x += Math.max(12, token.length * 4.2 + 6);
    }
  }
}

line(42,[{x:45,tokens:['JN','COS','TECH']}]);
line(44.8,[{x:515,tokens:['EXPORTED']}]);
line(65,[{x:45,tokens:['PROJECT','REQUEST','SUMMARY']}]);
line(68.1,[{x:512,tokens:['DOCUMENT']}]);
line(76.9,[{x:524,tokens:['87091740']}]);
line(118,[{x:54,tokens:['COMPANY','/','BRAND']},{x:306,tokens:['CONTACT','PERSON']}]);
line(132,[{x:54,tokens:['QA','Advisory']},{x:306,tokens:['Martin']}]);
line(150,[{x:54,tokens:['POSITION']},{x:306,tokens:['COMPANY','TYPE']}]);
line(164,[{x:54,tokens:['Operations','Manager']},{x:306,tokens:['Manufacturer','/','Industry','Partner']}]);
line(182,[{x:54,tokens:['EMAIL']},{x:306,tokens:['PHONE','/','WHATSAPP']}]);
line(196,[{x:54,tokens:['qa@example.com']},{x:306,tokens:['2079460101']}]);
line(214,[{x:54,tokens:['COUNTRY','/','REGION']},{x:306,tokens:['WEBSITE','/','SOCIAL']}]);
line(228,[{x:54,tokens:['United','Kingdom']},{x:306,tokens:['www.example.test']}]);
line(260,[{x:45,tokens:['PROJECT','SCOPE']}]);
line(280,[{x:54,tokens:['SERVICE','TYPE']},{x:306,tokens:['PRODUCT','CATEGORIES']}]);
line(294,[{x:54,tokens:['ODM','—','Develop','a','new','product']},{x:306,tokens:['Serum','/','Ampoule']}]);
line(312,[{x:54,tokens:['PROJECT','STAGE']},{x:306,tokens:['TARGET','MARKETS']}]);
line(326,[{x:54,tokens:['Idea','/','Early','concept']},{x:306,tokens:['EU']}]);
line(350,[{x:45,tokens:['FORMULATION']}]);
line(370,[{x:54,tokens:['SKIN','/','PRODUCT','CONCERNS']},{x:306,tokens:['TEXTURES','/','FINISH']}]);
line(384,[{x:54,tokens:['Hydration']},{x:306,tokens:['Lightweight','/','Watery']}]);
line(420,[{x:54,tokens:['CLAIMS','/','POSITIONING']},{x:306,tokens:['FRAGRANCE']}]);
line(434,[{x:54,tokens:['Vegan']},{x:306,tokens:['Open','to','recommendation']}]);
line(470,[{x:45,tokens:['PACKAGING','&','MARKET','REQUIREMENTS']}]);
line(490,[{x:54,tokens:['PACKAGING','SUPPORT']},{x:306,tokens:['PRIMARY','PACKAGING']}]);
line(504,[{x:54,tokens:['Need','full','packaging','sourcing','support']},{x:306,tokens:['Dropper','/','Ampoule']}]);
line(522,[{x:54,tokens:['SECONDARY','PACKAGING']},{x:306,tokens:['DESIGN','SUPPORT']}]);
line(536,[{x:54,tokens:['Folding','carton']},{x:306,tokens:['Need','design','support']}]);
line(554,[{x:54,tokens:['CERTIFICATIONS','/','MARKET','REQUIREMENTS']}]);
line(568,[{x:54,tokens:['EU']}]);

const grouped = globalThis.JNCRequestPdfLayout.groupTextItems(items,{rowTolerance:2.2,columnGap:80});

const requiredRows = [
  'DOCUMENT',
  '87091740',
  'COMPANY / BRAND\tCONTACT PERSON',
  'QA Advisory\tMartin',
  'POSITION\tCOMPANY TYPE',
  'Operations Manager\tManufacturer / Industry Partner',
  'SERVICE TYPE\tPRODUCT CATEGORIES',
  'ODM — Develop a new product\tSerum / Ampoule',
  'PACKAGING SUPPORT\tPRIMARY PACKAGING',
  'Need full packaging sourcing support\tDropper / Ampoule'
];
for (const row of requiredRows) {
  if (!grouped.text.includes(row)) {
    throw new Error('Column grouping failed for row: ' + row + '\n\n' + grouped.text);
  }
}

const parsed = globalThis.JNCRequestParser.parse(grouped.text);
const expected = {
  sourceDocumentId:'87091740',
  company:'QA Advisory',
  contact:'Martin',
  position:'Operations Manager',
  companyType:'Manufacturer / Industry Partner',
  email:'qa@example.com',
  phone:'2079460101',
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
};

for (const [key,value] of Object.entries(expected)) {
  if (parsed[key] !== value) {
    throw new Error(`Layout/parser mismatch for ${key}: expected "${value}", got "${parsed[key]}"\n\n${grouped.text}`);
  }
}

console.log('Request PDF fixed-column layout test passed.');
