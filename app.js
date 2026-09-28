lucide.createIcons();

const sidebar = document.getElementById('sidebar');
const menuButton = document.getElementById('menuButton');
const navItems = [...document.querySelectorAll('.nav-item')];
const pageRoot = document.getElementById('pageRoot');
const searchInput = document.getElementById('globalSearch');

menuButton?.addEventListener('click', () => sidebar.classList.toggle('open'));

navItems.forEach(item => {
  item.addEventListener('click', (event) => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    sidebar.classList.remove('open');

    const view = item.dataset.view;
    if (view !== 'dashboard') {
      event.preventDefault();
      renderPlaceholder(view);
    } else {
      location.reload();
    }
  });
});

function renderPlaceholder(view){
  const name = view.charAt(0).toUpperCase() + view.slice(1);
  pageRoot.innerHTML = `
    <div class="page-heading">
      <div>
        <p class="eyebrow">JN COS TECH CRM</p>
        <h1>${name}</h1>
        <p>This module is included in the Phase 1 information architecture.</p>
      </div>
      <button class="primary-button"><i data-lucide="plus"></i> New ${name.replace(/s$/, '')}</button>
    </div>
    <section class="panel" style="min-height:540px;display:grid;place-items:center;text-align:center">
      <div style="max-width:460px">
        <div class="stat-icon blue" style="margin:0 auto 18px"><i data-lucide="construction"></i></div>
        <h2 style="margin:0 0 10px">${name} module prepared</h2>
        <p style="color:#738097;line-height:1.7;font-size:13px;margin:0">
          The navigation and design system are ready. Data tables, forms, filters and record detail views will be connected in the next implementation step.
        </p>
      </div>
    </section>`;
  lucide.createIcons();
}

document.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

const quickModal = document.getElementById('quickModal');
document.getElementById('quickAdd')?.addEventListener('click', () => quickModal.classList.remove('hidden'));
document.getElementById('closeModal')?.addEventListener('click', () => quickModal.classList.add('hidden'));
quickModal?.addEventListener('click', e => {
  if (e.target === quickModal) quickModal.classList.add('hidden');
});

const chartFont = { family: 'Inter', size: 10 };
Chart.defaults.font = chartFont;
Chart.defaults.color = '#728096';

const projectCanvas = document.getElementById('projectChart');
if(projectCanvas){
  new Chart(projectCanvas, {
    type:'doughnut',
    data:{
      labels:['Development','Sample','Quotation','On Hold','Completed'],
      datasets:[{data:[8,5,4,3,3],backgroundColor:['#4e89ff','#7759d9','#f6a443','#8290a6','#37b879'],borderWidth:0}]
    },
    options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'right',labels:{boxWidth:8,boxHeight:8,usePointStyle:true,padding:12}}}}
  });
}

const orderCanvas = document.getElementById('orderChart');
if(orderCanvas){
  new Chart(orderCanvas, {
    type:'bar',
    data:{
      labels:['May','Jun','Jul','Aug','Sep'],
      datasets:[
        {label:'Orders',data:[9,11,14,14,17],backgroundColor:'#4e89ff',borderRadius:4},
        {label:'Production',data:[6,8,9,11,13],backgroundColor:'#37b879',borderRadius:4}
      ]
    },
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',align:'end',labels:{boxWidth:8,boxHeight:8,usePointStyle:true}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:'#edf1f5'}}}}
  });
}

const paymentCanvas = document.getElementById('paymentChart');
if(paymentCanvas){
  new Chart(paymentCanvas, {
    type:'doughnut',
    data:{labels:['Paid','Partial','Overdue'],datasets:[{data:[60,20,20],backgroundColor:['#37b879','#4e89ff','#ec5c67'],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'right',labels:{boxWidth:8,boxHeight:8,usePointStyle:true,padding:12}}}}
  });
}
