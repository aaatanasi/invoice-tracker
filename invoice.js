'use strict';
const rows=[
 ['INV-26018','Aster Row','Spring 2027','2026-11-18',3480,0],
 ['INV-26017','Vale Studio','Spring 2027','2026-11-15',2960,2960],
 ['INV-26016','Northline','Spring 2027','2026-11-11',5200,2200],
 ['INV-26015','Aster Row','Fall 2026','2026-11-08',1850,1850],
 ['INV-26014','Field & Form','Fall 2026','2026-11-02',2750,0],
 ['INV-26013','Vale Studio','Fall 2026','2026-10-29',1260,1260]
];
const sample=['INV-26019','Field & Form','Spring 2027','2026-12-15',1900,0,'Daymark Boutique','Review complete','Awaiting shipment'];
const accounts=['Juniper House','Mill & Moss','Orchid Collective','Daymark Boutique','Westhaven Market','Maple Arcade'];
const comments=['November commission','Payment confirmed','Partial payment recorded','Paid in full','Follow-up scheduled','Payment confirmed'];
const shipments=['In transit','Delivered','Partially shipped','Delivered','Awaiting shipment','Delivered'];
rows.forEach((r,i)=>r.push(accounts[i],comments[i],shipments[i]));
rows[0][3]='2026-12-18'; rows[2][3]='2026-11-25'; rows[4][3]='2026-11-12';
const brandSet=new Set(rows.map(r=>r[1])),seasonSet=new Set(rows.map(r=>r[2]));
const byId=(id)=>document.getElementById(id);
const money=(n)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const currencyInput=(id,label)=>`<label>${label}<input id="${id}" type="number" min="0.01" max="10000000" step="0.01" required></label>`;
const textInput=(id,label)=>`<label>${label}<input id="${id}" maxlength="40" required></label>`;
const pick=(r)=>r[5]===0?'Unpaid':r[5]>=r[4]?'Paid':'Partial';
const select=(id,values,defaultLabel)=>{const e=byId(id),current=e.value;e.replaceChildren(new Option(defaultLabel,''),...Array.from(values,v=>new Option(v,v)));e.value=Array.from(values).includes(current)?current:'';};
let dismissTimer, direction=0, chosenInvoice;
function notice(value){clearTimeout(dismissTimer);byId('message').textContent=value;dismissTimer=setTimeout(()=>byId('message').textContent='',4600);}
function render(){
 select('brand',brandSet,'All brands');select('season',seasonSet,'All seasons');
 const invoices=rows.filter(r=>(!byId('brand').value||r[1]===byId('brand').value)&&(!byId('season').value||r[2]===byId('season').value)&&(!byId('status').value||pick(r)===byId('status').value)&&(!byId('query').value||(r[0]+' '+r[1]+' '+r[6]).toLowerCase().includes(byId('query').value.toLowerCase().trim())));
 if(direction) invoices.sort((a,b)=>direction*a[3].localeCompare(b[3]));
 const scoped=rows.filter(r=>(!byId('brand').value||r[1]===byId('brand').value)&&(!byId('season').value||r[2]===byId('season').value));
 const total=scoped.reduce((a,r)=>a+r[4],0), paid=scoped.reduce((a,r)=>a+r[5],0);
 const overdue=scoped.filter(r=>r[3]<'2026-11-23').reduce((a,r)=>a+r[4]-r[5],0);
 const cards=[['Outstanding',money(total-paid),'Awaiting payment'],['Overdue',money(overdue),'Past due · follow up'],['Paid',money(paid),'Marked paid or payment received'],['Credit notes',money(0),'Kept separate from receivables']];
 byId('summary').replaceChildren(...cards.map(([name,value,detail])=>{const card=document.createElement('div');card.className='stat';const l=document.createElement('div'),s=document.createElement('strong'),d=document.createElement('small');l.className='stat-label';l.textContent=name;s.textContent=value;d.textContent=detail;card.append(l,s,d);return card;}));
 byId('count').textContent=`${invoices.length} of ${rows.length}`;
 const body=byId('rows');body.replaceChildren();
 if(!invoices.length){const td=body.insertRow().insertCell();td.colSpan=8;td.textContent='No invoices match these filters.';td.className='empty';}
 for(const r of invoices){
  const tr=body.insertRow();[r[6],r[1],r[7],r[0],r[3],money(r[4]),pick(r),r[8]].forEach((value,i)=>{
   const cell=tr.insertCell();
   if(i===5)cell.className='num';
   if(i===6){const badge=document.createElement(pick(r)==='Paid'?'span':'button');badge.className='tag '+value;badge.textContent=value;if(badge.tagName==='BUTTON'){badge.title='Record sample payment for '+r[0];badge.onclick=()=>open('paid',r[0]);}cell.append(badge);}
   else cell.textContent=value;
  });
 }
 byId('crumb').textContent=byId('brand').value||'All designers';byId('all').classList.toggle('active',!byId('brand').value);
 byId('side-brands').replaceChildren(...Array.from(brandSet,b=>{const btn=document.createElement('button');btn.className='side-btn'+(byId('brand').value===b?' active':'');btn.textContent=b;btn.onclick=()=>{byId('brand').value=b;render();};return btn;}));
}
const dialog=byId('dialog'), fields=byId('fields'), submit=byId('submit');
let mode;
function open(next,invoice){
 mode=next;chosenInvoice=invoice;
 const title={new:'New Invoice',paid:'Mark Invoice Paid',import:'Import & Review',brand:'Add Brand & Season'};
 byId('dialog-title').textContent=title[mode];submit.disabled=false;
 if(mode==='new'){fields.innerHTML=textInput('new-account','Sample account')+textInput('new-id','Invoice number')+'<label>Brand <select id="new-brand" required></select></label><label>Season <select id="new-season" required></select></label><label>Due date <input id="new-date" type="date" required></label>'+currencyInput('new-amount','Invoice amount');
 select('new-brand',brandSet,'Choose brand');select('new-season',seasonSet,'Choose season');submit.textContent='Add invoice';}
 if(mode==='paid'){fields.innerHTML='<label>Open invoice <select id="pay-id" required></select></label>'+currencyInput('pay-amount','Payment received');
 const unpaid=rows.filter(r=>pick(r)!=='Paid');const e=byId('pay-id');e.replaceChildren(new Option('Choose invoice',''),...unpaid.map(r=>new Option(r[0]+' · '+r[1]+' · '+money(r[4]-r[5])+' open',r[0])));e.addEventListener('change',()=>{const match=rows.find(r=>r[0]===e.value);byId('pay-amount').value=match?(match[4]-match[5]).toFixed(2):'';});if(chosenInvoice){e.value=chosenInvoice;e.dispatchEvent(new Event('change'));}fields.insertAdjacentHTML('beforeend','<label>Date paid <input type="date" id="paid-date" required value="2026-11-23"></label><label>Date payment received (optional) <input type="date"></label><label>Payment note (optional) <input id="pay-note" maxlength="80"></label>');submit.textContent='Record payment';}
 if(mode==='import'){fields.innerHTML='<p>Review one built-in fictional invoice. File uploads are disabled in this portfolio edition.</p><p id="sample-detail"></p>';byId('sample-detail').textContent=`${sample[0]} · ${sample[1]} · ${sample[2]} · ${money(sample[4])}`;submit.textContent='Add sample invoice';submit.disabled=rows.some(r=>r[0]===sample[0]);}
 if(mode==='brand'){fields.innerHTML=textInput('new-brand-name','Sample brand name')+textInput('new-season-name','Season');submit.textContent='Add to lists';}
 dialog.showModal();
}
function reset(){['brand','season','status','query'].forEach(k=>byId(k).value='');}
byId('form').addEventListener('submit',e=>{
 e.preventDefault();
 let note;
 if(mode==='new'){const id=byId('new-id').value.trim(),account=byId('new-account').value.trim();if(!id||!account)return notice('Enter a sample account and invoice number.');if(rows.some(r=>r[0].toLowerCase()===id.toLowerCase()))return notice('This invoice number already exists.');rows.unshift([id,byId('new-brand').value,byId('new-season').value,byId('new-date').value,Number(byId('new-amount').value),0,account,'New sample invoice','Awaiting shipment']);note='Sample invoice added.';reset();}
 if(mode==='paid'){const r=rows.find(r=>r[0]===byId('pay-id').value), amount=Number(byId('pay-amount').value);if(!r||Math.round(amount*100)>Math.round((r[4]-r[5])*100))return notice('Enter an amount no greater than the open balance.');r[5]=Math.round((r[5]+amount)*100)/100;r[7]=byId('pay-note').value.trim()||'Sample payment recorded';note='Sample payment recorded.';}
 if(mode==='import'){if(rows.some(r=>r[0]===sample[0]))return notice('Sample invoice was already added.');rows.unshift([...sample]);note='Sample invoice imported.';reset();}
 if(mode==='brand'){const b=byId('new-brand-name').value.trim(), s=byId('new-season-name').value.trim();if(!b||!s)return notice('Enter a brand and season.');brandSet.add(b);seasonSet.add(s);note='Brand and season added to the sample lists.';}
 dialog.close();render();notice(note);
});
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));
['close','cancel'].forEach(id=>byId(id).addEventListener('click',()=>dialog.close()));
['brand','season','status'].forEach(id=>byId(id).addEventListener('change',render));byId('query').addEventListener('input',render);
byId('all').onclick=()=>{byId('brand').value='';render();};
byId('sort-due').onclick=()=>{direction=direction===1?-1:1;render();};
byId('export').onclick=()=>{
 const escape=v=>'"'+String(v).replaceAll('"','""').replace(/^[=+@-]/,"'$&")+'"';
 const csv=[['Account','Designer','Season','Invoice','Due date','Amount','Paid','Status','Shipment'],...rows.map(r=>[r[6],r[1],r[2],r[0],r[3],r[4],r[5],pick(r),r[8]])].map(r=>r.map(escape).join(',')).join('\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='sample-invoice-register.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
};
render();
