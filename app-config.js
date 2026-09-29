(() => {
  window.CRM_CONFIG = {
    appName: 'JN COS TECH CRM',
    schemaVersion: 2,
    dataProvider: 'local',
    collections: ['customers','leads','projects','samples','quotations','orders','users','activities','auditLogs'],
    roles: {
      Admin: {
        '*': ['view','create','edit','delete','approve','export','manage']
      },
      Management: {
        dashboard:['view'],
        customers:['view','create','edit','export'],
        leads:['view','create','edit','delete','export'],
        projects:['view','create','edit','approve','export'],
        samples:['view','create','edit','delete','approve','export'],
        quotations:['view','create','edit','delete','approve','export'],
        orders:['view','create','edit','export'],
        operations:['view','edit'],
        calendar:['view'],
        settings:['view'],
        users:['view'],
        auditLogs:['view','export']
      },
      Sales: {
        dashboard:['view'],
        customers:['view','create','edit'],
        leads:['view','create','edit','delete'],
        projects:['view','create','edit'],
        samples:['view','create','edit'],
        quotations:['view','create','edit'],
        orders:['view','create'],
        operations:['view'],
        calendar:['view']
      },
      'R&D': {
        dashboard:['view'],
        customers:['view'],
        leads:['view'],
        projects:['view','edit','approve'],
        samples:['view','create','edit','approve'],
        quotations:['view'],
        orders:['view'],
        operations:['view'],
        calendar:['view']
      },
      Operations: {
        dashboard:['view'],
        customers:['view'],
        projects:['view'],
        samples:['view'],
        quotations:['view'],
        orders:['view','edit'],
        operations:['view','edit'],
        calendar:['view']
      },
      Finance: {
        dashboard:['view'],
        customers:['view'],
        projects:['view'],
        quotations:['view','edit','export'],
        orders:['view','edit','export'],
        operations:['view'],
        calendar:['view']
      },
      Staff: {
        dashboard:['view'],
        customers:['view'],
        projects:['view'],
        samples:['view'],
        calendar:['view']
      }
    },
    statusOptions: {
      lead:['New','Contacted','Qualified','Development','Quotation','Won','Lost','On Hold'],
      project:['Brief Received','Under Development','Sample Ready','Sample Sent','Feedback','Revision','Approved','On Hold','Cancelled'],
      sample:['Preparing','Ready','Sent','Feedback Waiting','Revision','Approved','Rejected'],
      quotation:['Draft','Sent','Revision','Accepted','Rejected','Expired'],
      production:['Planned','Materials Ready','Manufacturing','Filling / Packing','QC Hold','Released','Ready to Dispatch'],
      qc:['Waiting','Testing','Hold','Released','Rejected'],
      dispatch:['Not Ready','Ready','Dispatched','In Transit','Delivered'],
      payment:['Pending','Partial','Paid','Overdue']
    }
  };
})();