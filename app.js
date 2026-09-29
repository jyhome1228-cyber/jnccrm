(async () => {
  await CRMData.ready();
  const session = CRMData.getSession();
  if (!session) {
    location.replace('./login.html');
    return;
  }

  const pageRoot = document.getElementById('pageRoot');
  const sidebar = document.getElementById('sidebar');
  const menuButton = document.getElementById('menuButton');
  const navItems = Array.from(document.querySelectorAll('.nav-item'));
  const searchInput = document.getElementById('globalSearch');
  const modal = document.getElementById('appModal');
  const modalContent = document.getElementById('modalContent');
  const closeModalButton = document.getElementById('closeModal');
  const toastEl = document.getElementById('toast');
  let charts = [];

  document.getElementById('sessionName').textContent = session.name || 'JN COS User';
  document.getElementById('sessionRole').textContent = session.role === 'Admin' ? 'Master Account' : ((session.department || 'General') + ' · ' + (session.role || 'Staff'));
  document.getElementById('sessionAvatar').textContent = initials(session.name || 'JN COS');

  const actionPermissions = {
    'new-customer':['customers','create'], 'edit-customer':['customers','edit'], 'delete-customer':['customers','delete'],
    'new-lead':['leads','create'], 'edit-lead':['leads','edit'], 'delete-lead':['leads','delete'], 'lead-to-project':['projects','create'],
    'new-project':['projects','create'], 'edit-project':['projects','edit'], 'delete-project':['projects','delete'],
    'new-sample':['samples','create'], 'edit-sample':['samples','edit'],
    'new-quotation':['quotations','create'], 'edit-quotation':['quotations','edit'], 'convert-quotation':['orders','create'],
    'new-order':['orders','create'], 'edit-order':['orders','edit'], 'edit-operation':['operations','edit'],
    'edit-project-brief':['projects','edit'], 'edit-project-formula':['formulas','edit'], 'edit-project-packaging':['projects','edit'],
    'edit-project-artwork':['projects','edit'], 'edit-project-approval':['projects','approve'], 'edit-project-documents':['projects','edit'],
    'new-user':['users','manage'], 'edit-user':['users','manage'], 'toggle-user':['users','manage'],
    'export-data':['settings','view'], 'import-data':['settings','manage'], 'reset-data':['settings','manage']
  };

  function canAction(action, collection) {
    if (action === 'project-tab' || action === 'logout') return true;
    if (action === 'delete-record' && collection) return CRMData.can(collection, 'delete');
    const requirement = actionPermissions[action];
    return !requirement || CRMData.can(requirement[0], requirement[1]);
  }

  navItems.forEach(item => {
    const resource = item.dataset.view;
    if (!CRMData.can(resource, 'view')) item.classList.add('permission-hidden');
  });

  const dataImportInput = document.getElementById('dataImportInput');
  dataImportInput.addEventListener('change', async () => {
    const file = dataImportInput.files && dataImportInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      CRMData.importData(text);
      toast('CRM backup imported.');
      dataImportInput.value = '';
      renderRoute();
    } catch (error) {
      dataImportInput.value = '';
      openModal('<p class="eyebrow">IMPORT ERROR</p><h2>Backup could not be imported</h2><p class="modal-subtitle">' + esc(error.message || error) + '</p>');
    }
  });

  menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));
  closeModalButton.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  document.getElementById('userMenuButton').addEventListener('click', () => {
    openModal(
      '<p class="eyebrow">ACCOUNT</p>' +
      '<h2>' + esc(session.name) + '</h2>' +
      '<p class="modal-subtitle">' + esc(session.email) + '</p>' +
      '<div class="detail-grid">' +
        detailItem('Department', session.department || 'General') +
        detailItem('Role', session.role || 'Staff') +
      '</div>' +
      '<div class="modal-actions"><button class="secondary-button" data-action="logout">Sign out</button></div>'
    );
  });

  document.getElementById('notificationButton').addEventListener('click', () => renderNotifications());

  document.addEventListener('click', e => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id || '';
    const collection = button.dataset.collection || '';

    if (!canAction(action, collection)) {
      toast('You do not have permission for this action.');
      return;
    }

    if (action === 'logout') {
      CRMData.logout();
      location.replace('./login.html');
    }
    if (action === 'new-customer') openCustomerForm();
    if (action === 'edit-customer') openCustomerForm(id);
    if (action === 'delete-customer') deleteRecord('customers', id, 'customer');
    if (action === 'new-lead') openLeadForm();
    if (action === 'edit-lead') openLeadForm(id);
    if (action === 'delete-lead') deleteRecord('leads', id, 'lead');
    if (action === 'lead-to-project') convertLeadToProject(id);
    if (action === 'new-project') openProjectForm();
    if (action === 'edit-project') openProjectForm(id);
    if (action === 'delete-project') deleteRecord('projects', id, 'project');
    if (action === 'new-sample') openSampleForm(button.dataset.projectId || '');
    if (action === 'edit-sample') openSampleForm('', id);
    if (action === 'delete-record' && collection) deleteRecord(collection, id, collection.slice(0,-1));
    if (action === 'new-quotation') openQuotationForm(button.dataset.projectId || '');
    if (action === 'edit-quotation') openQuotationForm('', id);
    if (action === 'convert-quotation') convertQuotationToOrder(id);
    if (action === 'new-order') openOrderForm();
    if (action === 'edit-order') openOrderForm('', id);
    if (action === 'edit-operation') openOrderForm('', id, 'operations');
    if (action === 'edit-project-brief') openProjectBriefForm(id);
    if (action === 'edit-project-formula') openProjectFormulaForm(id);
    if (action === 'edit-project-packaging') openProjectPackagingForm(id);
    if (action === 'edit-project-artwork') openProjectArtworkForm(id);
    if (action === 'edit-project-approval') openProjectApprovalForm(id);
    if (action === 'edit-project-documents') openProjectDocumentsForm(id);
    if (action === 'project-tab') switchProjectTab(button.dataset.tab || 'overview');
    if (action === 'new-user') openUserForm();
    if (action === 'edit-user') openUserForm(id);
    if (action === 'toggle-user') toggleUser(id);
    if (action === 'export-data') exportCRMData();
    if (action === 'import-data') dataImportInput.click();
    if (action === 'reset-data') {
      if (confirm('Reset all local CRM demo data?')) {
        CRMData.reset();
        toast('Demo data reset.');
        renderRoute();
      }
    }
  });

  navItems.forEach(item => {
    item.addEventListener('click', () => sidebar.classList.remove('open'));
  });

  window.addEventListener('hashchange', renderRoute);

  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === 'Escape') closeModal();
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      renderSearch(searchInput.value);
    }
  });

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function initials(name) {
    return String(name).split(/\s+/).filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase();
  }

  function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value + (String(value).length === 10 ? 'T00:00:00' : ''));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-CA');
  }

  function getCustomerName(id) {
    const item = CRMData.get('customers', id);
    return item ? item.company : '—';
  }

  function getProjectName(id) {
    const item = CRMData.get('projects', id);
    return item ? item.name : '—';
  }

  function statusClass(status) {
    const s = String(status || '').toLowerCase();
    if (/paid|approved|active|delivered|ready|won|released/.test(s)) return 'success';
    if (/overdue|rejected|lost|hold|cancel/.test(s)) return 'danger';
    if (/pending|waiting|revision|feedback|draft/.test(s)) return 'warning';
    return 'info';
  }

  function badge(status) {
    return '<span class="badge ' + statusClass(status) + '">' + esc(status || '—') + '</span>';
  }

  function detailItem(label, value) {
    return '<div class="detail-item"><span>' + esc(label) + '</span><strong>' + esc(value || '—') + '</strong></div>';
  }

  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(window.__crmToastTimer);
    window.__crmToastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
  }

  function openModal(html) {
    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
    lucide.createIcons();
  }

  function closeModal() {
    modal.classList.add('hidden');
    modalContent.innerHTML = '';
  }

  function modalForm(title, subtitle, fields, submitLabel, onSubmit) {
    const html =
      '<p class="eyebrow">JN COS TECH CRM</p>' +
      '<h2>' + esc(title) + '</h2>' +
      '<p class="modal-subtitle">' + esc(subtitle || '') + '</p>' +
      '<form class="record-form" id="recordForm">' +
        '<div class="form-grid">' + fields + '</div>' +
        '<div class="modal-actions">' +
          '<button type="button" class="secondary-button" id="cancelForm">Cancel</button>' +
          '<button type="submit" class="primary-button">' + esc(submitLabel || 'Save') + '</button>' +
        '</div>' +
      '</form>';
    openModal(html);
    document.getElementById('cancelForm').addEventListener('click', closeModal);
    document.getElementById('recordForm').addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.currentTarget).entries());
      onSubmit(data);
    });
  }

  function inputField(label, name, value, type, required, span) {
    return '<label class="field ' + (span ? 'field-span' : '') + '">' +
      '<span>' + esc(label) + (required ? ' *' : '') + '</span>' +
      '<input name="' + esc(name) + '" type="' + esc(type || 'text') + '" value="' + esc(value || '') + '" ' + (required ? 'required' : '') + ' />' +
    '</label>';
  }

  function textAreaField(label, name, value, span) {
    return '<label class="field ' + (span ? 'field-span' : '') + '"><span>' + esc(label) + '</span><textarea name="' + esc(name) + '" rows="4">' + esc(value || '') + '</textarea></label>';
  }

  function selectField(label, name, value, options, required, span) {
    return '<label class="field ' + (span ? 'field-span' : '') + '"><span>' + esc(label) + (required ? ' *' : '') + '</span><select name="' + esc(name) + '" ' + (required ? 'required' : '') + '>' +
      options.map(opt => '<option value="' + esc(opt) + '" ' + (String(opt) === String(value) ? 'selected' : '') + '>' + esc(opt) + '</option>').join('') +
      '</select></label>';
  }

  function pageHeading(title, description, actionHtml) {
    return '<div class="page-heading"><div><p class="eyebrow">JN COS TECH CRM</p><h1>' + esc(title) + '</h1><p>' + esc(description) + '</p></div>' + (actionHtml || '') + '</div>';
  }

  function tableShell(headers, rows, emptyText) {
    return '<section class="panel table-panel"><div class="table-wrap"><table class="data-table"><thead><tr>' +
      headers.map(h => '<th>' + esc(h) + '</th>').join('') +
      '</tr></thead><tbody>' +
      (rows || '<tr><td colspan="' + headers.length + '" class="empty-cell">' + esc(emptyText || 'No records') + '</td></tr>') +
      '</tbody></table></div></section>';
  }

  function setActiveNav(view) {
    navItems.forEach(item => item.classList.toggle('active', item.dataset.view === view));
  }

  function destroyCharts() {
    charts.forEach(chart => chart.destroy());
    charts = [];
  }

  function renderRoute() {
    destroyCharts();
    const raw = location.hash.replace(/^#/,'') || 'dashboard';
    const parts = raw.split('/');
    const view = parts[0];
    const id = parts[1] || '';
    setActiveNav(view);

    if (!CRMData.can(view, 'view')) {
      pageRoot.innerHTML = pageHeading('Access Restricted','Your current role does not have access to this module.','') +
        '<section class="panel access-panel"><i data-lucide="shield-alert"></i><h2>Permission required</h2><p>Ask an administrator to update your role if you need access.</p></section>';
      lucide.createIcons();
      return;
    }

    if (view === 'dashboard') renderDashboard();
    else if (view === 'customers') id ? renderCustomerDetail(id) : renderCustomers();
    else if (view === 'leads') renderLeads();
    else if (view === 'projects') id ? renderProjectDetail(id) : renderProjects();
    else if (view === 'samples') renderSamples();
    else if (view === 'quotations') renderQuotations();
    else if (view === 'orders') renderOrders();
    else if (view === 'operations') renderOperations();
    else if (view === 'calendar') renderCalendar();
    else if (view === 'settings') renderSettings();
    else renderDashboard();
    lucide.createIcons();
    updateNotificationCount();
  }

  function updateNotificationCount() {
    const state = CRMData.getState();
    const today = new Date().toISOString().slice(0,10);
    const dueLeads = state.leads.filter(l => l.nextActionDate && l.nextActionDate <= today && !/Won|Lost/.test(l.status)).length;
    const waitingSamples = state.samples.filter(s => /Waiting|Revision/.test(s.status)).length;
    const count = dueLeads + waitingSamples;
    const el = document.getElementById('notificationCount');
    el.textContent = count;
    el.style.display = count ? 'grid' : 'none';
  }

  function renderNotifications() {
    const state = CRMData.getState();
    const today = new Date().toISOString().slice(0,10);
    const items = [];
    state.leads.filter(l => l.nextActionDate && l.nextActionDate <= today && !/Won|Lost/.test(l.status)).forEach(l => {
      items.push('<div class="notification-row"><i data-lucide="clock-alert"></i><div><strong>' + esc(l.company) + '</strong><p>Follow-up: ' + esc(l.nextAction || 'Next action') + ' · ' + esc(l.nextActionDate) + '</p></div></div>');
    });
    state.samples.filter(s => /Waiting|Revision/.test(s.status)).forEach(s => {
      items.push('<div class="notification-row"><i data-lucide="flask-conical"></i><div><strong>' + esc(s.id) + '</strong><p>' + esc(s.status) + ' · ' + esc(getProjectName(s.projectId)) + '</p></div></div>');
    });
    openModal('<p class="eyebrow">NOTIFICATIONS</p><h2>Items requiring attention</h2><div class="notification-list">' + (items.join('') || '<p class="empty-text">No pending notifications.</p>') + '</div>');
  }

  
function getDashboardScope() {
    const state = CRMData.getState();
    const role = session.role || 'Staff';
    if (role === 'Admin' || role === 'Management') return state;

    let leads = state.leads || [];
    let projects = state.projects || [];
    let samples = state.samples || [];
    let quotations = state.quotations || [];
    let orders = state.orders || [];
    let activities = state.activities || [];

    if (role === 'Sales') {
      leads = leads.filter(x => x.owner === session.name);
      projects = projects.filter(x => x.salesOwner === session.name);
    } else if (role === 'R&D') {
      leads = [];
      projects = projects.filter(x => x.rdOwner === session.name || x.formulaOwner === session.name);
    } else if (role === 'Operations') {
      leads = [];
      const projectIds = new Set(orders.map(x => x.projectId));
      projects = projects.filter(x => projectIds.has(x.id));
    } else if (role === 'Finance') {
      leads = [];
      const projectIds = new Set([...orders.map(x => x.projectId), ...quotations.map(x => x.projectId)]);
      projects = projects.filter(x => projectIds.has(x.id));
    } else {
      leads = leads.filter(x => x.owner === session.name);
      projects = projects.filter(x => x.salesOwner === session.name || x.rdOwner === session.name);
    }

    const projectIds = new Set(projects.map(x => x.id));
    samples = samples.filter(x => projectIds.has(x.projectId) || (role === 'R&D' && x.rdOwner === session.name));
    quotations = quotations.filter(x => projectIds.has(x.projectId) || role === 'Finance');
    orders = orders.filter(x => projectIds.has(x.projectId) || role === 'Operations' || role === 'Finance');

    const relatedTokens = new Set([
      ...projects.map(x => x.id),
      ...orders.map(x => x.id),
      ...quotations.map(x => x.id),
      ...samples.map(x => x.id)
    ]);
    activities = activities.filter(a => {
      const meta = String(a.meta || '');
      for (const token of relatedTokens) if (meta.includes(token)) return true;
      return false;
    });

    return { ...state, leads, projects, samples, quotations, orders, activities };
  }

  function renderDashboard() {
    const state = getDashboardScope();
    const today = new Date().toISOString().slice(0,10);
    const isMaster = session.role === 'Admin';
    const isManagement = session.role === 'Management';

    const newLeads = state.leads.filter(l => l.status === 'New').length;
    const activeProjects = state.projects.filter(p => !/Approved|Cancelled/.test(p.status)).length;
    const approvalPending = state.projects.filter(p => /Approval|Feedback|Pending|Revision/.test(p.approvalStatus || '')).length;
    const activeOrders = state.orders.filter(o => !/Delivered/.test(o.dispatchStatus || '')).length;
    const readyDispatch = state.orders.filter(o => o.dispatchStatus === 'Ready' || o.productionStatus === 'Ready to Dispatch').length;
    const overdue = state.orders.filter(o => o.paymentStatus === 'Overdue').length;

    const schedule = [];
    state.leads.filter(l => l.nextActionDate).forEach(l => schedule.push({date:l.nextActionDate,type:'Follow-up',title:l.company,meta:l.nextAction || 'Next action'}));
    state.samples.filter(s => s.feedbackDate).forEach(s => schedule.push({date:s.feedbackDate,type:'Sample',title:s.id,meta:getProjectName(s.projectId)}));
    state.projects.filter(p => p.targetDate).forEach(p => schedule.push({date:p.targetDate,type:'Project',title:p.id,meta:p.name}));
    state.orders.filter(o => o.committedDate).forEach(o => schedule.push({date:o.committedDate,type:'Dispatch',title:o.id,meta:getCustomerName(o.customerId)}));
    schedule.sort((a,b) => a.date.localeCompare(b.date));
    const upcoming = schedule.filter(i => i.date >= today).slice(0,5);

    const attention = [];
    state.leads.filter(l => l.nextActionDate && l.nextActionDate <= today && !/Won|Lost/.test(l.status)).forEach(l => attention.push({date:l.nextActionDate,label:'Follow-up',title:l.company,meta:l.nextAction || 'Follow-up required',tone:'warning'}));
    state.samples.filter(s => s.feedbackDate && s.feedbackDate <= today && /Waiting|Revision/.test(s.status)).forEach(s => attention.push({date:s.feedbackDate,label:'Sample',title:s.id,meta:s.status,tone:'warning'}));
    state.projects.filter(p => p.targetDate && p.targetDate <= today && !/Approved|Cancelled/.test(p.status)).forEach(p => attention.push({date:p.targetDate,label:'Project',title:p.id,meta:p.status,tone:'danger'}));
    state.orders.filter(o => o.committedDate && o.committedDate <= today && o.dispatchStatus !== 'Delivered').forEach(o => attention.push({date:o.committedDate,label:'Order',title:o.id,meta:'Dispatch ' + (o.dispatchStatus || 'pending'),tone:'danger'}));
    state.orders.filter(o => o.paymentDue && o.paymentDue <= today && o.paymentStatus !== 'Paid').forEach(o => attention.push({date:o.paymentDue,label:'Payment',title:o.id,meta:o.paymentStatus,tone:'danger'}));
    attention.sort((a,b) => a.date.localeCompare(b.date));

    const statusCounts = {};
    state.projects.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
    const statusEntries = Object.entries(statusCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxStatus = Math.max(1,...statusEntries.map(x=>x[1]));

    const dashboardTitle = isMaster ? 'Company Overview' : (isManagement ? 'Management Overview' : 'My Work Today');
    const dashboardCopy = isMaster || isManagement
      ? 'See the overall business status and what needs attention today.'
      : 'See your assigned work, upcoming schedule and items requiring action.';
    const action = isMaster
      ? '<button class="primary-button" onclick="location.hash=\'#settings\'"><i data-lucide="users"></i> Staff Management</button>'
      : '<button class="primary-button" data-action="new-lead"><i data-lucide="plus"></i> New Lead</button>';

    pageRoot.innerHTML =
      pageHeading(dashboardTitle,dashboardCopy,action) +
      '<div class="stat-grid compact-stats">' +
        statCard('user-plus','blue','New Leads',newLeads,'New enquiries') +
        statCard('folder-kanban','green','Active Projects',activeProjects,'In progress') +
        statCard('badge-check','orange','Waiting Approval',approvalPending,'Needs review') +
        statCard('shopping-cart','teal','Active Orders',activeOrders,'Open orders') +
        statCard('truck','sky','Ready to Dispatch',readyDispatch,'Ready / near ready') +
        statCard('credit-card','red','Payment Overdue',overdue,'Needs follow-up') +
      '</div>' +
      '<div class="dashboard-simple-grid">' +
        '<section class="panel simple-panel"><div class="panel-head"><div><i data-lucide="calendar-clock"></i><h2>Today & Upcoming</h2></div><button onclick="location.hash=\'#calendar\'">Calendar</button></div><div class="timeline">' +
          (upcoming.map((i,idx) => '<div class="timeline-item"><time>' + esc(i.date.slice(5)) + '</time><span class="dot ' + ['blue-dot','green-dot','orange-dot','violet-dot'][idx%4] + '"></span><div><strong>' + esc(i.title) + '</strong><p>' + esc(i.type + ' · ' + i.meta) + '</p></div><i data-lucide="chevron-right"></i></div>').join('') || '<p class="empty-text">No upcoming schedule.</p>') +
        '</div></section>' +
        '<section class="panel simple-panel"><div class="panel-head"><div><i data-lucide="triangle-alert"></i><h2>Needs Attention</h2></div></div><div class="attention-simple-list">' +
          (attention.slice(0,5).map(i => '<div><span class="attention-type">' + esc(i.label) + '</span><div><strong>' + esc(i.title) + '</strong><p>' + esc(i.meta) + '</p></div><small>' + esc(i.date) + '</small></div>').join('') || '<div class="all-clear"><i data-lucide="circle-check"></i><span>No overdue items right now.</span></div>') +
        '</div></section>' +
      '</div>' +
      '<div class="dashboard-simple-grid lower-grid">' +
        '<section class="panel simple-panel"><div class="panel-head"><div><i data-lucide="chart-no-axes-column-increasing"></i><h2>Project Status</h2></div><button onclick="location.hash=\'#projects\'">View projects</button></div><div class="status-bars">' +
          (statusEntries.map(([label,count]) => '<div class="status-bar-row"><span>' + esc(label) + '</span><div class="status-track"><i style="width:' + Math.round((count/maxStatus)*100) + '%"></i></div><strong>' + count + '</strong></div>').join('') || '<p class="empty-text">No project data.</p>') +
        '</div></section>' +
        '<section class="panel simple-panel"><div class="panel-head"><div><i data-lucide="history"></i><h2>Recent Activity</h2></div></div><div class="activity-list compact-activity">' +
          ((state.activities || []).slice(0,5).map(a => '<div><span class="activity-icon sky"><i data-lucide="history"></i></span><p><strong>' + esc(a.text) + '</strong><small>' + esc(a.meta) + ' · ' + fmtDate(a.createdAt) + '</small></p></div>').join('') || '<p class="empty-text">No recent activity.</p>') +
        '</div></section>' +
      '</div>';
  }

  function statCard(icon, tone, title, value, note) {
    return '<article class="stat-card"><div class="stat-icon ' + tone + '"><i data-lucide="' + icon + '"></i></div><div><span>' + esc(title) + '</span><strong>' + esc(value) + '</strong><small class="muted">' + esc(note) + '</small></div></article>';
  }

  function renderRecentLeads(leads) {
    const rows = leads.map(l =>
      '<tr><td>' + fmtDate(l.createdAt) + '</td><td><strong>' + esc(l.company) + '</strong></td><td>' + esc(l.contact) + '</td><td>' + esc(l.country) + '</td><td>' + esc(l.type) + '</td><td>' + esc(l.source) + '</td><td>' + badge(l.status) + '</td><td>' + esc(l.owner) + '</td></tr>'
    ).join('');
    return '<section class="panel table-panel"><div class="panel-head"><div><i data-lucide="user-plus"></i><h2>Recent Leads</h2></div><button onclick="location.hash=\'#leads\'">View all</button></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Company</th><th>Contact</th><th>Country</th><th>Type</th><th>Source</th><th>Status</th><th>Owner</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }

  function renderDashboardCharts(state) {
    Chart.defaults.font = { family:'Inter', size:10 };
    Chart.defaults.color = '#728096';

    const projectCounts = {};
    state.projects.forEach(p => projectCounts[p.status] = (projectCounts[p.status] || 0) + 1);
    charts.push(new Chart(document.getElementById('projectChart'), {
      type:'doughnut',
      data:{labels:Object.keys(projectCounts),datasets:[{data:Object.values(projectCounts),backgroundColor:['#4e89ff','#7759d9','#f6a443','#37b879','#8290a6','#ec5c67'],borderWidth:0}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'right',labels:{boxWidth:8,boxHeight:8,usePointStyle:true,padding:12}}}}
    }));

    const leadStages = ['New','Contacted','Qualified','Development','Quotation','Won'];
    charts.push(new Chart(document.getElementById('leadChart'), {
      type:'bar',
      data:{labels:leadStages,datasets:[{label:'Leads',data:leadStages.map(s => state.leads.filter(l => l.status === s).length),backgroundColor:'#4e89ff',borderRadius:5}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,ticks:{precision:0},grid:{color:'#edf1f5'}}}}
    }));

    const payStages = ['Paid','Partial','Overdue'];
    charts.push(new Chart(document.getElementById('paymentChart'), {
      type:'doughnut',
      data:{labels:payStages,datasets:[{data:payStages.map(s => state.orders.filter(o => o.paymentStatus === s).length),backgroundColor:['#37b879','#4e89ff','#ec5c67'],borderWidth:0}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'right',labels:{boxWidth:8,boxHeight:8,usePointStyle:true,padding:12}}}}
    }));
  }

  function renderCustomers() {
    const customers = CRMData.list('customers');
    const rows = customers.map(c =>
      '<tr><td><a class="table-link" href="#customers/' + esc(c.id) + '">' + esc(c.id) + '</a></td><td><strong>' + esc(c.company) + '</strong></td><td>' + esc(c.country) + '</td><td>' + esc(c.type) + '</td><td>' + esc(c.contact) + '</td><td>' + esc(c.owner) + '</td><td>' + badge(c.status) + '</td><td class="actions-cell"><button class="row-action" data-action="edit-customer" data-id="' + esc(c.id) + '"><i data-lucide="pencil"></i></button><button class="row-action danger-action" data-action="delete-customer" data-id="' + esc(c.id) + '"><i data-lucide="trash-2"></i></button></td></tr>'
    ).join('');
    pageRoot.innerHTML =
      pageHeading('Customers','Manage customer companies, contacts and account history.','<button class="primary-button" data-action="new-customer"><i data-lucide="plus"></i> New Customer</button>') +
      '<div class="summary-strip"><div><span>Total Customers</span><strong>' + customers.length + '</strong></div><div><span>Active</span><strong>' + customers.filter(c=>c.status==='Active').length + '</strong></div><div><span>Prospects</span><strong>' + customers.filter(c=>c.status==='Prospect').length + '</strong></div></div>' +
      tableShell(['ID','Company','Country','Type','Main Contact','Owner','Status',''], rows, 'No customers yet.');
  }

  function renderCustomerDetail(id) {
    const c = CRMData.get('customers', id);
    if (!c) { pageRoot.innerHTML = pageHeading('Customer not found','The requested customer record does not exist.',''); return; }
    const projects = CRMData.list('projects').filter(p => p.customerId === id);
    const orders = CRMData.list('orders').filter(o => o.customerId === id);
    const projectIds = projects.map(p => p.id);
    const quotes = CRMData.list('quotations').filter(q => projectIds.includes(q.projectId));

    pageRoot.innerHTML =
      '<div class="detail-header"><div><a class="back-link" href="#customers"><i data-lucide="arrow-left"></i> Customers</a><p class="eyebrow">CUSTOMER 360°</p><h1>' + esc(c.company) + '</h1><p>' + esc(c.country) + ' · ' + esc(c.type) + '</p></div><div class="detail-actions"><button class="secondary-button" data-action="edit-customer" data-id="' + esc(c.id) + '">Edit</button><button class="primary-button" data-action="new-project"><i data-lucide="plus"></i> New Project</button></div></div>' +
      '<div class="detail-grid">' +
        detailItem('Customer ID',c.id) + detailItem('Status',c.status) + detailItem('Sales Owner',c.owner) + detailItem('Payment Terms',c.paymentTerms) +
        detailItem('Main Contact',c.contact) + detailItem('Email',c.email) + detailItem('Phone',c.phone) + detailItem('Country',c.country) +
      '</div>' +
      '<div class="record-grid">' +
        '<section class="panel"><div class="panel-head"><div><i data-lucide="folder-kanban"></i><h2>Projects</h2></div><span class="count-pill">' + projects.length + '</span></div>' + (projects.map(p => '<a class="record-row-link" href="#projects/' + esc(p.id) + '"><div><strong>' + esc(p.name) + '</strong><span>' + esc(p.id) + '</span></div>' + badge(p.status) + '</a>').join('') || '<p class="empty-text">No projects.</p>') + '</section>' +
        '<section class="panel"><div class="panel-head"><div><i data-lucide="file-text"></i><h2>Commercial</h2></div></div><div class="metric-list"><div><span>Quotations</span><strong>' + quotes.length + '</strong></div><div><span>Orders</span><strong>' + orders.length + '</strong></div><div><span>Open Balance</span><strong>' + esc(orders.filter(o=>o.balance && o.balance!=='₹0').length) + ' orders</strong></div></div></section>' +
      '</div>' +
      '<section class="panel"><div class="panel-head"><div><i data-lucide="notebook-text"></i><h2>Internal Notes</h2></div></div><p class="body-copy">' + esc(c.notes || 'No notes.') + '</p></section>';
  }

  function openCustomerForm(id) {
    const c = id ? CRMData.get('customers', id) : {};
    const fields =
      inputField('Company Name','company',c.company,'text',true) +
      inputField('Country','country',c.country,'text',true) +
      selectField('Customer Type','type',c.type || 'OEM',['OEM','ODM','Private Label','Distributor','Dealer','Retail','Other'],true) +
      selectField('Status','status',c.status || 'Active',['Active','Prospect','Dormant','On Hold'],true) +
      inputField('Main Contact','contact',c.contact,'text',true) +
      inputField('Email','email',c.email,'email',false) +
      inputField('Phone / WhatsApp','phone',c.phone,'text',false) +
      inputField('Sales Owner','owner',c.owner || session.name,'text',true) +
      inputField('Payment Terms','paymentTerms',c.paymentTerms,'text',false,true) +
      textAreaField('Internal Notes','notes',c.notes,true);
    modalForm(id ? 'Edit Customer' : 'New Customer','Customer company and account information.',fields,id ? 'Save Changes' : 'Create Customer',data => {
      id ? CRMData.update('customers', id, data) : CRMData.create('customers', data);
      closeModal(); toast(id ? 'Customer updated.' : 'Customer created.'); renderRoute();
    });
  }

  function renderLeads() {
    const leads = CRMData.list('leads');
    const rows = leads.map(l =>
      '<tr><td><strong>' + esc(l.id) + '</strong></td><td>' + esc(l.company) + '<small class="cell-sub">' + esc(l.contact) + '</small></td><td>' + esc(l.type) + '</td><td>' + esc(l.source) + '</td><td>' + esc(l.owner) + '</td><td>' + badge(l.status) + '</td><td>' + esc(l.nextActionDate) + '<small class="cell-sub">' + esc(l.nextAction) + '</small></td><td class="actions-cell"><button class="row-action" title="Create Project" data-action="lead-to-project" data-id="' + esc(l.id) + '"><i data-lucide="folder-plus"></i></button><button class="row-action" data-action="edit-lead" data-id="' + esc(l.id) + '"><i data-lucide="pencil"></i></button><button class="row-action danger-action" data-action="delete-lead" data-id="' + esc(l.id) + '"><i data-lucide="trash-2"></i></button></td></tr>'
    ).join('');
    pageRoot.innerHTML =
      pageHeading('Leads','Capture enquiries, follow-ups and move qualified opportunities into projects.','<button class="primary-button" data-action="new-lead"><i data-lucide="plus"></i> New Lead</button>') +
      '<div class="pipeline-strip">' + ['New','Contacted','Qualified','Development','Quotation','Won'].map(s => '<div><span>' + s + '</span><strong>' + leads.filter(l=>l.status===s).length + '</strong></div>').join('') + '</div>' +
      tableShell(['Lead','Company / Contact','Type','Source','Owner','Status','Next Action',''], rows, 'No leads yet.');
  }

  function openLeadForm(id) {
    const l = id ? CRMData.get('leads', id) : {};
    const fields =
      inputField('Company','company',l.company,'text',true) +
      inputField('Contact Person','contact',l.contact,'text',true) +
      inputField('Email','email',l.email,'email',false) +
      inputField('Phone / WhatsApp','phone',l.phone,'text',false) +
      inputField('Country','country',l.country,'text',true) +
      selectField('Enquiry Type','type',l.type || 'OEM',['OEM','ODM','Private Label','Export','Distributor','Dealer','Retail','Other'],true) +
      selectField('Source','source',l.source || 'Website',['Website','Email','WhatsApp','Exhibition','Referral','Phone / Call','Manual'],true) +
      inputField('Owner','owner',l.owner || session.name,'text',true) +
      selectField('Status','status',l.status || 'New',['New','Contacted','Qualified','Development','Quotation','Won','Lost','On Hold'],true) +
      inputField('Next Action Date','nextActionDate',l.nextActionDate,'date',false) +
      inputField('Next Action','nextAction',l.nextAction,'text',false,true) +
      textAreaField('Enquiry Details','details',l.details,true);
    modalForm(id ? 'Edit Lead' : 'New Lead','Record the enquiry and always assign a next action.',fields,id ? 'Save Changes' : 'Create Lead',data => {
      id ? CRMData.update('leads', id, data) : CRMData.create('leads', data);
      closeModal(); toast(id ? 'Lead updated.' : 'Lead created.'); renderRoute();
    });
  }

  function convertLeadToProject(id) {
    const lead = CRMData.get('leads', id);
    if (!lead) return;
    let customer = CRMData.list('customers').find(c => c.company.toLowerCase() === lead.company.toLowerCase());
    if (!customer) {
      customer = CRMData.create('customers', {
        company:lead.company, country:lead.country, type:lead.type, contact:lead.contact, email:lead.email, phone:lead.phone, owner:lead.owner, status:'Active', paymentTerms:'TBD', notes:'Created from ' + lead.id
      });
    }
    const project = CRMData.create('projects', {
      customerId:customer.id,
      name:lead.company + ' New Product',
      category:'',
      salesOwner:lead.owner,
      rdOwner:'',
      targetDate:'',
      moq:'',
      targetPrice:'',
      status:'Brief Received',
      brief:lead.details,
      formulaStatus:'Not Started',
      packagingStatus:'Not Started',
      artworkStatus:'Not Started',
      approvalStatus:'Pending'
    });
    CRMData.update('leads', id, {status:'Development'});
    toast('Project ' + project.id + ' created from lead.');
    location.hash = '#projects/' + project.id;
  }

  function renderProjects() {
    const projects = CRMData.list('projects');
    const rows = projects.map(p =>
      '<tr class="clickable-row" onclick="location.hash=\'#projects/' + esc(p.id) + '\'"><td><strong>' + esc(p.id) + '</strong></td><td>' + esc(getCustomerName(p.customerId)) + '</td><td><strong>' + esc(p.name) + '</strong><small class="cell-sub">' + esc(p.category) + '</small></td><td>' + esc(p.salesOwner) + '</td><td>' + esc(p.rdOwner || '—') + '</td><td>' + badge(p.status) + '</td><td>' + esc(p.targetDate || '—') + '</td><td class="actions-cell" onclick="event.stopPropagation()"><button class="row-action" data-action="edit-project" data-id="' + esc(p.id) + '"><i data-lucide="pencil"></i></button><button class="row-action danger-action" data-action="delete-project" data-id="' + esc(p.id) + '"><i data-lucide="trash-2"></i></button></td></tr>'
    ).join('');
    pageRoot.innerHTML =
      pageHeading('Projects','Central OEM / ODM project workspace from brief to approval.','<button class="primary-button" data-action="new-project"><i data-lucide="plus"></i> New Project</button>') +
      '<div class="summary-strip"><div><span>Total Projects</span><strong>' + projects.length + '</strong></div><div><span>Under Development</span><strong>' + projects.filter(p=>p.status==='Under Development').length + '</strong></div><div><span>Sample / Feedback</span><strong>' + projects.filter(p=>/Sample|Feedback|Revision/.test(p.status)).length + '</strong></div></div>' +
      tableShell(['Project','Customer','Product','Sales','R&D','Status','Target Date',''], rows, 'No projects yet.');
  }

  function openProjectForm(id, preset) {
    const p = id ? CRMData.get('projects', id) : (preset || {});
    const customers = CRMData.list('customers');
    const customerOptions = customers.map(c => c.id + ' | ' + c.company);
    const currentCustomerOption = p.customerId ? (p.customerId + ' | ' + getCustomerName(p.customerId)) : (customerOptions[0] || '');
    const fields =
      selectField('Customer','customerOption',currentCustomerOption,customerOptions,true) +
      inputField('Product / Project Name','name',p.name,'text',true) +
      inputField('Product Category','category',p.category,'text',false) +
      selectField('Project Status','status',p.status || 'Brief Received',['Brief Received','Under Development','Sample Ready','Sample Sent','Feedback','Revision','Approved','On Hold','Cancelled'],true) +
      inputField('Sales Owner','salesOwner',p.salesOwner || session.name,'text',true) +
      inputField('R&D Owner','rdOwner',p.rdOwner,'text',false) +
      inputField('Target Date','targetDate',p.targetDate,'date',false) +
      inputField('MOQ','moq',p.moq,'text',false) +
      inputField('Target Price','targetPrice',p.targetPrice,'text',false) +
      textAreaField('Product Brief','brief',p.brief,true);
    modalForm(id ? 'Edit Project' : 'New Project','Create one OEM / ODM project per product or variant.',fields,id ? 'Save Changes' : 'Create Project',data => {
      const customerId = String(data.customerOption || '').split(' | ')[0];
      delete data.customerOption;
      data.customerId = customerId;
      if (!id) {
        data.formulaStatus='Not Started'; data.packagingStatus='Not Started'; data.artworkStatus='Not Started'; data.approvalStatus='Pending';
      }
      const record = id ? CRMData.update('projects', id, data) : CRMData.create('projects', data);
      closeModal(); toast(id ? 'Project updated.' : 'Project created.'); location.hash = '#projects/' + record.id;
    });
  }

  
function renderProjectDetail(id) {
    const p = CRMData.get('projects', id);
    if (!p) { pageRoot.innerHTML = pageHeading('Project not found','The requested project record does not exist.',''); return; }
    const samples = CRMData.list('samples').filter(s => s.projectId === id);
    const quotes = CRMData.list('quotations').filter(q => q.projectId === id);
    const orders = CRMData.list('orders').filter(o => o.projectId === id);
    const activities = CRMData.list('activities').filter(a => String(a.meta || '').includes(id)).slice(0,20);

    const documentRows = String(p.documents || '').split('\n').map(x => x.trim()).filter(Boolean).map(line =>
      '<div class="document-row"><i data-lucide="paperclip"></i><span>' + esc(line) + '</span></div>'
    ).join('');

    pageRoot.innerHTML =
      '<div class="detail-header"><div><a class="back-link" href="#projects"><i data-lucide="arrow-left"></i> Projects</a><p class="eyebrow">OEM / ODM PROJECT</p><h1>' + esc(p.name) + '</h1><p>' + esc(p.id) + ' · ' + esc(getCustomerName(p.customerId)) + '</p></div><div class="detail-actions"><button class="secondary-button" data-action="edit-project" data-id="' + esc(p.id) + '">Edit Project</button><button class="primary-button" data-action="new-sample" data-project-id="' + esc(p.id) + '"><i data-lucide="plus"></i> Add Sample</button></div></div>' +
      '<div class="project-status-bar"><div><span>Project Status</span>' + badge(p.status) + '</div><div><span>Formula</span>' + badge(p.formulaStatus) + '</div><div><span>Packaging</span>' + badge(p.packagingStatus) + '</div><div><span>Artwork</span>' + badge(p.artworkStatus) + '</div><div><span>Approval</span>' + badge(p.approvalStatus) + '</div></div>' +
      '<div class="project-tabs" id="projectTabs">' +
        projectTabButton('overview','Overview',true) +
        projectTabButton('brief','Product Brief') +
        (CRMData.can('formulas','view') ? projectTabButton('formula','Formula') : '') +
        projectTabButton('packaging','Packaging') +
        projectTabButton('artwork','Artwork') +
        projectTabButton('approval','Approval') +
        projectTabButton('documents','Documents') +
        projectTabButton('activity','Activity') +
      '</div>' +
      '<div class="project-tab-panels">' +
        '<section class="project-tab-panel active" data-project-panel="overview">' +
          '<div class="record-grid">' +
            '<section class="panel"><div class="panel-head"><div><i data-lucide="circle-user-round"></i><h2>Project Overview</h2></div></div><div class="detail-grid compact">' +
              detailItem('Customer',getCustomerName(p.customerId)) + detailItem('Category',p.category) + detailItem('Sales Owner',p.salesOwner) + detailItem('R&D Owner',p.rdOwner) + detailItem('MOQ',p.moq) + detailItem('Target Price',p.targetPrice) + detailItem('Target Date',p.targetDate) + detailItem('Last Updated',fmtDate(p.updatedAt)) +
            '</div></section>' +
            '<section class="panel"><div class="panel-head"><div><i data-lucide="layers-3"></i><h2>Linked Records</h2></div></div><div class="metric-list"><div><span>Samples</span><strong>' + samples.length + '</strong></div><div><span>Quotations</span><strong>' + quotes.length + '</strong></div><div><span>Orders</span><strong>' + orders.length + '</strong></div></div></section>' +
          '</div>' +
        '</section>' +

        '<section class="project-tab-panel" data-project-panel="brief">' +
          '<section class="panel"><div class="panel-head"><div><i data-lucide="notebook-text"></i><h2>Product Brief</h2></div><button data-action="edit-project-brief" data-id="' + esc(p.id) + '">Edit</button></div>' +
          '<p class="body-copy">' + esc(p.brief || 'No product brief entered.') + '</p>' +
          '<div class="detail-grid compact project-detail-grid">' +
            detailItem('Concept',p.concept) + detailItem('Claims',p.claims) + detailItem('Target Consumer',p.targetConsumer) + detailItem('Benchmark',p.benchmark) +
            detailItem('Texture',p.texture) + detailItem('Fragrance',p.fragrance) + detailItem('Requested Actives',p.requestedActives) + detailItem('Excluded Ingredients',p.excludedIngredients) +
            detailItem('Target Launch',p.launchDate) + detailItem('MOQ',p.moq) + detailItem('Target Price',p.targetPrice) +
          '</div></section>' +
        '</section>' +

        (CRMData.can('formulas','view') ? '<section class="project-tab-panel" data-project-panel="formula">' +
          '<section class="panel"><div class="panel-head"><div><i data-lucide="flask-conical"></i><h2>Formula Control</h2></div>' + (CRMData.can('formulas','edit') ? '<button data-action="edit-project-formula" data-id="' + esc(p.id) + '">Edit</button>' : '') + '</div>' +
          '<div class="detail-grid compact project-detail-grid">' +
            detailItem('Formula Version',p.formulaVersion) + detailItem('Status',p.formulaStatus) + detailItem('R&D Owner',p.formulaOwner || p.rdOwner) + detailItem('Approval Date',p.formulaApprovalDate) +
          '</div><p class="body-copy section-note">' + esc(p.formulaComments || 'No formula notes.') + '</p></section>' +
        '</section>' : '') +

        '<section class="project-tab-panel" data-project-panel="packaging">' +
          '<section class="panel"><div class="panel-head"><div><i data-lucide="package"></i><h2>Packaging Specification</h2></div><button data-action="edit-project-packaging" data-id="' + esc(p.id) + '">Edit</button></div>' +
          '<div class="detail-grid compact project-detail-grid">' +
            detailItem('Type',p.packagingType) + detailItem('Capacity',p.packagingCapacity) + detailItem('Material',p.packagingMaterial) + detailItem('Colour',p.packagingColor) +
            detailItem('Component',p.packagingComponent) + detailItem('Supplier',p.packagingSupplier) + detailItem('Sample Status',p.packagingStatus) + detailItem('Compatibility',p.compatibilityStatus) +
          '</div></section>' +
        '</section>' +

        '<section class="project-tab-panel" data-project-panel="artwork">' +
          '<section class="panel"><div class="panel-head"><div><i data-lucide="pen-tool"></i><h2>Artwork Control</h2></div><button data-action="edit-project-artwork" data-id="' + esc(p.id) + '">Edit</button></div>' +
          '<div class="detail-grid compact project-detail-grid">' +
            detailItem('Artwork Version',p.artworkVersion) + detailItem('Status',p.artworkStatus) + detailItem('Owner',p.artworkOwner) + detailItem('Approval Date',p.artworkApprovalDate) +
          '</div><p class="body-copy section-note">' + esc(p.artworkNotes || 'No artwork notes.') + '</p></section>' +
        '</section>' +

        '<section class="project-tab-panel" data-project-panel="approval">' +
          '<section class="panel"><div class="panel-head"><div><i data-lucide="badge-check"></i><h2>Approval Record</h2></div><button data-action="edit-project-approval" data-id="' + esc(p.id) + '">Edit</button></div>' +
          '<div class="approval-card"><div>' + badge(p.approvalStatus) + '<h3>' + esc(p.approvalType || 'Project Approval') + '</h3><p>' + esc(p.approvalComment || 'No approval comment.') + '</p></div><div class="detail-grid compact">' + detailItem('Approved / Reviewed By',p.approvalBy) + detailItem('Approval Date',p.approvalDate) + '</div></div></section>' +
        '</section>' +

        '<section class="project-tab-panel" data-project-panel="documents">' +
          '<section class="panel"><div class="panel-head"><div><i data-lucide="folder-open"></i><h2>Project Documents</h2></div><button data-action="edit-project-documents" data-id="' + esc(p.id) + '">Manage</button></div>' +
          '<div class="document-list">' + (documentRows || '<p class="empty-text">No document references added.</p>') + '</div><p class="helper-text">Phase 1 stores document references. Production file upload will be connected to cloud storage.</p></section>' +
        '</section>' +

        '<section class="project-tab-panel" data-project-panel="activity">' +
          '<section class="panel"><div class="panel-head"><div><i data-lucide="history"></i><h2>Project Activity</h2></div></div><div class="activity-list">' +
          (activities.map(a => '<div><span class="activity-icon sky"><i data-lucide="history"></i></span><p><strong>' + esc(a.text) + '</strong><small>' + esc(a.meta) + ' · ' + fmtDate(a.createdAt) + '</small></p></div>').join('') || '<p class="empty-text">No project activity yet.</p>') +
          '</div></section>' +
        '</section>' +
      '</div>' +
      '<div class="record-grid project-related-grid">' +
        '<section class="panel"><div class="panel-head"><div><i data-lucide="flask-conical"></i><h2>Samples</h2></div><button data-action="new-sample" data-project-id="' + esc(p.id) + '">New</button></div>' + (samples.map(s => '<div class="record-row"><div><strong>' + esc(s.id) + '</strong><span>' + esc(s.createdDate) + ' · ' + esc(s.rdOwner) + '</span></div>' + badge(s.status) + '</div>').join('') || '<p class="empty-text">No samples yet.</p>') + '</section>' +
        '<section class="panel"><div class="panel-head"><div><i data-lucide="file-text"></i><h2>Quotations / Orders</h2></div><button data-action="new-quotation" data-project-id="' + esc(p.id) + '">New Quote</button></div>' +
        (quotes.map(q => '<div class="record-row"><div><strong>' + esc(q.id) + ' · ' + esc(q.version) + '</strong><span>' + esc(q.unitPrice) + ' / MOQ ' + esc(q.moq) + '</span></div>' + badge(q.status) + '</div>').join('') || '<p class="empty-text">No quotations.</p>') +
        (orders.map(o => '<div class="record-row"><div><strong>' + esc(o.id) + '</strong><span>' + esc(o.quantity) + ' units · ' + esc(o.committedDate) + '</span></div>' + badge(o.productionStatus) + '</div>').join('')) +
        '</section>' +
      '</div>';
  }

  function projectTabButton(tab,label,active) {
    return '<button class="project-tab-button ' + (active ? 'active' : '') + '" data-action="project-tab" data-tab="' + esc(tab) + '">' + esc(label) + '</button>';
  }

  function switchProjectTab(tab) {
    document.querySelectorAll('.project-tab-button').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    document.querySelectorAll('.project-tab-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.projectPanel === tab));
  }

  function openProjectBriefForm(id) {
    const p = CRMData.get('projects', id);
    if (!p) return;
    const fields =
      textAreaField('Product Brief','brief',p.brief,true) +
      inputField('Concept','concept',p.concept,'text',false) +
      inputField('Claims','claims',p.claims,'text',false) +
      inputField('Target Consumer','targetConsumer',p.targetConsumer,'text',false) +
      inputField('Benchmark','benchmark',p.benchmark,'text',false) +
      inputField('Texture','texture',p.texture,'text',false) +
      inputField('Fragrance','fragrance',p.fragrance,'text',false) +
      inputField('Requested Active Ingredients','requestedActives',p.requestedActives,'text',false,true) +
      inputField('Excluded Ingredients','excludedIngredients',p.excludedIngredients,'text',false,true) +
      inputField('Target Launch Date','launchDate',p.launchDate,'date',false) +
      inputField('MOQ','moq',p.moq,'text',false) +
      inputField('Target Price','targetPrice',p.targetPrice,'text',false);
    modalForm('Product Brief','Maintain the structured customer product brief.',fields,'Save Brief',data => {
      CRMData.update('projects', id, data); closeModal(); toast('Product brief updated.'); renderRoute();
    });
  }

  function openProjectFormulaForm(id) {
    const p = CRMData.get('projects', id);
    if (!p) return;
    const fields =
      inputField('Formula Version','formulaVersion',p.formulaVersion || 'V1','text',true) +
      selectField('Formula Status','formulaStatus',p.formulaStatus || 'Not Started',['Not Started','Development','Sample Ready','Pending Feedback','Approved','Rejected','On Hold'],true) +
      inputField('R&D Owner','formulaOwner',p.formulaOwner || p.rdOwner,'text',false) +
      inputField('Approval Date','formulaApprovalDate',p.formulaApprovalDate,'date',false) +
      textAreaField('Formula Notes','formulaComments',p.formulaComments,true);
    modalForm('Formula Control','Track formula version, status and approval record.',fields,'Save Formula',data => {
      CRMData.update('projects', id, data); closeModal(); toast('Formula information updated.'); renderRoute();
    });
  }

  function openProjectPackagingForm(id) {
    const p = CRMData.get('projects', id);
    if (!p) return;
    const fields =
      inputField('Packaging Type','packagingType',p.packagingType,'text',false) +
      inputField('Capacity','packagingCapacity',p.packagingCapacity,'text',false) +
      inputField('Material','packagingMaterial',p.packagingMaterial,'text',false) +
      inputField('Colour','packagingColor',p.packagingColor,'text',false) +
      inputField('Pump / Dropper / Cap','packagingComponent',p.packagingComponent,'text',false) +
      inputField('Supplier','packagingSupplier',p.packagingSupplier,'text',false) +
      selectField('Sample / Procurement Status','packagingStatus',p.packagingStatus || 'Not Started',['Not Started','Searching','Sample Requested','Sample Received','Compatibility Check','Sample Approved','Approved','Rejected'],true) +
      selectField('Compatibility Status','compatibilityStatus',p.compatibilityStatus || 'Not Tested',['Not Tested','Testing','Passed','Failed','Hold'],true);
    modalForm('Packaging Specification','Track the primary pack and compatibility status.',fields,'Save Packaging',data => {
      CRMData.update('projects', id, data); closeModal(); toast('Packaging updated.'); renderRoute();
    });
  }

  function openProjectArtworkForm(id) {
    const p = CRMData.get('projects', id);
    if (!p) return;
    const fields =
      inputField('Artwork Version','artworkVersion',p.artworkVersion || 'V1','text',true) +
      selectField('Artwork Status','artworkStatus',p.artworkStatus || 'Not Started',['Not Started','Draft','V1 Review','V2 Review','Internal Approval','Customer Approval','FINAL APPROVED','Rejected'],true) +
      inputField('Artwork Owner','artworkOwner',p.artworkOwner,'text',false) +
      inputField('Approval Date','artworkApprovalDate',p.artworkApprovalDate,'date',false) +
      textAreaField('Artwork Notes','artworkNotes',p.artworkNotes,true);
    modalForm('Artwork Control','Keep artwork versions and the final approved state visible.',fields,'Save Artwork',data => {
      CRMData.update('projects', id, data); closeModal(); toast('Artwork updated.'); renderRoute();
    });
  }

  function openProjectApprovalForm(id) {
    const p = CRMData.get('projects', id);
    if (!p) return;
    const fields =
      selectField('Approval Type','approvalType',p.approvalType || 'Project Approval',['Formula Approval','Sample Approval','Artwork Approval','Commercial Approval','Project Approval'],true) +
      selectField('Approval Status','approvalStatus',p.approvalStatus || 'Pending',['Pending','Approved','Rejected','Revision Requested','On Hold'],true) +
      inputField('Approved / Reviewed By','approvalBy',p.approvalBy,'text',false) +
      inputField('Approval Date','approvalDate',p.approvalDate,'date',false) +
      textAreaField('Approval Comment','approvalComment',p.approvalComment,true);
    modalForm('Approval Record','Record who approved or rejected the current project gate.',fields,'Save Approval',data => {
      CRMData.update('projects', id, data); closeModal(); toast('Approval record updated.'); renderRoute();
    });
  }

  function openProjectDocumentsForm(id) {
    const p = CRMData.get('projects', id);
    if (!p) return;
    const fields = textAreaField('Document References','documents',p.documents,true);
    modalForm('Project Documents','Add one file name, Drive link or document reference per line.',fields,'Save Documents',data => {
      CRMData.update('projects', id, data); closeModal(); toast('Document references updated.'); renderRoute();
    });
  }

  function renderSamples() {
    const samples = CRMData.list('samples');
    const rows = samples.map(s =>
      '<tr><td><strong>' + esc(s.id) + '</strong></td><td>' + esc(s.projectId) + '<small class="cell-sub">' + esc(getProjectName(s.projectId)) + '</small></td><td>' + esc(s.version) + '</td><td>' + esc(s.rdOwner) + '</td><td>' + esc(s.createdDate) + '</td><td>' + badge(s.status) + '</td><td>' + esc(s.dispatchDate || '—') + '<small class="cell-sub">' + esc(s.tracking || '') + '</small></td><td>' + esc(s.feedbackDate || '—') + '</td><td class="actions-cell"><button class="row-action" data-action="edit-sample" data-id="' + esc(s.id) + '"><i data-lucide="pencil"></i></button><button class="row-action danger-action" data-action="delete-record" data-collection="samples" data-id="' + esc(s.id) + '"><i data-lucide="trash-2"></i></button></td></tr>'
    ).join('');
    pageRoot.innerHTML = pageHeading('Samples','Track versions, dispatch and customer feedback.','<button class="primary-button" data-action="new-sample"><i data-lucide="plus"></i> New Sample</button>') +
      tableShell(['Sample','Project','Version','R&D Owner','Created','Status','Dispatch','Feedback Due',''], rows, 'No samples yet.');
  }

  function openSampleForm(projectId, sampleId) {
    const s = sampleId ? CRMData.get('samples', sampleId) : {};
    const projects = CRMData.list('projects');
    const options = projects.map(p => p.id + ' | ' + p.name);
    const selected = s.projectId ? s.projectId + ' | ' + getProjectName(s.projectId) : (projectId ? projectId + ' | ' + getProjectName(projectId) : (options[0] || ''));
    const fields =
      selectField('Project','projectOption',selected,options,true) +
      inputField('Version','version',s.version || 'V1','text',true) +
      inputField('R&D Owner','rdOwner',s.rdOwner,'text',true) +
      inputField('Created Date','createdDate',s.createdDate || new Date().toISOString().slice(0,10),'date',true) +
      inputField('Quantity','quantity',s.quantity,'number',false) +
      selectField('Status','status',s.status || 'Preparing',['Preparing','Ready','Sent','Feedback Waiting','Revision','Approved','Rejected'],true) +
      inputField('Dispatch Date','dispatchDate',s.dispatchDate,'date',false) +
      inputField('Courier','courier',s.courier,'text',false) +
      inputField('Tracking / AWB','tracking',s.tracking,'text',false) +
      inputField('Expected Feedback Date','feedbackDate',s.feedbackDate,'date',false) +
      textAreaField('Customer Feedback','feedback',s.feedback,true);
    modalForm(sampleId ? 'Edit Sample' : 'New Sample','Create a new version without overwriting previous versions.',fields,sampleId ? 'Save Changes' : 'Create Sample',data => {
      const pid = String(data.projectOption || '').split(' | ')[0];
      delete data.projectOption;
      data.projectId = pid;
      if (!sampleId) {
        const versionNum = String(data.version || 'V1').replace(/\D/g,'') || '1';
        data.id = 'SMP-' + pid.replace(/\D/g,'').padStart(3,'0') + '-V' + versionNum;
      }
      sampleId ? CRMData.update('samples', sampleId, data) : CRMData.create('samples', data);
      closeModal(); toast(sampleId ? 'Sample updated.' : 'Sample created.'); renderRoute();
    });
  }

  
function renderQuotations() {
    const quotes = CRMData.list('quotations');
    const orders = CRMData.list('orders');
    const rows = quotes.map(q => {
      const converted = orders.some(o => o.quoteId === q.id);
      const convertButton = q.status === 'Accepted' && !converted
        ? '<button class="row-action success-action" title="Convert to Order" data-action="convert-quotation" data-id="' + esc(q.id) + '"><i data-lucide="shopping-cart"></i></button>'
        : (converted ? '<span class="converted-label">Order created</span>' : '');
      return '<tr><td><strong>' + esc(q.id) + '</strong></td><td>' + esc(q.projectId) + '<small class="cell-sub">' + esc(getProjectName(q.projectId)) + '</small></td><td>' + esc(q.version) + '</td><td>' + esc(q.moq) + '</td><td>' + esc(q.unitPrice) + '</td><td>' + esc(q.paymentTerms) + '</td><td>' + esc(q.validUntil) + '</td><td>' + badge(q.status) + '</td><td class="actions-cell">' + convertButton + '<button class="row-action" data-action="edit-quotation" data-id="' + esc(q.id) + '"><i data-lucide="pencil"></i></button><button class="row-action danger-action" data-action="delete-record" data-collection="quotations" data-id="' + esc(q.id) + '"><i data-lucide="trash-2"></i></button></td></tr>';
    }).join('');
    pageRoot.innerHTML = pageHeading('Quotations','Manage versions, approvals and convert accepted quotations into orders.','<button class="primary-button" data-action="new-quotation"><i data-lucide="plus"></i> New Quotation</button>') +
      tableShell(['Quote','Project','Version','MOQ','Unit Price','Terms','Valid Until','Status',''], rows, 'No quotations yet.');
  }

  function openQuotationForm(projectId, quotationId) {
    const q = quotationId ? CRMData.get('quotations', quotationId) : {};
    const projects = CRMData.list('projects');
    const options = projects.map(p => p.id + ' | ' + p.name);
    const selected = q.projectId ? q.projectId + ' | ' + getProjectName(q.projectId) : (projectId ? projectId + ' | ' + getProjectName(projectId) : (options[0] || ''));
    const fields =
      selectField('Project','projectOption',selected,options,true) +
      inputField('Version','version',q.version || 'V1','text',true) +
      inputField('MOQ','moq',q.moq,'text',true) +
      inputField('Unit Price','unitPrice',q.unitPrice,'text',true) +
      inputField('Packaging / Other Charges','otherCharges',q.otherCharges,'text',false) +
      inputField('Payment Terms','paymentTerms',q.paymentTerms || '50/50','text',false) +
      inputField('Lead Time','leadTime',q.leadTime,'text',false) +
      inputField('Valid Until','validUntil',q.validUntil,'date',false) +
      selectField('Status','status',q.status || 'Draft',['Draft','Sent','Revision','Accepted','Rejected','Expired'],true) +
      textAreaField('Notes','notes',q.notes,true);
    modalForm(quotationId ? 'Edit Quotation' : 'New Quotation','Accepted quotations can be converted directly into orders.',fields,quotationId ? 'Save Changes' : 'Create Quotation',data => {
      data.projectId = String(data.projectOption).split(' | ')[0]; delete data.projectOption;
      quotationId ? CRMData.update('quotations', quotationId, data) : CRMData.create('quotations', data);
      closeModal(); toast(quotationId ? 'Quotation updated.' : 'Quotation created.'); renderRoute();
    });
  }

  function convertQuotationToOrder(id) {
    const q = CRMData.get('quotations', id);
    if (!q) return;
    if (q.status !== 'Accepted') {
      toast('Only accepted quotations can be converted.');
      return;
    }
    if (CRMData.list('orders').some(o => o.quoteId === id)) {
      toast('An order already exists for this quotation.');
      return;
    }
    const project = CRMData.get('projects', q.projectId);
    if (!project) return;
    const order = CRMData.create('orders', {
      quoteId:q.id,
      customerId:project.customerId,
      projectId:project.id,
      po:'',
      quantity:q.moq || '',
      orderDate:new Date().toISOString().slice(0,10),
      committedDate:'',
      paymentStatus:'Pending',
      total:'',
      advance:'',
      balance:'',
      paymentDue:'',
      readiness:'Not Ready',
      productionStatus:'Planned',
      qcStatus:'Waiting',
      dispatchStatus:'Not Ready'
    });
    toast('Order ' + order.id + ' created from ' + q.id + '.');
    location.hash = '#orders';
  }

  
function renderOrders() {
    const orders = CRMData.list('orders');
    const rows = orders.map(o =>
      '<tr><td><strong>' + esc(o.id) + '</strong><small class="cell-sub">' + esc(o.po || 'No PO') + (o.quoteId ? ' · ' + esc(o.quoteId) : '') + '</small></td><td>' + esc(getCustomerName(o.customerId)) + '</td><td>' + esc(getProjectName(o.projectId)) + '</td><td>' + esc(o.quantity) + '</td><td>' + esc(o.committedDate || '—') + '</td><td>' + badge(o.readiness) + '</td><td>' + badge(o.productionStatus) + '</td><td>' + badge(o.qcStatus) + '</td><td>' + badge(o.dispatchStatus) + '</td><td>' + badge(o.paymentStatus) + '</td><td class="actions-cell"><button class="row-action" data-action="edit-order" data-id="' + esc(o.id) + '"><i data-lucide="pencil"></i></button><button class="row-action danger-action" data-action="delete-record" data-collection="orders" data-id="' + esc(o.id) + '"><i data-lucide="trash-2"></i></button></td></tr>'
    ).join('');
    pageRoot.innerHTML = pageHeading('Orders','Track readiness, production, QC, dispatch and payment in one order record.','<button class="primary-button" data-action="new-order"><i data-lucide="plus"></i> New Order</button>') +
      tableShell(['Order','Customer','Project','Qty','Committed','Readiness','Production','QC','Dispatch','Payment',''], rows, 'No orders yet.');
  }

  function openOrderForm(projectId, orderId, returnView) {
    const o = orderId ? CRMData.get('orders', orderId) : {};
    const projects = CRMData.list('projects');
    const options = projects.map(p => p.id + ' | ' + p.name);
    const selected = o.projectId ? o.projectId + ' | ' + getProjectName(o.projectId) : (projectId ? projectId + ' | ' + getProjectName(projectId) : (options[0] || ''));
    const fields =
      selectField('Project','projectOption',selected,options,true) +
      inputField('Customer PO','po',o.po,'text',false) +
      inputField('Quantity','quantity',o.quantity,'number',true) +
      inputField('Order Date','orderDate',o.orderDate || new Date().toISOString().slice(0,10),'date',true) +
      inputField('Committed Date','committedDate',o.committedDate,'date',false) +
      selectField('Readiness','readiness',o.readiness || 'Not Ready',['Not Ready','Ready'],true) +
      selectField('Production Status','productionStatus',o.productionStatus || 'Planned',['Planned','Materials Ready','Manufacturing','Filling / Packing','QC Hold','Released','Ready to Dispatch'],true) +
      selectField('QC Status','qcStatus',o.qcStatus || 'Waiting',['Waiting','Testing','Hold','Released','Rejected'],true) +
      selectField('Dispatch Status','dispatchStatus',o.dispatchStatus || 'Not Ready',['Not Ready','Ready','Dispatched','In Transit','Delivered'],true) +
      inputField('Dispatch / Tracking No.','tracking',o.tracking,'text',false) +
      inputField('Order Value','total',o.total,'text',false) +
      inputField('Advance Received','advance',o.advance,'text',false) +
      inputField('Balance','balance',o.balance,'text',false) +
      inputField('Payment Due','paymentDue',o.paymentDue,'date',false) +
      selectField('Payment Status','paymentStatus',o.paymentStatus || 'Pending',['Pending','Partial','Paid','Overdue'],true) +
      textAreaField('Operations Notes','operationsNotes',o.operationsNotes,true);
    modalForm(orderId ? 'Update Order' : 'New Order','Use one record to manage commercial and operational status.',fields,orderId ? 'Save Changes' : 'Create Order',data => {
      const pid = String(data.projectOption).split(' | ')[0]; delete data.projectOption;
      const project = CRMData.get('projects', pid);
      data.projectId = pid; data.customerId = project ? project.customerId : '';
      if (orderId) CRMData.update('orders', orderId, data);
      else CRMData.create('orders', data);
      closeModal(); toast(orderId ? 'Order updated.' : 'Order created.');
      if (returnView === 'operations') location.hash = '#operations';
      else renderRoute();
    });
  }

  
function renderOperations() {
    const orders = CRMData.list('orders');
    const cards = orders.map(o =>
      '<article class="operation-card"><div class="operation-head"><div><span>' + esc(o.id) + '</span><h3>' + esc(getProjectName(o.projectId)) + '</h3><p>' + esc(getCustomerName(o.customerId)) + '</p></div>' + badge(o.productionStatus) + '</div>' +
      '<div class="operation-steps"><div class="' + (/Materials|Manufacturing|Filling|QC|Released|Ready/.test(o.productionStatus) ? 'done' : '') + '"><span>1</span><small>Materials</small></div><div class="' + (/Manufacturing|Filling|QC|Released|Ready/.test(o.productionStatus) ? 'done' : '') + '"><span>2</span><small>Production</small></div><div class="' + (/Released|Ready/.test(o.qcStatus) ? 'done' : '') + '"><span>3</span><small>QC</small></div><div class="' + (/Dispatched|In Transit|Delivered/.test(o.dispatchStatus) ? 'done' : '') + '"><span>4</span><small>Dispatch</small></div></div>' +
      '<div class="detail-grid compact">' + detailItem('Quantity',o.quantity) + detailItem('Committed',o.committedDate) + detailItem('QC',o.qcStatus) + detailItem('Dispatch',o.dispatchStatus) + '</div>' +
      (o.operationsNotes ? '<p class="body-copy operation-note">' + esc(o.operationsNotes) + '</p>' : '') +
      '<div class="operation-actions"><button class="secondary-button" data-action="edit-operation" data-id="' + esc(o.id) + '"><i data-lucide="sliders-horizontal"></i> Update Status</button></div></article>'
    ).join('');
    pageRoot.innerHTML = pageHeading('Operations','Update Production → QC → Dispatch status without opening a separate ERP.','') +
      '<div class="operation-grid">' + (cards || '<p class="empty-text">No active operations.</p>') + '</div>';
  }

  function renderCalendar() {
    const state = CRMData.getState();
    const events = [];
    state.leads.filter(l=>l.nextActionDate).forEach(l=>events.push({date:l.nextActionDate,type:'Follow-up',title:l.company + ' · ' + l.nextAction,link:'#leads'}));
    state.projects.filter(p=>p.targetDate).forEach(p=>events.push({date:p.targetDate,type:'Project Target',title:p.id + ' · ' + p.name,link:'#projects/' + p.id}));
    state.samples.filter(s=>s.feedbackDate).forEach(s=>events.push({date:s.feedbackDate,type:'Sample Feedback',title:s.id + ' · ' + getProjectName(s.projectId),link:'#samples'}));
    state.quotations.filter(q=>q.validUntil).forEach(q=>events.push({date:q.validUntil,type:'Quotation Expiry',title:q.id + ' · ' + getProjectName(q.projectId),link:'#quotations'}));
    state.orders.filter(o=>o.committedDate).forEach(o=>events.push({date:o.committedDate,type:'Dispatch / Commit',title:o.id + ' · ' + getCustomerName(o.customerId),link:'#orders'}));
    state.orders.filter(o=>o.paymentDue).forEach(o=>events.push({date:o.paymentDue,type:'Payment Due',title:o.id + ' · ' + getCustomerName(o.customerId),link:'#orders'}));
    events.sort((a,b)=>a.date.localeCompare(b.date));

    const grouped = {};
    events.forEach(e => { (grouped[e.date] ||= []).push(e); });
    const rows = Object.keys(grouped).map(date =>
      '<div class="calendar-day"><div class="calendar-date"><strong>' + esc(date.slice(-2)) + '</strong><span>' + esc(new Date(date+'T00:00:00').toLocaleDateString('en-US',{month:'short',weekday:'short'})) + '</span></div><div class="calendar-events">' +
      grouped[date].map(e => '<a href="' + esc(e.link) + '"><span class="calendar-type">' + esc(e.type) + '</span><strong>' + esc(e.title) + '</strong></a>').join('') +
      '</div></div>'
    ).join('');

    pageRoot.innerHTML = pageHeading('Calendar','One schedule for follow-ups, approvals, samples, production, dispatch and payments.','') +
      '<section class="panel calendar-panel">' + (rows || '<p class="empty-text">No scheduled events.</p>') + '</section>';
  }

  

function renderSettings() {
    const state = CRMData.getState();
    const canManageUsers = CRMData.can('users','manage');
    const canManageSettings = CRMData.can('settings','manage');
    const activeUsers = state.users.filter(u => u.active !== false).length;

    const userRows = state.users.map(u =>
      '<tr><td><div class="staff-name-cell"><span class="staff-avatar">' + esc(initials(u.name)) + '</span><div><strong>' + esc(u.name) + '</strong><small class="cell-sub">' + esc(u.email) + '</small></div></div></td><td>' + esc(u.department) + '</td><td>' + badge(u.role === 'Admin' ? 'Master' : u.role) + '</td><td>' + (u.active ? badge('Active') : badge('Inactive')) + '</td><td class="actions-cell">' +
        (canManageUsers ? '<button class="row-action" data-action="edit-user" data-id="' + esc(u.id) + '"><i data-lucide="pencil"></i></button><button class="row-action" title="Toggle Active" data-action="toggle-user" data-id="' + esc(u.id) + '"><i data-lucide="power"></i></button>' : '') +
      '</td></tr>'
    ).join('');

    const audits = (state.auditLogs || []).slice(0,20).map(log =>
      '<tr><td>' + fmtDate(log.createdAt) + '</td><td>' + esc((log.actor && log.actor.name) || 'System') + '</td><td>' + badge(log.action) + '</td><td>' + esc(log.collection) + '</td><td>' + esc(log.recordId) + '</td></tr>'
    ).join('');

    pageRoot.innerHTML =
      pageHeading('Staff & Settings','Manage staff accounts and keep the system configuration simple.',
        canManageUsers ? '<button class="primary-button" data-action="new-user"><i data-lucide="user-plus"></i> Add Staff</button>' : '') +
      '<div class="staff-summary-grid">' +
        '<div><span>Total Staff</span><strong>' + state.users.length + '</strong></div>' +
        '<div><span>Active</span><strong>' + activeUsers + '</strong></div>' +
        '<div><span>Master / Management</span><strong>' + state.users.filter(u => u.role === 'Admin' || u.role === 'Management').length + '</strong></div>' +
      '</div>' +
      '<section class="panel table-panel staff-panel"><div class="panel-head"><div><i data-lucide="users-round"></i><h2>Staff Management</h2></div><span class="count-pill">' + state.users.length + '</span></div><p class="panel-description">The Master account creates staff accounts, assigns a role and can deactivate access when needed.</p><div class="table-wrap"><table><thead><tr><th>Staff</th><th>Department</th><th>Access</th><th>Status</th><th></th></tr></thead><tbody>' + userRows + '</tbody></table></div></section>' +
      '<div class="record-grid settings-compact-grid">' +
        '<section class="panel"><div class="panel-head"><div><i data-lucide="shield-check"></i><h2>Access Roles</h2></div></div><div class="role-brief-list">' +
          '<div><strong>Master</strong><span>Full access + staff management</span></div>' +
          '<div><strong>Management</strong><span>Company-wide operational access</span></div>' +
          '<div><strong>Sales</strong><span>Customers, leads, projects, quotations</span></div>' +
          '<div><strong>R&D</strong><span>Projects, formula, samples</span></div>' +
          '<div><strong>Operations</strong><span>Orders, production, QC, dispatch</span></div>' +
          '<div><strong>Finance</strong><span>Quotations, orders, payments</span></div>' +
        '</div></section>' +
        '<section class="panel"><div class="panel-head"><div><i data-lucide="database"></i><h2>System & Backup</h2></div></div><div class="detail-grid compact">' +
          detailItem('Data Provider',CRMData.providerName) + detailItem('Schema',state.schemaVersion || '—') + detailItem('Currency',state.settings.defaultCurrency) + detailItem('Company',state.settings.companyName) +
        '</div><div class="settings-button-row"><button class="secondary-button" data-action="export-data"><i data-lucide="download"></i> Export Backup</button>' + (canManageSettings ? '<button class="secondary-button" data-action="import-data"><i data-lucide="upload"></i> Import</button>' : '') + '</div></section>' +
      '</div>' +
      '<details class="panel settings-details"><summary><span><i data-lucide="cloud-cog"></i><strong>Firebase Readiness</strong></span><small>Technical setup</small></summary><div class="check-list settings-details-body"><span class="done"><i data-lucide="check"></i> Provider abstraction</span><span class="done"><i data-lucide="check"></i> Role model</span><span class="done"><i data-lucide="check"></i> Audit structure</span><span class="done"><i data-lucide="check"></i> Backup / import</span><span><i data-lucide="circle"></i> Firebase credentials</span><span><i data-lucide="circle"></i> Deploy security rules</span></div></details>' +
      '<details class="panel settings-details"><summary><span><i data-lucide="scroll-text"></i><strong>Audit Log</strong></span><small>' + (state.auditLogs || []).length + ' records</small></summary><div class="table-wrap settings-details-body"><table><thead><tr><th>Date</th><th>User</th><th>Action</th><th>Collection</th><th>Record</th></tr></thead><tbody>' + (audits || '<tr><td colspan="5" class="empty-cell">No audit activity yet.</td></tr>') + '</tbody></table></div></details>' +
      (canManageSettings ? '<section class="panel danger-zone compact-danger"><div><h2>Reset Local Demo</h2><p>Use only while testing before Firebase is connected.</p></div><button class="secondary-button" data-action="reset-data">Reset</button></section>' : '');
  }

  function openUserForm(id) {
    const u = id ? CRMData.get('users', id) : {};
    const fields =
      inputField('Name','name',u.name,'text',true) +
      inputField('Email','email',u.email,'email',true) +
      inputField('Department','department',u.department,'text',true) +
      selectField('Role','role',u.role || 'Staff',['Admin','Management','Sales','R&D','Operations','Finance','Staff'],true) +
      selectField('Status','activeStatus',u.active === false ? 'Inactive' : 'Active',['Active','Inactive'],true);
    modalForm(id ? 'Edit User' : 'New User','Prepare CRM users and roles before Firebase Authentication is connected.',fields,id ? 'Save User' : 'Create User',data => {
      data.active = data.activeStatus === 'Active';
      delete data.activeStatus;
      try {
        id ? CRMData.update('users', id, data) : CRMData.create('users', data);
        closeModal(); toast(id ? 'User updated.' : 'User created.'); renderRoute();
      } catch (error) {
        const form = document.getElementById('recordForm');
        let errorEl = form.querySelector('.form-error');
        if (!errorEl) {
          errorEl = document.createElement('p');
          errorEl.className = 'form-error';
          form.appendChild(errorEl);
        }
        errorEl.textContent = error.message || error;
      }
    });
  }

  function toggleUser(id) {
    const u = CRMData.get('users', id);
    if (!u) return;
    if (u.email === session.email && u.active !== false) {
      toast('You cannot deactivate your own current session.');
      return;
    }
    CRMData.update('users', id, {active:!u.active});
    toast(u.active ? 'User deactivated.' : 'User activated.');
    renderRoute();
  }

  function exportCRMData() {
    const json = CRMData.exportData();
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jncos-crm-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('CRM backup exported.');
  }

  function renderSearch(query) {
    const results = CRMData.search(query).filter(item => CRMData.can(item.collection, 'view'));
    pageRoot.innerHTML = pageHeading('Search','Results for "' + query + '".','') +
      '<section class="panel search-results">' +
      (results.map(item => {
        const r = item.record;
        let link = '#'+item.collection;
        if (item.collection === 'customers') link = '#customers/' + r.id;
        if (item.collection === 'projects') link = '#projects/' + r.id;
        const title = r.company || r.name || r.id;
        return '<a href="' + link + '"><div><span>' + esc(item.collection.toUpperCase()) + '</span><strong>' + esc(title) + '</strong><small>' + esc(r.id) + '</small></div><i data-lucide="arrow-up-right"></i></a>';
      }).join('') || '<p class="empty-text">No matching records.</p>') +
      '</section>';
    lucide.createIcons();
  }

  function deleteRecord(collection, id, label) {
    const dependencies = CRMData.getDependencies ? CRMData.getDependencies(collection, id) : [];
    if (dependencies.length) {
      const summary = dependencies.map(d => d.count + ' ' + d.collection).join(', ');
      openModal('<p class="eyebrow">DELETE BLOCKED</p><h2>This record is still in use</h2><p class="modal-subtitle">Remove or reassign the linked records first: ' + esc(summary) + '.</p>');
      return;
    }
    if (!confirm('Delete this ' + label + '?')) return;
    const result = CRMData.remove(collection, id);
    if (result && result.ok === false) {
      toast('This record cannot be deleted while linked records exist.');
      return;
    }
    toast(label.charAt(0).toUpperCase() + label.slice(1) + ' deleted.');
    renderRoute();
  }

  if (!location.hash) location.hash = '#dashboard';
  renderRoute();
})();