/* ════════════════════════════════════════════════════════════
   pea.js — module PEA de « Mon Budget » (fichier à côté de index.html, comme noel-cadeaux.js).
   Réservé à UN SEUL compte : pour tous les autres utilisateurs ce fichier ne fait rien
   (aucun élément ajouté à la page, aucune lecture ni écriture Firebase, aucun appel réseau).
   Pour le retirer : supprimer la ligne <script src="pea.js"> dans index.html.
   ════════════════════════════════════════════════════════════ */
(function(){
/* ════════════════════════════════════════════════════════════
   PEA · réservé à UN SEUL compte (UID ci-dessous).
   Pour tous les autres utilisateurs : aucun code ne s'exécute, rien n'est lu ni écrit, la tuile « Courses » reste intacte.
   Les données sont rangées dans TON document Firebase (users/<ton uid>), clé « pea ».
   ════════════════════════════════════════════════════════════ */
const PEA_UID='vpSJLnwZN9gqvAs73xfIzqje72m2';
/* URL du petit service de cotation (voir cloudflare-worker-cours.js). Tant qu'elle est vide : saisie manuelle du cours en secours. */
const PEA_QUOTE_URL='https://rough-haze-b25f.thomaspicot97.workers.dev';
const PEA={on:false,tab:'achats',form:false};
/* Ton historique Fortuneo (12 achats) : injecté UNE seule fois, à la première ouverture */
PEA.SEED=()=>({name:'iShares MSCI World Swap PEA',cash:13.99,
  px:{last:7.104,prev:7.205,at:'2026-10-30'},hist:[{d:'2026-10-30',p:7.104}],
  orders:[['2026-02-06',81,6.16,0],['2026-02-12',80,6.195,1.73],['2026-03-05',80,6.23,0],['2026-03-09',65,6.0928,1.39],['2026-04-02',34,5.992,0],['2026-05-04',77,6.46,0],['2026-06-02',73,6.792,0],['2026-07-02',38,6.87,0.91],['2026-07-02',72,6.875,0],['2026-08-06',71,7.021,0],['2026-09-01',71,6.974,0],['2026-10-07',69,7.193,0]].map(a=>({d:a[0],q:a[1],p:a[2],f:a[3]}))});
PEA.iso=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
/* date de la dernière séance : le week-end, c'est le vendredi */
PEA.mkt=()=>{const d=new Date(),w=d.getDay();if(w===6)d.setDate(d.getDate()-1);if(w===0)d.setDate(d.getDate()-2);return PEA.iso(d)};
PEA.dfr=s=>s.split('-').reverse().join('/');
PEA.n=(v,k=2)=>v.toLocaleString('fr-FR',{minimumFractionDigits:k,maximumFractionDigits:k});
PEA.px=v=>v.toLocaleString('fr-FR',{minimumFractionDigits:3,maximumFractionDigits:4});
PEA.sg=v=>(v>0?'+':v<0?'−':'')+PEA.n(Math.abs(v));
PEA.calc=()=>{const p=data.pea;let q=0,inv=0,fees=0;p.orders.forEach(x=>{q+=x.q;inv+=x.q*x.p+x.f;fees+=x.f});
  const last=p.px.last,val=q*last,gain=val-inv,cash=p.cash||0;
  return{q,inv,fees,pru:q?inv/q:0,last,val,gain,pct:inv?gain/inv*100:0,cash,total:val+cash,chg:p.px.prev?(last/p.px.prev-1)*100:null,n:p.orders.length}};
/* courbe du titre : prix de tes achats + cours enregistrés, triés par date */
PEA.series=()=>{const p=data.pea,m=new Map();
  p.orders.map((x,i)=>[x,i]).sort((a,b)=>a[0].d<b[0].d?-1:a[0].d>b[0].d?1:a[1]-b[1]).forEach(a=>m.set(a[0].d,a[0].p));
  p.hist.forEach(h=>m.set(h.d,h.p));
  const first=[...m.keys()].sort()[0];
  ((PEA.q&&PEA.q.closes)||[]).forEach(c=>{if(c[0]>=first)m.set(c[0],c[1])});
  if(p.px.at)m.set(p.px.at,p.px.last);
  return [...m.entries()].sort((a,b)=>a[0]<b[0]?-1:1)};
PEA.draw=()=>{if(!PEA.on||!data.pea)return;const c=PEA.calc();
  $('pval').textContent=Math.round(c.val).toLocaleString('fr-FR')+' €';
  $('pdelta').textContent=(c.gain<0?'− ':'+')+PEA.n(Math.abs(c.pct))+' %';$('pdelta').classList.toggle('neg',c.gain<0);
  {const a=PEA.series().map(x=>x[1]),lo=Math.min(...a),pd=(Math.max(...a)-lo)*.3||.1;$('pspk').innerHTML=spark(a.map(v=>v-(lo-pd)),300,46)}
  document.querySelector('.t-pea').classList.toggle('low',c.gain<0);
  if($('m-pea').classList.contains('open'))PEA.paint()};
PEA.open=()=>{PEA.tab='achats';PEA.form=false;openM('m-pea');PEA.paint();if(Date.now()-(PEA.lastFetch||0)>3e5)PEA.refresh()};
PEA.setTab=t=>{PEA.tab=t;PEA.paint()};
PEA.toggle=()=>{PEA.form=!PEA.form;PEA.paint()};
PEA.sum=()=>{const q=parseInt($('pf-q').value)||0,p=parseFloat($('pf-p').value)||0,f=parseFloat($('pf-f').value)||0;
  $('pf-sum').textContent=q&&p?'Montant : '+fmt(q*p+f):'Montant : –'};
PEA.add=()=>{const d=$('pf-d').value,q=parseInt($('pf-q').value),p=parseFloat($('pf-p').value),f=Math.max(0,parseFloat($('pf-f').value)||0);
  if(!d||!(q>0)||!(p>0)){toast('Date, quantité et prix requis');return}
  const o={d,q,p,f};data.pea.orders.push(o);PEA.form=false;buzz();save();
  toast(`Achat ajouté : ${q} × ${PEA.px(p)} €`,()=>{const L=data.pea.orders,j=L.indexOf(o);if(j>-1){L.splice(j,1);save()}})};
PEA.del=i=>{const L=data.pea.orders,o=L[i];if(!o)return;L.splice(i,1);buzz();save();
  toast('Achat supprimé',()=>{L.splice(Math.min(i,L.length),0,o);save()})};
PEA.setCash=v=>{data.pea.cash=Math.max(0,parseFloat(v)||0);save()};
PEA.setPx=()=>{const v=parseFloat(String($('pp').value).replace(',','.'));if(!(v>0)){toast('Cours invalide');return}
  const p=data.pea,m=PEA.mkt();
  if(p.px.at!==m){p.px.prev=p.px.last;p.px.at=m}
  p.px.last=v;const h=p.hist.find(x=>x.d===m);if(h)h.p=v;else p.hist.push({d:m,p:v});
  buzz();save();toast('Cours mis à jour')};
PEA.chart=()=>{const s=PEA.series(),c=PEA.calc();if(s.length<2)return'<p class="empty">Pas encore assez de points.</p>';
  const W=300,L=8,R=292,T=16,B=106,vals=s.map(x=>x[1]).concat(c.pru),mn=Math.min(...vals),mx=Math.max(...vals),pad=(mx-mn)*.14||.1,lo=mn-pad,hi=mx+pad;
  const t=d=>new Date(d).getTime(),t0=t(s[0][0]),t1=t(s[s.length-1][0]);
  const X=d=>L+(t(d)-t0)/(t1-t0||1)*(R-L),Y=v=>B-(v-lo)/(hi-lo)*(B-T);
  const path=s.map((x,i)=>(i?'L':'M')+X(x[0]).toFixed(1)+' '+Y(x[1]).toFixed(1)).join('');
  const la=s[s.length-1],ly=Y(c.pru);
  const dd=d=>{const a=d.split('-');return a[2]+'/'+a[1]+'/'+a[0].slice(2)};
  return `<div class="chart"><svg viewBox="0 0 300 128" role="img" aria-label="Évolution du cours"><defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4776E6" stop-opacity=".38"/><stop offset="1" stop-color="#4776E6" stop-opacity="0"/></linearGradient></defs>
  <path d="${path}L${R} ${B}L${L} ${B}Z" fill="url(#pg)"/>
  <line x1="${L}" x2="${R}" y1="${ly.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="#FF9F0A" stroke-width="1.4" stroke-dasharray="4 4"/>
  <path d="${path}" fill="none" stroke="#4776E6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  ${(s.length>40?[]:s.slice(0,-1)).map(x=>`<circle cx="${X(x[0]).toFixed(1)}" cy="${Y(x[1]).toFixed(1)}" r="2.2" fill="#4776E6"/>`).join('')}
  <circle cx="${X(la[0]).toFixed(1)}" cy="${Y(la[1]).toFixed(1)}" r="4.2" fill="#fff" stroke="#4776E6" stroke-width="2.4"/>
  <text x="${(X(la[0])-8).toFixed(1)}" y="${(Y(la[1])-9).toFixed(1)}" text-anchor="end" style="fill:var(--text);font-weight:700">${PEA.px(la[1])}</text>
  <text x="${L}" y="${(ly-5).toFixed(1)}" style="fill:#FF9F0A;font-weight:700">PRU ${PEA.n(c.pru,3)}</text>
  <text x="${L}" y="122">${dd(s[0][0])}</text><text x="${R}" y="122" text-anchor="end">${dd(la[0])}</text></svg>
  <div class="leg"><span><i style="background:#4776E6"></i>Cours du titre</span><span><i style="background:#FF9F0A"></i>Mon prix de revient</span></div></div>`};
PEA.paint=()=>{if(!PEA.on||!data.pea)return;const p=data.pea,c=PEA.calc(),cl=c.gain<0?'gn':'gp';
  $('pea-tot').textContent=fmt(c.total);
  $('pt-achats').classList.toggle('on',PEA.tab==='achats');$('pt-stats').classList.toggle('on',PEA.tab==='stats');
  const el=$('l-pea');let h='';
  if(PEA.tab==='achats'){
    h+=PEA.form?`<div class="pf"><label>Date<input id="pf-d" type="date" value="${PEA.iso()}"></label><label>Quantité<input id="pf-q" type="number" inputmode="numeric" step="1" min="1" placeholder="0" oninput="PEA.sum()"></label><label>Prix d’exécution (€)<input id="pf-p" type="number" inputmode="decimal" step="0.0001" placeholder="0,000" value="${p.px.last}" oninput="PEA.sum()"></label><label>Frais (€)<input id="pf-f" type="number" inputmode="decimal" step="0.01" value="0" oninput="PEA.sum()"></label><div class="pf-sum" id="pf-sum">Montant : –</div><div class="pf-btns"><button class="pf-ok" onclick="PEA.add()">Enregistrer l’achat</button><button class="pf-no" onclick="PEA.toggle()">Annuler</button></div></div>`
      :`<button class="add" style="margin:6px 0 10px" onclick="PEA.toggle()">+ Nouvel achat</button>`;
    h+=`<div class="pea-sum">${c.n} achat${c.n>1?'s':''} · ${c.q} titres · ${fmt(c.inv)} investis</div>`;
    const idx=p.orders.map((x,i)=>({...x,i})).sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:b.i-a.i);
    h+=idx.map(o=>`<div class="row"><div class="pl"><b>${o.q} titres × ${PEA.px(o.p)} €</b><span>${PEA.dfr(o.d)}${o.f>0?' · frais '+PEA.n(o.f)+' €':''}</span></div><div class="pa">${fmt(o.q*o.p+o.f)}</div><button class="del" onclick="PEA.del(${o.i})" aria-label="Supprimer">✕</button></div>`).join('')||'<p class="empty">Aucun achat.</p>';
  }else{
    const kv=(l,v)=>`<div class="row"><span class="kv-l">${l}</span><b class="kv-v">${v}</b></div>`;
    const first=p.orders.length?p.orders.map(o=>o.d).sort()[0]:null;
    h+=`<div class="tiles4"><div class="st"><span>Valorisation totale</span><b>${fmt(c.total)}</b></div><div class="st"><span>+/- values latentes</span><b class="${cl}">${PEA.sg(c.gain)} €</b></div><div class="st"><span>Performance</span><b class="${cl}">${PEA.sg(c.pct)} %</b></div><div class="st"><span>Cours vs mon PRU</span><b>${c.pru?(c.last>=c.pru?'+':'−')+PEA.n(Math.abs((c.last/c.pru-1)*100))+' %':'–'}</b></div></div>`;
    h+=`<div class="card"><div class="ct">Évolution du titre</div>${PEA.chart()}</div>`;
    h+=`<div class="card"><div class="ct">${esc(p.name||'Ma position')}</div>${kv('Cours',PEA.px(c.last)+' €')}${c.chg==null?'':kv('Var / veille',`<span class="${c.chg<0?'gn':'gp'}">${PEA.sg(c.chg)} %</span>`)}${kv('Quantité',c.q)}${kv('PRU',PEA.n(c.pru,3)+' €')}${kv('Valorisation',fmt(c.val))}${kv('+/- values',`<span class="${cl}">${PEA.sg(c.gain)} € (${PEA.sg(c.pct)} %)</span>`)}${kv('Poids','100,0 %')}</div>`;
    h+=`<div class="card"><div class="ct">Valorisation du compte</div>${kv('Évaluation titres',fmt(c.val))}<div class="row"><span class="kv-l">Solde espèces</span><input class="ed amt" type="number" step="0.01" inputmode="decimal" value="${p.cash||0}" onfocus="this.select()" onchange="PEA.setCash(this.value)"></div>${kv('Valorisation totale',fmt(c.total))}</div>`;
    h+=`<div class="card"><div class="ct">Chiffres clés</div>${kv('Total investi (frais inclus)',fmt(c.inv))}${kv('Frais payés',fmt(c.fees))}${kv('Achats',c.n)}${kv('Achat moyen',c.n?fmt(c.inv/c.n):'–')}${first?kv('Premier achat',PEA.dfr(first)):''}</div>`;
    if(PEA_QUOTE_URL){const mo=PEA.isMarket(),hm=PEA.lastFetch?new Date(PEA.lastFetch).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):null;
      h+=`<div class="card"><div class="ct">Cours du titre</div><div class="pup-st"><i class="${PEA.err?'err':mo?'live':''}"></i>${PEA.err?'Cours indisponible pour le moment':mo?'Marché ouvert · actualisation toutes les heures':'Marché fermé · dernier cours de la séance'}</div><div class="pup"><span class="pnote" style="flex:1;margin:0;align-self:center">${PEA.px(c.last)} € · séance du ${PEA.dfr(p.px.at)}${hm?'<br>Actualisé à '+hm:''}</span><button class="pbtn2" onclick="PEA.refresh(true)">${PEA.busy?'…':'Actualiser'}</button></div></div>`}
    else h+=`<div class="card"><div class="ct">Mettre à jour le cours</div><div class="pup"><input id="pp" type="number" step="0.001" inputmode="decimal" placeholder="${PEA.px(c.last)}"><button onclick="PEA.setPx()">Enregistrer</button></div><p class="pnote">Cours automatique non configuré (voir PEA_QUOTE_URL). Dernier cours : ${PEA.px(c.last)} € (séance du ${PEA.dfr(p.px.at)}).</p></div>`;
  }
  el.innerHTML=h};
PEA.mount=()=>{
  const st=document.createElement('style');st.textContent=`/* ================= PEA · réservé à un seul compte (invisible pour les autres) ================= */
.t-pea{display:none}
html.pea-on .t-pea{display:block}
html.pea-on .t-or{display:none}
.t-pea{background:linear-gradient(120deg,#0B8FAE,#2F5FD8,#6D4CE0,#0B8FAE);background-size:300% 300%;animation:flow 10s ease-in-out infinite;cursor:pointer;height:113.4px}
.t-pea:active{transform:scale(.98)}
.t-pea.low{background:linear-gradient(120deg,#FF453A,#C2185B,#FF375F,#FF453A);background-size:300% 300%}
.seg{display:flex;background:var(--glass);border:1px solid var(--line);border-radius:16px;padding:4px;gap:4px;margin:12px 0 8px}
.seg button{flex:1;border:0;background:none;color:var(--dim);font-weight:700;font-size:14px;padding:9px 0;border-radius:12px;transition:.2s}
.seg button.on{background:var(--accent);color:#fff}
.pl{flex:1;min-width:0}
.pl b{display:block;font-size:16px;font-weight:700}
.pl span{font-size:12.5px;color:var(--dim);font-weight:600}
.pa{font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap;padding-right:4px}
.pf{background:var(--glass);border:1px solid var(--line);border-radius:20px;padding:14px;margin:6px 0 12px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pf label{display:block;font-size:12px;font-weight:700;color:var(--dim);min-width:0}
.pf input{display:block;width:100%;margin-top:4px;border:1px solid var(--line);background:var(--sheet);color:var(--text);border-radius:12px;padding:11px 10px;font-size:16px;outline:0;min-width:0}
.pf input:focus{border-color:var(--accent)}
.pf .pf-sum{grid-column:1/-1;font-size:14px;font-weight:700;color:var(--dim);text-align:center}
.pf .pf-btns{grid-column:1/-1;display:flex;gap:8px}
.pf-ok,.pf-no{border:0;border-radius:14px;padding:13px;font-weight:800;font-size:15px}
.pf-ok{flex:1;color:#fff;background:linear-gradient(135deg,var(--accent),var(--violet))}
.pf-no{background:var(--glass);border:1px solid var(--line)!important;color:var(--dim);padding:13px 16px}
.pea-sum{font-size:13px;color:var(--dim);font-weight:600;margin:4px 0 6px}
.kv-l{flex:1;color:var(--dim);font-weight:600;font-size:14px}
.kv-v{font-weight:700;font-variant-numeric:tabular-nums;font-size:15px}
.gp{color:var(--green)}.gn{color:var(--red)}
.pup{display:flex;gap:8px;margin-top:8px}
.pup input{flex:1;border:1px solid var(--line);background:var(--glass);color:var(--text);border-radius:14px;padding:13px;font-size:16px;outline:0;min-width:0}
.pup input:focus{border-color:var(--accent)}
.pup button{border:0;border-radius:14px;padding:0 18px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--accent),var(--violet))}
.pnote{font-size:12.5px;color:var(--dim);font-weight:600;margin-top:8px;line-height:1.4}
.pup-st{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;margin-top:2px}
.pup-st i{width:9px;height:9px;border-radius:50%;background:var(--dim);flex:none}
.pup-st i.live{background:var(--green);animation:xtw 2s ease-in-out infinite}
.pup-st i.err{background:var(--orange)}
.pup .pbtn2{background:var(--glass);border:1px solid var(--line);color:var(--text)}
`;document.head.appendChild(st);
  const tl=document.createElement('div');tl.innerHTML=`<div class="tile t-pea" onclick="PEA.open()"><div class="lrow"><div class="lab">PEA <span data-ic="trend"></span></div><div class="delta" id="pdelta"></div></div><div class="v" id="pval">0 €</div><div id="pspk"></div></div>`;const t=tl.firstElementChild;
  t.querySelector('[data-ic]').innerHTML=ic('trend');
  document.querySelector('.t-or').insertAdjacentElement('afterend',t);
  const md=document.createElement('div');md.innerHTML=`<div class="modal" id="m-pea"><div class="sheet"><div class="grab"></div><button class="xbtn" onclick="closeM()" aria-label="Fermer">✕</button>
  <div class="ct"><h2>Mon PEA</h2><small id="pea-tot" style="font-size:18px"></small></div>
  <div class="seg"><button id="pt-achats" class="on" onclick="PEA.setTab('achats')">Achats</button><button id="pt-stats" onclick="PEA.setTab('stats')">Stats</button></div>
  <div id="l-pea"></div><div class="spacer"></div></div></div>`;const m=md.firstElementChild;
  document.body.appendChild(m);
  /* mêmes gestes que les autres fenêtres : toucher le fond = fermer, tirer la poignée vers le bas = fermer */
  m.addEventListener('click',e=>{if(e.target===m)closeM()});
  const sh=m.querySelector('.sheet');
  [m.querySelector('.grab'),m.querySelector('.sheet>.ct')].forEach(g=>{let y0=0,dy=0;
    g.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;dy=0;sh.style.animation='none';sh.style.transition='none'},{passive:true});
    g.addEventListener('touchmove',e=>{dy=Math.max(0,e.touches[0].clientY-y0);sh.style.transform=`translateY(${dy}px)`},{passive:true});
    g.addEventListener('touchend',()=>{sh.style.transition='transform .25s';if(dy>110)closeM();sh.style.transform='';dy=0;setTimeout(()=>{sh.style.transition='';sh.style.animation=''},300)})})};
PEA.init=()=>{if(PEA.on||!user||user.uid!==PEA_UID)return;
  PEA.on=true;PEA.mount();document.documentElement.classList.add('pea-on');
  if(!data.pea||!Array.isArray(data.pea.orders)){data.pea=PEA.SEED();save()}
  if(!Array.isArray(data.pea.hist))data.pea.hist=[];
  PEA.tabSwap();PEA.draw();
  if(PEA_QUOTE_URL){PEA.refresh();setInterval(PEA.tick,6e4);document.addEventListener('visibilitychange',()=>{if(!document.hidden)PEA.tick()})}};
/* bouton flottant « Courses » -> « PEA » (pour ce compte uniquement) */
PEA.tabSwap=()=>{document.querySelectorAll('.tab').forEach(t=>{if(t.getAttribute('onclick')==="openM('m-cou')"){t.setAttribute('onclick','PEA.open()');t.innerHTML='<span class="i">'+ic('trend')+'</span>PEA'}})};
/* Bourse de Paris : lun-ven 9h00-17h35 (heure de Paris) */
PEA.isMarket=()=>{const o={};new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>o[x.type]=x.value);
  const m=(+o.hour)*60+(+o.minute);return o.weekday!=='Sat'&&o.weekday!=='Sun'&&m>=540&&m<=1055};
/* cours automatique : à l'ouverture de l'appli, puis toutes les heures pendant la séance */
PEA.refresh=async()=>{if(!PEA.on||!PEA_QUOTE_URL||PEA.busy)return;PEA.busy=true;
  try{const r=await fetch(PEA_QUOTE_URL,{cache:'no-store'});if(!r.ok)throw 0;const q=await r.json();if(!(q.price>0))throw 0;
    PEA.q={closes:Array.isArray(q.closes)?q.closes:[]};PEA.lastFetch=Date.now();PEA.err=false;
    const o=data.pea.px,n={last:q.price,prev:q.prev>0?q.prev:o.prev,at:q.date||o.at};
    if(o.last!==n.last||o.prev!==n.prev||o.at!==n.at){data.pea.px=n;save()}else PEA.draw()}
  catch(e){PEA.err=true;PEA.draw()}
  finally{PEA.busy=false}};
PEA.tick=()=>{if(document.hidden||!PEA.isMarket())return;if(Date.now()-(PEA.lastFetch||0)>=36e5-3e4)PEA.refresh()};
/* branchements : ne font RIEN si ce n'est pas ton compte */
const _rPEA=render;render=function(){_rPEA();PEA.draw()};
const _bPEA=boot;boot=function(){_bPEA();PEA.init()};
/* si la connexion était déjà terminée avant le chargement de ce fichier */
if(user&&cur())PEA.init();

window.PEA=PEA;
})();
