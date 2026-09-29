(() => {
  // Firebase adapter contract placeholder.
  //
  // This file is intentionally dormant while CRM_CONFIG.dataProvider === 'local'.
  // When Firebase is connected, implement the same public interface as CRMStore:
  // ready, list, get, create, update, remove, search, getState,
  // setSession/getSession/logout, exportData/importData and subscribe.
  //
  // Keeping the interface identical allows the UI to switch providers without
  // rewriting pages and forms.
  window.FirebaseCRMAdapter = {
    ready() {
      return Promise.reject(new Error('Firebase adapter is not configured yet.'));
    }
  };
})();