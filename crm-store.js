(() => {
  const STORAGE_KEY = 'jncos_crm_v1';
  const SESSION_KEY = 'jncos_crm_session_v1';
  const SCHEMA_VERSION = (window.CRM_CONFIG && window.CRM_CONFIG.schemaVersion) || 2;
  const listeners = new Set();

  const seed = () => ({
    schemaVersion: SCHEMA_VERSION,
    customers: [
      { id:'CUS-001', company:'ABC Cosmetics', country:'India', type:'OEM', contact:'Aarav Sharma', email:'aarav@abccosmetics.example', phone:'+91 98765 10001', owner:'Ravi Kim', status:'Active', paymentTerms:'50% advance / 50% before dispatch', notes:'Skincare development account', createdAt:'2026-09-05T09:30:00', updatedAt:'2026-09-05T09:30:00' },
      { id:'CUS-002', company:'XYZ Beauty', country:'UAE', type:'ODM', contact:'Lina Hassan', email:'lina@xyzbeauty.example', phone:'+971 50 555 0111', owner:'Jisoo Park', status:'Active', paymentTerms:'30 days', notes:'Premium beauty line', createdAt:'2026-09-08T10:00:00', updatedAt:'2026-09-08T10:00:00' },
      { id:'CUS-003', company:'Glow Skincare', country:'United Kingdom', type:'Private Label', contact:'Emma Wilson', email:'emma@glowskincare.example', phone:'+44 7700 900001', owner:'Minho Lee', status:'Prospect', paymentTerms:'TBD', notes:'Sun care enquiry', createdAt:'2026-09-12T13:15:00', updatedAt:'2026-09-12T13:15:00' }
    ],
    leads: [
      { id:'LED-001', company:'Beauty Global', contact:'Sarah Lee', email:'sarah@beautyglobal.example', phone:'+1 415 555 0199', country:'USA', type:'OEM', source:'Website', owner:'Ravi Kim', status:'New', nextAction:'Intro call', nextActionDate:'2026-09-29', details:'Looking for serum OEM partner.', createdAt:'2026-09-29T08:30:00', updatedAt:'2026-09-29T08:30:00' },
      { id:'LED-002', company:'Pure Life', contact:'Michael Chen', email:'michael@purelife.example', phone:'+1 604 555 0108', country:'Canada', type:'Private Label', source:'Exhibition', owner:'Jisoo Park', status:'Contacted', nextAction:'Send company profile', nextActionDate:'2026-09-30', details:'Private label moisturizer.', createdAt:'2026-09-28T15:10:00', updatedAt:'2026-09-28T15:10:00' },
      { id:'LED-003', company:'Nature Care', contact:'Emma Wilson', email:'emma@naturecare.example', phone:'+44 7700 900155', country:'UK', type:'ODM', source:'Email', owner:'Minho Lee', status:'Qualified', nextAction:'Prepare product brief', nextActionDate:'2026-10-01', details:'Cleansing oil ODM development.', createdAt:'2026-09-27T11:45:00', updatedAt:'2026-09-27T11:45:00' }
    ],
    projects: [
      { id:'PRJ-021', customerId:'CUS-001', name:'Hyaluronic Acid Serum', category:'Serum', salesOwner:'Ravi Kim', rdOwner:'Maya Patel', targetDate:'2026-10-15', moq:'5000', targetPrice:'₹350', status:'Sample Sent', brief:'Hydrating serum for sensitive skin', formulaStatus:'Pending Feedback', packagingStatus:'Sample Approved', artworkStatus:'Draft', approvalStatus:'Sample Feedback', updatedAt:'2026-09-29T06:00:00' },
      { id:'PRJ-019', customerId:'CUS-002', name:'Vitamin C Cream', category:'Cream', salesOwner:'Jisoo Park', rdOwner:'Arjun Rao', targetDate:'2026-10-20', moq:'3000', targetPrice:'₹420', status:'Revision', brief:'Brightening cream with premium texture', formulaStatus:'Approved', packagingStatus:'Approved', artworkStatus:'V2 Review', approvalStatus:'Artwork Approval', updatedAt:'2026-09-28T12:00:00' },
      { id:'PRJ-018', customerId:'CUS-003', name:'Sun Care Lotion', category:'Sun Care', salesOwner:'Minho Lee', rdOwner:'Maya Patel', targetDate:'2026-10-28', moq:'5000', targetPrice:'TBD', status:'Under Development', brief:'Daily lightweight sunscreen lotion', formulaStatus:'Development', packagingStatus:'Searching', artworkStatus:'Not Started', approvalStatus:'In Development', updatedAt:'2026-09-27T17:00:00' }
    ],
    samples: [
      { id:'SMP-021-V1', projectId:'PRJ-021', version:'V1', rdOwner:'Maya Patel', createdDate:'2026-09-12', quantity:'5', status:'Revision', dispatchDate:'2026-09-13', courier:'DHL', tracking:'DHL-00192', feedbackDate:'2026-09-18', feedback:'Increase hydration, reduce tackiness.', updatedAt:'2026-09-18T10:00:00' },
      { id:'SMP-021-V2', projectId:'PRJ-021', version:'V2', rdOwner:'Maya Patel', createdDate:'2026-09-22', quantity:'5', status:'Feedback Waiting', dispatchDate:'2026-09-23', courier:'DHL', tracking:'DHL-00231', feedbackDate:'2026-09-30', feedback:'', updatedAt:'2026-09-23T10:00:00' },
      { id:'SMP-019-V2', projectId:'PRJ-019', version:'V2', rdOwner:'Arjun Rao', createdDate:'2026-09-20', quantity:'4', status:'Approved', dispatchDate:'2026-09-21', courier:'FedEx', tracking:'FDX-23911', feedbackDate:'2026-09-25', feedback:'Formula approved.', updatedAt:'2026-09-25T10:00:00' }
    ],
    quotations: [
      { id:'QT-015', projectId:'PRJ-021', version:'V2', moq:'5000', unitPrice:'₹350', paymentTerms:'50/50', validUntil:'2026-10-10', status:'Sent', notes:'Includes standard packaging.', updatedAt:'2026-09-28T09:00:00' },
      { id:'QT-013', projectId:'PRJ-019', version:'V1', moq:'3000', unitPrice:'₹420', paymentTerms:'50/50', validUntil:'2026-10-05', status:'Revision', notes:'Artwork tooling excluded.', updatedAt:'2026-09-27T09:00:00' }
    ],
    orders: [
      { id:'ORD-102', customerId:'CUS-001', projectId:'PRJ-021', po:'ABC-PO-392', quantity:'10000', orderDate:'2026-09-20', committedDate:'2026-10-22', paymentStatus:'Partial', total:'₹3,500,000', advance:'₹1,750,000', balance:'₹1,750,000', paymentDue:'2026-10-20', readiness:'Not Ready', productionStatus:'Materials Ready', qcStatus:'Waiting', dispatchStatus:'Ready', updatedAt:'2026-09-29T06:30:00' },
      { id:'ORD-099', customerId:'CUS-002', projectId:'PRJ-019', po:'XYZ-PO-118', quantity:'5000', orderDate:'2026-09-15', committedDate:'2026-10-18', paymentStatus:'Paid', total:'₹2,100,000', advance:'₹1,050,000', balance:'₹0', paymentDue:'2026-09-25', readiness:'Ready', productionStatus:'Manufacturing', qcStatus:'Waiting', dispatchStatus:'Not Ready', updatedAt:'2026-09-28T12:00:00' }
    ],
    users: [
      { id:'USR-000', name:'JN COS Master', email:'admin@jncostech.com', department:'Management', role:'Admin', active:true },
      { id:'USR-001', name:'Ravi Kim', email:'ravi@jncostech.com', department:'Sales', role:'Sales', active:true },
      { id:'USR-002', name:'Maya Patel', email:'maya@jncostech.com', department:'R&D', role:'R&D', active:true },
      { id:'USR-003', name:'Jisoo Park', email:'jisoo@jncostech.com', department:'Sales', role:'Management', active:true }
    ],
    activities: [
      { id:'ACT-001', text:'Sample V2 dispatched', meta:'PRJ-021 / ABC Cosmetics', createdAt:'2026-09-29T06:00:00' },
      { id:'ACT-002', text:'Customer feedback recorded', meta:'PRJ-019 / XYZ Beauty', createdAt:'2026-09-28T14:20:00' },
      { id:'ACT-003', text:'Quotation QT-015 sent', meta:'ABC Cosmetics', createdAt:'2026-09-28T09:00:00' }
    ],
    auditLogs: [],
    settings: {
      companyName:'JN COS TECH',
      defaultCurrency:'INR',
      dateFormat:'YYYY-MM-DD',
      idPrefixes:{ customer:'CUS', lead:'LED', project:'PRJ', sample:'SMP', quotation:'QT', order:'ORD' }
    }
  });

  const clone = value => JSON.parse(JSON.stringify(value));

  function now() {
    return new Date().toISOString();
  }

  function normalizeState(input) {
    const base = seed();
    const next = (input && typeof input === 'object') ? { ...input } : {};
    next.schemaVersion = SCHEMA_VERSION;

    ['customers','leads','projects','samples','quotations','orders','users','activities','auditLogs'].forEach(key => {
      if (!Array.isArray(next[key])) next[key] = clone(base[key]);
    });

    next.settings = {
      ...base.settings,
      ...(next.settings || {}),
      idPrefixes:{ ...base.settings.idPrefixes, ...((next.settings && next.settings.idPrefixes) || {}) }
    };

    if (!next.users.some(u => String(u.email || '').toLowerCase() === 'admin@jncostech.com')) {
      next.users.unshift(clone(base.users[0]));
    }

    return next;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? normalizeState(JSON.parse(raw)) : seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    } catch (e) {
      const initial = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  let state = load();

  function emit() {
    const snapshot = clone(state);
    listeners.forEach(listener => {
      try { listener(snapshot); } catch (e) { console.error(e); }
    });
    window.dispatchEvent(new CustomEvent('jnc-crm-data-change', { detail:snapshot }));
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    emit();
  }

  function prefixFor(collection) {
    const configured = state.settings && state.settings.idPrefixes;
    return {
      customers:(configured && configured.customer) || 'CUS',
      leads:(configured && configured.lead) || 'LED',
      projects:(configured && configured.project) || 'PRJ',
      samples:(configured && configured.sample) || 'SMP',
      quotations:(configured && configured.quotation) || 'QT',
      orders:(configured && configured.order) || 'ORD',
      users:'USR',
      activities:'ACT',
      auditLogs:'AUD'
    }[collection] || 'REC';
  }

  function nextId(collection) {
    const prefix = prefixFor(collection);
    const nums = (state[collection] || []).map(item => {
      const match = String(item.id || '').match(/(\d+)(?!.*\d)/);
      return match ? Number(match[1]) : 0;
    });
    return `${prefix}-${String(Math.max(0, ...nums) + 1).padStart(3,'0')}`;
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function actor() {
    const session = getSession();
    return session ? { id:session.id || '', name:session.name || '', email:session.email || '', role:session.role || '' } : { id:'SYSTEM', name:'System', email:'', role:'System' };
  }

  function audit(action, collection, recordId, before, after) {
    const entry = {
      id:nextId('auditLogs'),
      action,
      collection,
      recordId,
      actor:actor(),
      before:before ? clone(before) : null,
      after:after ? clone(after) : null,
      createdAt:now()
    };
    state.auditLogs.unshift(entry);
    state.auditLogs = state.auditLogs.slice(0, 500);
  }

  function activity(text, meta='') {
    state.activities.unshift({
      id: nextId('activities'),
      text,
      meta,
      createdAt: now()
    });
    state.activities = state.activities.slice(0, 100);
  }

  function create(collection, data) {
    if (!Array.isArray(state[collection])) throw new Error('Unknown collection: ' + collection);
    const record = { ...data };
    if (!record.id) record.id = nextId(collection);
    const stamp = now();
    if (!record.createdAt && ['customers','leads','users'].includes(collection)) record.createdAt = stamp;
    record.updatedAt = stamp;

    if (collection === 'users') {
      const email = String(record.email || '').trim().toLowerCase();
      if (!email) throw new Error('User email is required.');
      if (state.users.some(u => String(u.email || '').toLowerCase() === email)) throw new Error('A user with this email already exists.');
      record.email = email;
      record.active = record.active !== false && record.active !== 'false' && record.active !== 'Inactive';
    }

    state[collection].unshift(record);
    if (!['activities','auditLogs'].includes(collection)) {
      audit('create', collection, record.id, null, record);
      activity(collection.slice(0,-1) + ' created', record.id);
    }
    save();
    return clone(record);
  }

  function update(collection, id, data) {
    if (!Array.isArray(state[collection])) throw new Error('Unknown collection: ' + collection);
    const index = state[collection].findIndex(item => item.id === id);
    if (index < 0) return null;

    const before = clone(state[collection][index]);
    const next = { ...state[collection][index], ...data, updatedAt:now() };

    if (collection === 'users') {
      next.email = String(next.email || '').trim().toLowerCase();
      next.active = next.active !== false && next.active !== 'false' && next.active !== 'Inactive';
      const duplicate = state.users.find(u => u.id !== id && String(u.email || '').toLowerCase() === next.email);
      if (duplicate) throw new Error('A user with this email already exists.');
    }

    state[collection][index] = next;
    if (!['activities','auditLogs'].includes(collection)) {
      audit('update', collection, id, before, next);
      activity(collection.slice(0,-1) + ' updated', id);
    }
    save();
    return clone(next);
  }

  function getDependencies(collection, id) {
    const deps = [];
    if (collection === 'customers') {
      const projects = state.projects.filter(p => p.customerId === id);
      const orders = state.orders.filter(o => o.customerId === id);
      if (projects.length) deps.push({collection:'projects',count:projects.length});
      if (orders.length) deps.push({collection:'orders',count:orders.length});
    }
    if (collection === 'projects') {
      const samples = state.samples.filter(s => s.projectId === id);
      const quotations = state.quotations.filter(q => q.projectId === id);
      const orders = state.orders.filter(o => o.projectId === id);
      if (samples.length) deps.push({collection:'samples',count:samples.length});
      if (quotations.length) deps.push({collection:'quotations',count:quotations.length});
      if (orders.length) deps.push({collection:'orders',count:orders.length});
    }
    if (collection === 'quotations') {
      const orders = state.orders.filter(o => o.quoteId === id);
      if (orders.length) deps.push({collection:'orders',count:orders.length});
    }
    return deps;
  }

  function remove(collection, id, options={}) {
    if (!Array.isArray(state[collection])) throw new Error('Unknown collection: ' + collection);
    const deps = getDependencies(collection, id);
    if (deps.length && !options.force) {
      return { ok:false, dependencies:clone(deps) };
    }

    const index = state[collection].findIndex(item => item.id === id);
    if (index < 0) return { ok:false, dependencies:[] };
    const before = clone(state[collection][index]);
    state[collection].splice(index, 1);
    if (!['activities','auditLogs'].includes(collection)) {
      audit('delete', collection, id, before, null);
      activity(collection.slice(0,-1) + ' deleted', id);
    }
    save();
    return { ok:true, dependencies:[] };
  }

  function list(collection) {
    return clone(state[collection] || []);
  }

  function get(collection, id) {
    const record = (state[collection] || []).find(item => item.id === id);
    return record ? clone(record) : null;
  }

  function reset() {
    state = seed();
    audit('reset', 'system', 'LOCAL-DEMO', null, {schemaVersion:SCHEMA_VERSION});
    save();
    return clone(state);
  }

  function search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const collections = ['customers','leads','projects','samples','quotations','orders'];
    const results = [];
    collections.forEach(collection => {
      (state[collection] || []).forEach(record => {
        const hay = JSON.stringify(record).toLowerCase();
        if (hay.includes(q)) results.push({ collection, record: clone(record) });
      });
    });
    return results;
  }

  function setSession(email) {
    const normalized = String(email || '').trim().toLowerCase();
    const existing = state.users.find(u => String(u.email || '').toLowerCase() === normalized);
    if (existing && existing.active === false) throw new Error('This user is inactive.');

    if (!existing) throw new Error('This account has not been created by the Master account.');
    const session = existing;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return clone(session);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function exportData() {
    return JSON.stringify({
      app:'JN COS TECH CRM',
      schemaVersion:SCHEMA_VERSION,
      exportedAt:now(),
      data:clone(state)
    }, null, 2);
  }

  function importData(payload) {
    let parsed = payload;
    if (typeof payload === 'string') parsed = JSON.parse(payload);
    const incoming = parsed && parsed.data ? parsed.data : parsed;
    if (!incoming || typeof incoming !== 'object') throw new Error('Invalid CRM backup.');
    ['customers','leads','projects','samples','quotations','orders','users'].forEach(key => {
      if (!Array.isArray(incoming[key])) throw new Error('Backup is missing ' + key + '.');
    });

    const before = { schemaVersion:state.schemaVersion };
    state = normalizeState(incoming);
    audit('import', 'system', 'DATA-IMPORT', before, {schemaVersion:state.schemaVersion});
    save();
    return clone(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function ready() {
    return Promise.resolve(clone(state));
  }

  window.CRMStore = {
    ready,
    list,
    get,
    create,
    update,
    remove,
    getDependencies,
    search,
    reset,
    exportData,
    importData,
    subscribe,
    getState: () => clone(state),
    setSession,
    getSession,
    logout,
    save
  };
})();