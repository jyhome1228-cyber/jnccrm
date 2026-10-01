(() => {
  function resolveAdapter() {
    const mode = (window.CRM_CONFIG && window.CRM_CONFIG.dataProvider) || 'local';
    if (mode === 'firebase') {
      if (window.FirebaseCRMAdapter) return window.FirebaseCRMAdapter;
      throw new Error('Firebase CRM adapter is unavailable.');
    }
    if (mode === 'local' && window.CRMStore) return window.CRMStore;
    throw new Error('No CRM data adapter is available.');
  }

  const adapter = resolveAdapter();

  function roleConfig(role) {
    const roles = (window.CRM_CONFIG && window.CRM_CONFIG.roles) || {};
    return roles[role] || roles.Staff || {};
  }

  function can(resource, action='view') {
    const session = adapter.getSession ? adapter.getSession() : null;
    const role = session && session.role ? session.role : 'Staff';
    const config = roleConfig(role);
    const all = config['*'] || [];
    const permissions = config[resource] || [];
    return all.includes(action) || all.includes('*') || permissions.includes(action) || permissions.includes('*');
  }

  function ready() {
    return adapter.ready ? Promise.resolve(adapter.ready()) : Promise.resolve();
  }

  window.CRMData = Object.assign({}, adapter, {
    ready,
    can,
    providerName: ((window.CRM_CONFIG && window.CRM_CONFIG.dataProvider) || 'local')
  });
})();