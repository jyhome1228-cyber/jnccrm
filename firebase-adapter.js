(() => {
  const cfg = window.CRM_CONFIG.firebase;
  const collections = ['customers','leads','projects','samples','quotations','orders','activities','auditLogs','users'];
  const state = {
    schemaVersion: window.CRM_CONFIG.schemaVersion || 2,
    customers:[], leads:[], projects:[], samples:[], quotations:[], orders:[],
    activities:[], auditLogs:[], users:[],
    settings:{ companyName:'JN COS TECH', defaultCurrency:'INR', dateFormat:'YYYY-MM-DD' }
  };
  const listeners = new Set();
  let modules, app, auth, db, session = null, readyPromise = null;

  const clone = v => JSON.parse(JSON.stringify(v));
  const now = () => new Date().toISOString();

  function nextId(collection){
    const map={customers:'CUS',leads:'LED',projects:'PRJ',samples:'SMP',quotations:'QT',orders:'ORD',activities:'ACT',auditLogs:'AUD',users:'USR'};
    const nums=(state[collection]||[]).map(x=>{const m=String(x.id||'').match(/(\d+)(?!.*\d)/);return m?Number(m[1]):0;});
    return `${map[collection]||'REC'}-${String(Math.max(0,...nums)+1).padStart(3,'0')}`;
  }

  async function loadModules(){
    if(modules) return modules;
    const [appMod,authMod,fsMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')
    ]);
    modules={...appMod,...authMod,...fsMod};
    app=modules.initializeApp(cfg);
    auth=modules.getAuth(app);
    db=modules.getFirestore(app);
    return modules;
  }

  async function loadProfile(user){
    if(!user){ session=null; return null; }
    const ref=modules.doc(db,'users',user.uid);
    const snap=await modules.getDoc(ref);
    if(!snap.exists()){
      const err=new Error('Master profile is missing in Firestore. Create users/'+user.uid+' with role Admin and active true.');
      err.code='crm/profile-missing'; throw err;
    }
    const p=snap.data();
    if(p.active===false){ await modules.signOut(auth); throw new Error('This CRM account is inactive.'); }
    session={ id:p.crmUserId||user.uid, uid:user.uid, name:p.name||user.email, email:user.email, department:p.department||'General', role:p.role||'Staff', active:p.active!==false };
    return session;
  }

  function allowedCollections(){
    const role=session?.role||'Staff';
    if(role==='Admin'||role==='Management') return collections;
    if(role==='Sales') return ['customers','leads','projects','samples','quotations','orders','activities'];
    if(role==='R&D') return ['customers','leads','projects','samples','quotations','orders','activities'];
    if(role==='Operations') return ['customers','projects','samples','quotations','orders','activities'];
    if(role==='Finance') return ['customers','projects','quotations','orders','activities'];
    return ['customers','projects','samples','activities'];
  }

  async function loadAll(){
    for(const c of collections) state[c]=[];
    if(!session) return;
    for(const c of allowedCollections()){
      try{
        const snap=await modules.getDocs(modules.collection(db,c));
        state[c]=snap.docs.map(d=>({id:d.id,...d.data()}));
      }catch(e){ console.warn('Load skipped',c,e.code||e.message); }
    }
    if(session.role==='Admin'||session.role==='Management'){
      try{
        const s=await modules.getDoc(modules.doc(db,'settings','system'));
        if(s.exists()) state.settings={...state.settings,...s.data()};
      }catch(e){}
    }
    emit();
  }

  function emit(){ const snap=clone(state); listeners.forEach(fn=>{try{fn(snap)}catch(e){}}); }

  async function ready(){
    if(readyPromise) return readyPromise;
    readyPromise=(async()=>{
      await loadModules();
      await new Promise(resolve=>{
        const unsub=modules.onAuthStateChanged(auth,async user=>{
          unsub();
          if(user){ await loadProfile(user); await loadAll(); }
          resolve();
        },()=>resolve());
      });
      return clone(state);
    })();
    return readyPromise;
  }

  async function signIn(email,password){
    await loadModules();
    const cred=await modules.signInWithEmailAndPassword(auth,email,password);
    await loadProfile(cred.user);
    await loadAll();
    return clone(session);
  }

  async function sendPasswordReset(email){
    await loadModules();
    return modules.sendPasswordResetEmail(auth,email);
  }

  async function logout(){ await loadModules(); await modules.signOut(auth); session=null; }

  function list(c){ return clone(state[c]||[]); }
  function get(c,id){ const r=(state[c]||[]).find(x=>x.id===id); return r?clone(r):null; }
  function getState(){ return clone(state); }
  function getSession(){ return session?clone(session):null; }

  function audit(action,collection,recordId,before,after){
    if(!session) return;
    const id=nextId('auditLogs');
    const rec={id,action,collection,recordId,actor:{uid:session.uid,name:session.name,email:session.email,role:session.role},before:before||null,after:after||null,createdAt:now()};
    state.auditLogs.unshift(rec);
    modules.setDoc(modules.doc(db,'auditLogs',id),rec).catch(console.warn);
  }

  function activity(text,meta=''){
    if(!session) return;
    const id=nextId('activities');
    const rec={id,text,meta,createdAt:now()};
    state.activities.unshift(rec);
    modules.setDoc(modules.doc(db,'activities',id),rec).catch(console.warn);
  }

  function create(c,data){
    const rec={...data}; if(!rec.id) rec.id=nextId(c); rec.updatedAt=now(); if(['customers','leads','users'].includes(c)&&!rec.createdAt) rec.createdAt=now();
    state[c].unshift(rec); emit();
    modules.setDoc(modules.doc(db,c,rec.id),rec).then(()=>{audit('create',c,rec.id,null,rec);activity(c.slice(0,-1)+' created',rec.id)}).catch(e=>console.error(e));
    return clone(rec);
  }

  function update(c,id,data){
    const i=(state[c]||[]).findIndex(x=>x.id===id); if(i<0) return null;
    const before=clone(state[c][i]); const rec={...state[c][i],...data,updatedAt:now()}; state[c][i]=rec; emit();
    modules.setDoc(modules.doc(db,c,id),rec,{merge:true}).then(()=>{audit('update',c,id,before,rec);activity(c.slice(0,-1)+' updated',id)}).catch(console.error);
    return clone(rec);
  }

  function getDependencies(c,id){
    const deps=[];
    if(c==='customers'){const p=state.projects.filter(x=>x.customerId===id),o=state.orders.filter(x=>x.customerId===id);if(p.length)deps.push({collection:'projects',count:p.length});if(o.length)deps.push({collection:'orders',count:o.length});}
    if(c==='projects'){for(const [k,a] of [['samples',state.samples],['quotations',state.quotations],['orders',state.orders]]){const n=a.filter(x=>x.projectId===id).length;if(n)deps.push({collection:k,count:n});}}
    if(c==='quotations'){const n=state.orders.filter(x=>x.quoteId===id).length;if(n)deps.push({collection:'orders',count:n});}
    return deps;
  }

  function remove(c,id){
    const deps=getDependencies(c,id); if(deps.length) return {ok:false,dependencies:deps};
    const i=(state[c]||[]).findIndex(x=>x.id===id); if(i<0) return {ok:false,dependencies:[]};
    const before=clone(state[c][i]); state[c].splice(i,1); emit();
    modules.deleteDoc(modules.doc(db,c,id)).then(()=>audit('delete',c,id,before,null)).catch(console.error);
    return {ok:true,dependencies:[]};
  }

  function search(q){
    q=String(q||'').toLowerCase().trim(); if(!q) return [];
    const out=[]; for(const c of ['customers','leads','projects','samples','quotations','orders']) for(const r of state[c]||[]) if(JSON.stringify(r).toLowerCase().includes(q)) out.push({collection:c,record:clone(r)});
    return out;
  }

  async function createStaff(data,password){
    await loadModules();
    const secondary=modules.initializeApp(cfg,'staff-'+Date.now());
    const secondaryAuth=modules.getAuth(secondary);
    try{
      const cred=await modules.createUserWithEmailAndPassword(secondaryAuth,data.email,password);
      const rec={...data,id:data.id||nextId('users'),crmUserId:data.id||nextId('users'),active:data.active!==false,createdAt:now(),updatedAt:now()};
      await modules.setDoc(modules.doc(db,'users',cred.user.uid),rec);
      state.users.unshift({...rec,id:cred.user.uid,uid:cred.user.uid}); emit();
      audit('create','users',cred.user.uid,null,rec);
      return clone(rec);
    } finally {
      try{await modules.signOut(secondaryAuth)}catch(e){}
      try{await modules.deleteApp(secondary)}catch(e){}
    }
  }

  function exportData(){ return JSON.stringify({app:'JN COS TECH CRM',schemaVersion:state.schemaVersion,exportedAt:now(),data:clone(state)},null,2); }
  function importData(){ throw new Error('Import is disabled after Firebase activation. Use the migration script instead.'); }
  function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}

  window.FirebaseCRMAdapter={ready,signIn,sendPasswordReset,logout,list,get,create,update,remove,getDependencies,search,getState,getSession,createStaff,exportData,importData,subscribe};
})();