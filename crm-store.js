(() => {
  const STORAGE_KEY = 'jncos_crm_v1';
  const SESSION_KEY = 'jncos_crm_session_v1';

  const seed = () => ({
    customers: [
      { id:'CUS-001', company:'ABC Cosmetics', country:'India', type:'OEM', contact:'Aarav Sharma', email:'aarav@abccosmetics.example', phone:'+91 98765 10001', owner:'Ravi Kim', status:'Active', paymentTerms:'50% advance / 50% before dispatch', notes:'Skincare development account', createdAt:'2026-09-05T09:30:00' },
      { id:'CUS-002', company:'XYZ Beauty', country:'UAE', type:'ODM', contact:'Lina Hassan', email:'lina@xyzbeauty.example', phone:'+971 50 555 0111', owner:'Jisoo Park', status:'Active', paymentTerms:'30 days', notes:'Premium beauty line', createdAt:'2026-09-08T10:00:00' },
      { id:'CUS-003', company:'Glow Skincare', country:'United Kingdom', type:'Private Label', contact:'Emma Wilson', email:'emma@glowskincare.example', phone:'+44 7700 900001', owner:'Minho Lee', status:'Prospect', paymentTerms:'TBD', notes:'Sun care enquiry', createdAt:'2026-09-12T13:15:00' }
    ],
    leads: [
      { id:'LED-001', company:'Beauty Global', contact:'Sarah Lee', email:'sarah@beautyglobal.example', phone:'+1 415 555 0199', country:'USA', type:'OEM', source:'Website', owner:'Ravi Kim', status:'New', nextAction:'Intro call', nextActionDate:'2026-09-29', details:'Looking for serum OEM partner.', createdAt:'2026-09-29T08:30:00' },
      { id:'LED-002', company:'Pure Life', contact:'Michael Chen', email:'michael@purelife.example', phone:'+1 604 555 0108', country:'Canada', type:'Private Label', source:'Exhibition', owner:'Jisoo Park', status:'Contacted', nextAction:'Send company profile', nextActionDate:'2026-09-30', details:'Private label moisturizer.', createdAt:'2026-09-28T15:10:00' },
      { id:'LED-003', company:'Nature Care', contact:'Emma Wilson', email:'emma@naturecare.example', phone:'+44 7700 900155', country:'UK', type:'ODM', source:'Email', owner:'Minho Lee', status:'Qualified', nextAction:'Prepare product brief', nextActionDate:'2026-10-01', details:'Cleansing oil ODM development.', createdAt:'2026-09-27T11:45:00' }
    ],
    projects: [
      { id:'PRJ-021', customerId:'CUS-001', name:'Hyaluronic Acid Serum', category:'Serum', salesOwner:'Ravi Kim', rdOwner:'Maya Patel', targetDate:'2026-10-15', moq:'5000', targetPrice:'₹350', status:'Sample Sent', brief:'Hydrating serum for sensitive skin', formulaStatus:'Pending Feedback', packagingStatus:'Sample Approved', artworkStatus:'Draft', approvalStatus:'Sample Feedback', updatedAt:'2026-09-29T06:00:00' },
      { id:'PRJ-019', customerId:'CUS-002', name:'Vitamin C Cream', category:'Cream', salesOwner:'Jisoo Park', rdOwner:'Arjun Rao', targetDate:'2026-10-20', moq:'3000', targetPrice:'₹420', status:'Revision', brief:'Brightening cream with premium texture', formulaStatus:'Approved', packagingStatus:'Approved', artworkStatus:'V2 Review', approvalStatus:'Artwork Approval', updatedAt:'2026-09-28T12:00:00' },
      { id:'PRJ-018', customerId:'CUS-003', name:'Sun Care Lotion', category:'Sun Care', salesOwner:'Minho Lee', rdOwner:'Maya Patel', targetDate:'2026-10-28', moq:'5000', targetPrice:'TBD', status:'Under Development', brief:'Daily lightweight sunscreen lotion', formulaStatus:'Development', packagingStatus:'Searching', artworkStatus:'Not Started', approvalStatus:'In Development', updatedAt:'2026-09-27T17:00:00' }
    ],
    samples: [
      { id:'SMP-021-V1', projectId:'PRJ-021', version:'V1', rdOwner:'Maya Patel', createdDate:'2026-09-12', quantity:'5', status:'Revision', dispatchDate:'2026-09-13', courier:'DHL', tracking:'DHL-00192', feedbackDate:'2026-09-18', feedback:'Increase hydration, reduce tackiness.' },
      { id:'SMP-021-V2', projectId:'PRJ-021', version:'V2', rdOwner:'Maya Patel', createdDate:'2026-09-22', quantity:'5', status:'Feedback Waiting', dispatchDate:'2026-09-23', courier:'DHL', tracking:'DHL-00231', feedbackDate:'2026-09-30', feedback:'' },
      { id:'SMP-019-V2', projectId:'PRJ-019', version:'V2', rdOwner:'Arjun Rao', createdDate:'2026-09-20', quantity:'4', status:'Approved', dispatchDate:'2026-09-21', courier:'FedEx', tracking:'FDX-23911', feedbackDate:'2026-09-25', feedback:'Formula approved.' }
    ],
    quotations: [
      { id:'QT-015', projectId:'PRJ-021', version:'V2', moq:'5000', unitPrice:'₹350', paymentTerms:'50/50', validUntil:'2026-10-10', status:'Sent', notes:'Includes standard packaging.' },
      { id:'QT-013', projectId:'PRJ-019', version:'V1', moq:'3000', unitPrice:'₹420', paymentTerms:'50/50', validUntil:'2026-10-05', status:'Revision', notes:'Artwork tooling excluded.' }
    ],
    orders: [
      { id:'ORD-102', customerId:'CUS-001', projectId:'PRJ-021', po:'ABC-PO-392', quantity:'10000', orderDate:'2026-09-20', committedDate:'2026-10-22', paymentStatus:'Partial', total:'₹3,500,000', advance:'₹1,750,000', balance:'₹1,750,000', paymentDue:'2026-10-20', readiness:'Not Ready', productionStatus:'Materials Ready', qcStatus:'Waiting', dispatchStatus:'Ready' },
      { id:'ORD-099', customerId:'CUS-002', projectId:'PRJ-019', po:'XYZ-PO-118', quantity:'5000', orderDate:'2026-09-15', committedDate:'2026-10-18', paymentStatus:'Paid', total:'₹2,100,000', advance:'₹1,050,000', balance:'₹0', paymentDue:'2026-09-25', readiness:'Ready', productionStatus:'Manufacturing', qcStatus:'Waiting', dispatchStatus:'Not Ready' }
    ],
    users: [
      { id:'USR-001', name:'Ravi Kim', email:'ravi@jncostech.com', department:'Sales', role:'Sales', active:true },
      { id:'USR-002', name:'Maya Patel', email:'maya@jncostech.com', department:'R&D', role:'R&D', active:true },
      { id:'USR-003', name:'Jisoo Park', email:'jisoo@jncostech.com', department:'Sales', role:'Management', active:true }
    ],
    activities: [
      { id:'ACT-001', text:'Sample V2 dispatched', meta:'PRJ-021 / ABC Cosmetics', createdAt:'2026-09-29T06:00:00' },
      { id:'ACT-002', text:'Customer feedback recorded', meta:'PRJ-019 / XYZ Beauty', createdAt:'2026-09-28T14:20:00' },
      { id:'ACT-003', text:'Quotation QT-015 sent', meta:'ABC Cosmetics', createdAt:'2026-09-28T09:00:00' }
    ],
    settings: {
      companyName:'JN COS TECH',
      defaultCurrency:'INR',
      dateFormat:'YYYY-MM-DD'
    }
  });

  const clone = value => JSON.parse(JSON.stringify(value));

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = seed();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(raw);
    } catch (e) {
      const initial = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  let state = load();

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function prefixFor(collection) {
    return {
      customers:'CUS',
      leads:'LED',
      projects:'PRJ',
      samples:'SMP',
      quotations:'QT',
      orders:'ORD',
      users:'USR',
      activities:'ACT'
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

  function activity(text, meta='') {
    state.activities.unshift({
      id: nextId('activities'),
      text,
      meta,
      createdAt: new Date().toISOString()
    });
    state.activities = state.activities.slice(0, 50);
  }

  function create(collection, data) {
    const record = { ...data };
    if (!record.id) record.id = nextId(collection);
    if (!record.createdAt && ['customers','leads'].includes(collection)) record.createdAt = new Date().toISOString();
    if (collection === 'projects') record.updatedAt = new Date().toISOString();
    state[collection].unshift(record);
    activity(`${collection.slice(0,-1)} created`, record.id);
    save();
    return clone(record);
  }

  function update(collection, id, data) {
    const index = state[collection].findIndex(item => item.id === id);
    if (index < 0) return null;
    state[collection][index] = { ...state[collection][index], ...data };
    if (collection === 'projects') state[collection][index].updatedAt = new Date().toISOString();
    activity(`${collection.slice(0,-1)} updated`, id);
    save();
    return clone(state[collection][index]);
  }

  function remove(collection, id) {
    const index = state[collection].findIndex(item => item.id === id);
    if (index < 0) return false;
    state[collection].splice(index, 1);
    activity(`${collection.slice(0,-1)} deleted`, id);
    save();
    return true;
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
    const existing = state.users.find(u => u.email.toLowerCase() === normalized);
    const fallbackName = normalized.split('@')[0].replace(/[._-]+/g,' ').replace(/\b\w/g, c => c.toUpperCase());
    const session = existing || {
      id:'USR-LOCAL',
      name:fallbackName || 'JN COS User',
      email:normalized,
      department:'General',
      role:'Staff',
      active:true
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return clone(session);
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  window.CRMStore = {
    list,
    get,
    create,
    update,
    remove,
    search,
    reset,
    getState: () => clone(state),
    setSession,
    getSession,
    logout,
    save
  };
})();