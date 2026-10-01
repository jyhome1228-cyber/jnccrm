(() => {
  const cfg = window.CRM_CONFIG.firebase;
  const collections = ['customers','leads','projects','formulas','samples','quotations','orders','calendarEvents','activities','auditLogs','users'];
  const state = {
    schemaVersion: window.CRM_CONFIG.schemaVersion || 2,
    customers:[], leads:[], projects:[], formulas:[], samples:[], quotations:[], orders:[], calendarEvents:[],
    activities:[], auditLogs:[], users:[],
    settings:{ companyName:'JN COS TECH', defaultCurrency:'INR', dateFormat:'YYYY-MM-DD' }
  };
  const listeners = new Set();
  let modules, app, auth, db, session = null, readyPromise = null;

  const clone = v => JSON.parse(JSON.stringify(v));
  const now = () => new Date().toISOString();

  function nextId(collection){
    const map={customers:'CUS',leads:'LED',projects:'PRJ',samples:'SMP',quotations:'QT',orders:'ORD',calendarEvents:'CAL',activities:'ACT',auditLogs:'AUD',users:'USR'};
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
    await modules.setPersistence(auth, modules.browserLocalPersistence);
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
    if(role==='Sales') return ['customers','leads','projects','samples','quotations','orders','calendarEvents','activities'];
    if(role==='R&D') return ['customers','leads','projects','formulas','samples','quotations','orders','calendarEvents','activities'];
    if(role==='Operations') return ['customers','projects','samples','quotations','orders','calendarEvents','activities'];
    if(role==='Finance') return ['customers','projects','quotations','orders','calendarEvents','activities'];
    return ['customers','projects','samples','calendarEvents','activities'];
  }

  async function loadAll(){
    for(const c of collections) state[c]=[];
    if(!session) return;
    for(const c of allowedCollections()){
      try{
        const snap=await modules.getDocs(modules.collection(db,c));
        state[c]=snap.docs.map(d => c === 'users' ? ({...d.data(),id:d.id,uid:d.id}) : ({id:d.id,...d.data()}));
      }catch(e){ console.warn('Load skipped',c,e.code||e.message); }
    }
    if (state.formulas.length) {
      const byProject = Object.fromEntries(state.formulas.map(f => [f.projectId || f.id, f]));
      state.projects = state.projects.map(p => {
        const f = byProject[p.id];
        return f ? {
          ...p,
          formulaVersion:f.version || '',
          formulaStatus:f.status || '',
          formulaOwner:f.rdOwner || '',
          formulaApprovalDate:f.approvalDate || '',
          formulaComments:f.comments || ''
        } : p;
      });
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
      await new Promise((resolve,reject)=>{
        let unsub = () => {};
        unsub=modules.onAuthStateChanged(auth,async user=>{
          try {
            unsub();
            if(user){
              await loadProfile(user);
              await loadAll();
            } else {
              session=null;
            }
            resolve();
          } catch (error) {
            try { await modules.signOut(auth); } catch (e) {}
            session=null;
            reject(error);
          }
        },error=>{
          session=null;
          reject(error);
        });
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

  async function create(c,data){
    const rec={...data};
    if(!rec.id) rec.id=nextId(c);
    rec.updatedAt=now();
    if(['customers','leads','users'].includes(c)&&!rec.createdAt) rec.createdAt=now();

    if (c === 'projects') {
      const formula = {
        projectId:rec.id,
        version:rec.formulaVersion || '',
        status:rec.formulaStatus || '',
        rdOwner:rec.formulaOwner || rec.rdOwner || '',
        approvalDate:rec.formulaApprovalDate || '',
        comments:rec.formulaComments || '',
        updatedAt:now()
      };
      ['formulaVersion','formulaStatus','formulaOwner','formulaApprovalDate','formulaComments'].forEach(k => delete rec[k]);
      await modules.setDoc(modules.doc(db,c,rec.id),rec);
      if (session && ['Admin','Management','R&D'].includes(session.role)) {
        await modules.setDoc(modules.doc(db,'formulas',rec.id),formula,{merge:true});
      }
      const merged={...rec,
        formulaVersion:formula.version,
        formulaStatus:formula.status,
        formulaOwner:formula.rdOwner,
        formulaApprovalDate:formula.approvalDate,
        formulaComments:formula.comments
      };
      state[c].unshift(merged);
      emit();
      audit('create',c,rec.id,null,rec);
      activity('project created',rec.id);
      return clone(merged);
    }

    await modules.setDoc(modules.doc(db,c,rec.id),rec);
    state[c].unshift(rec);
    emit();
    audit('create',c,rec.id,null,rec);
    activity(c.slice(0,-1)+' created',rec.id);
    return clone(rec);
  }

  async function update(c,id,data){
    const i=(state[c]||[]).findIndex(x=>x.id===id);
    if(i<0) throw new Error('Record not found: ' + id);

    if (c === 'projects') {
      const formulaKeys = ['formulaVersion','formulaStatus','formulaOwner','formulaApprovalDate','formulaComments'];
      const formulaPatch = {};
      const projectPatch = {...data};
      formulaKeys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(projectPatch,key)) {
          formulaPatch[key] = projectPatch[key];
          delete projectPatch[key];
        }
      });

      const before=clone(state[c][i]);
      const rec={...state[c][i],...data,updatedAt:now()};

      if (Object.keys(formulaPatch).length) {
        const f = {
          projectId:id,
          version:formulaPatch.formulaVersion || '',
          status:formulaPatch.formulaStatus || '',
          rdOwner:formulaPatch.formulaOwner || '',
          approvalDate:formulaPatch.formulaApprovalDate || '',
          comments:formulaPatch.formulaComments || '',
          updatedAt:now()
        };
        await modules.setDoc(modules.doc(db,'formulas',id),f,{merge:true});
        audit('update','formulas',id,null,f);
      }

      if (Object.keys(projectPatch).length) {
        const projectDoc={...projectPatch,updatedAt:rec.updatedAt};
        await modules.setDoc(modules.doc(db,c,id),projectDoc,{merge:true});
      }

      state[c][i]=rec;
      emit();
      audit('update',c,id,before,rec);
      activity('project updated',id);
      return clone(rec);
    }

    const before=clone(state[c][i]);
    const rec={...state[c][i],...data,updatedAt:now()};
    await modules.setDoc(modules.doc(db,c,id),rec,{merge:true});
    state[c][i]=rec;
    emit();
    audit('update',c,id,before,rec);
    activity(c.slice(0,-1)+' updated',id);
    return clone(rec);
  }

  function getDependencies(c,id){
    const deps=[];
    if(c==='customers'){const p=state.projects.filter(x=>x.customerId===id),o=state.orders.filter(x=>x.customerId===id);if(p.length)deps.push({collection:'projects',count:p.length});if(o.length)deps.push({collection:'orders',count:o.length});}
    if(c==='projects'){for(const [k,a] of [['samples',state.samples],['quotations',state.quotations],['orders',state.orders]]){const n=a.filter(x=>x.projectId===id).length;if(n)deps.push({collection:k,count:n});}}
    if(c==='quotations'){const n=state.orders.filter(x=>x.quoteId===id).length;if(n)deps.push({collection:'orders',count:n});}
    return deps;
  }

  async function remove(c,id){
    const deps=getDependencies(c,id);
    if(deps.length) return {ok:false,dependencies:deps};
    const i=(state[c]||[]).findIndex(x=>x.id===id);
    if(i<0) return {ok:false,dependencies:[]};
    const before=clone(state[c][i]);
    await modules.deleteDoc(modules.doc(db,c,id));
    state[c].splice(i,1);
    emit();
    audit('delete',c,id,before,null);
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