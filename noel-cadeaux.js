/* ============================================================================
   Mon Budget · Cadeaux de Noël (Thomas + Annabelle uniquement)
   ----------------------------------------------------------------------------
   - Fichier SÉPARÉ : il ne modifie ni `data`, ni `save()`, ni le document users/{uid}.
   - Stockage : collection Firestore `noel_cadeaux` (1 document par cadeau).
   - Actif seulement en décembre ET pour les 2 UID ci-dessous.
   - Toute erreur est interceptée : l'app continue de fonctionner normalement.
   ========================================================================== */
(function(){
'use strict';
try{
if(typeof render!=='function'||typeof $!=='function'){return}

var COL='noel_cadeaux';
var UIDS={'vpSJLnwZN9gqvAs73xfIzqje72m2':'T','j2gmK01qHhbVpEzgdAuUET1knjf2':'A'};
var NM={T:'Thomas',A:'Annabelle',J:'Joint',B:'Les deux',N:'À décider'};
var CL={T:'#4C8DF6',A:'#E8588F',J:'#1FA463',B:'#1FA463',N:'#8A8FA0'};
var PEN='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';

var S={items:[],unsub:null,key:'',editId:null,acc:'T',pay:'',errShown:false,built:false,tab:'S'};
var fab=null,ov=null,sh=null;

function allowed(){return !!(typeof user!=='undefined'&&user&&UIDS[user.uid]&&typeof db!=='undefined'&&db)}
function active(){return allowed()&&M===11}
function g(id){return document.getElementById(id)}
function money(n){return fmt(Number(n)||0)}

/* ---------- Styles ---------- */
function css(){
 var st=document.createElement('style');st.id='nx-css';
 st.textContent=[
 '.nx-fab{position:fixed;right:16px;bottom:calc(104px + env(safe-area-inset-bottom,0px));width:54px;height:54px;border-radius:50%;border:1px solid rgba(255,211,106,.7);background:linear-gradient(135deg,#D23B47,#A82733);color:#FFE29A;display:grid;place-items:center;z-index:1100;box-shadow:0 10px 26px rgba(0,0,0,.4),0 0 18px rgba(255,190,70,.25);cursor:pointer;transition:transform .2s;padding:0}',
 '.nx-fab[hidden]{display:none!important}.nx-fab:active{transform:scale(.92)}.nx-fab .ic{width:26px;height:26px}',
 '.nx-fab b{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;border-radius:10px;background:#FFD36A;color:#5A1A1F;font-size:11px;font-weight:800;display:grid;place-items:center;padding:0 5px}.nx-fab b:empty{display:none}',
 '.nm{display:none;position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.6);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);align-items:flex-end;justify-content:center}.nm.open{display:flex}',
 '.sheet>.nscroll{flex:1 1 auto;min-height:0;min-width:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-bottom:8px}',
 '.nm .ct h2{display:flex;align-items:center;gap:8px}.nm .ct h2 .ic{width:24px;height:24px;color:#6BE3A0}',
 '.nseg{display:flex;background:var(--glass);border:1px solid var(--line);border-radius:14px;padding:3px;gap:3px}',
 '.nseg button{flex:1;min-width:0;border:0;background:none;color:var(--dim);font-size:13px;font-weight:700;padding:9px 2px;border-radius:11px;white-space:nowrap}',
 '.nseg button.on{background:#2FA866;color:#fff}',
 '.nseg.c button.on[data-v=T]{background:#4C8DF6}.nseg.c button.on[data-v=A]{background:#E8588F}.nseg.c button.on[data-v=J],.nseg.c button.on[data-v=B]{background:#1FA463}',
 '.nl{font-size:12px;font-weight:700;color:var(--dim);margin:14px 0 6px}',
 '.nft{font-size:15px;font-weight:800;margin-top:16px}',
 '.ni{width:100%;border:1px solid var(--line);background:var(--glass);color:var(--text);border-radius:14px;padding:13px;font-size:16px;outline:0;min-width:0}.ni:focus{border-color:var(--accent)}',
 '.nerr{font-size:13px;color:var(--red);min-height:16px;margin-top:8px;font-weight:600}',
 '.nbtn{width:100%;margin-top:10px;border:0;border-radius:16px;padding:14px;font-size:16px;font-weight:800;color:#fff;background:linear-gradient(135deg,#2FA866,#1E8A52)}',
 '.nbtn2{width:100%;margin-top:8px;border:1px solid var(--line);background:transparent;border-radius:16px;padding:12px;font-weight:700;color:var(--dim);font-size:15px}.nbtn2.red{color:var(--red)}',
 '.nr{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 8px;margin:0;border-top:1px solid var(--line);border-radius:12px;cursor:pointer;-webkit-tap-highlight-color:transparent}.nr:first-child{border-top:0}',
 '.nr.ed{background:rgba(47,168,102,.16)}.nrt{font-size:15px;font-weight:600;overflow-wrap:anywhere}.nra{display:flex;align-items:center;gap:10px;flex:none;font-weight:800}.nra .ic{width:16px;height:16px;color:var(--dim)}',
 '.nb{display:inline-block;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:6px;margin:4px 5px 0 0;color:#fff}',
 '.nb-T{background:#4C8DF6}.nb-A{background:#E8588F}.nb-J,.nb-B{background:#1FA463}.nb-N{background:#8A8FA0}',
 '.ng{background:var(--glass);border:1px solid var(--line);border-radius:22px;padding:16px;margin-top:12px}.ng h3{font-size:16px;font-weight:800;margin-bottom:2px}',
 '.nhero{border-radius:24px;padding:20px;margin-top:14px;color:#fff;background:linear-gradient(120deg,#B3303C,#D23B47,#8F2431);border:1px solid rgba(255,211,106,.45)}',
 '.nhero .v{font-size:36px;font-weight:900;letter-spacing:-1.5px;font-variant-numeric:tabular-nums}',
 '.nhb{margin:12px 0;font-size:14px;font-weight:600}.nhb div{display:flex;justify-content:space-between}.nbar{height:8px;border-radius:8px;background:var(--line);overflow:hidden;margin-top:6px}.nbar i{display:block;height:100%;border-radius:8px}',
 '.nempty{color:var(--dim);font-size:14px;text-align:center;padding:14px 0}.nnote{font-size:12px;color:var(--dim);margin-top:10px}'
 ].join('');
 document.head.appendChild(st);
}

/* ---------- Interface ---------- */
function build(){
 if(S.built)return;S.built=true;css();
 fab=document.createElement('button');fab.className='nx-fab';fab.hidden=true;fab.setAttribute('aria-label','Cadeaux de Noël');
 fab.innerHTML=ic('gift')+'<b id="nx-n"></b>';
 fab.onclick=openM;document.body.appendChild(fab);

 ov=document.createElement('div');ov.className='nm';ov.id='nx-m';
 ov.innerHTML='<div class="sheet" id="nx-sh"><div class="grab"></div><button class="xbtn" id="nx-x" aria-label="Fermer">✕</button>'
 +'<div class="ct"><h2 id="nx-h"></h2><small id="nx-tot" style="color:var(--orange);font-size:18px"></small></div>'
 +'<div class="nseg" id="nx-tabs"><button type="button" class="on" data-p="S">Saisie</button><button type="button" data-p="T">Stats</button></div>'
 +'<div class="nscroll" id="nx-sc">'
 +'<div id="nx-pS">'
 +'<div class="nft" id="nx-ft">Ajouter un cadeau</div>'
 +'<div class="nl">Pour qui ?</div><input class="ni" id="nx-who" placeholder="Maman" enterkeyhint="next" autocomplete="off">'
 +'<div class="nl">Cadeau (facultatif)</div><input class="ni" id="nx-gift" placeholder="Parfum" enterkeyhint="next" autocomplete="off">'
 +'<div class="nl">Combien ?</div><input class="ni" id="nx-amt" type="number" step="0.01" inputmode="decimal" placeholder="50,00" enterkeyhint="done">'
 +'<div class="nl">Acheté sur le compte</div><div class="nseg c" id="nx-acc"><button type="button" data-v="T">Thomas</button><button type="button" data-v="A">Annabelle</button><button type="button" data-v="J">Joint</button></div>'
 +'<div class="nl">Qui paie au final ? (facultatif)</div><div class="nseg c" id="nx-pay"><button type="button" data-v="T">Thomas</button><button type="button" data-v="A">Annabelle</button><button type="button" data-v="B">Les deux</button></div>'
 +'<div class="nerr" id="nx-err"></div>'
 +'<button type="button" class="nbtn" id="nx-save"></button>'
 +'<button type="button" class="nbtn2" id="nx-cancel" hidden>Annuler la modification</button>'
 +'<button type="button" class="nbtn2 red" id="nx-del" hidden>Supprimer ce cadeau</button>'
 +'<div class="nl" style="margin-top:22px">Cadeaux saisis · touche une ligne pour la modifier</div><div id="nx-list"></div>'
 +'</div><div id="nx-pT" hidden></div></div></div>';
 document.body.appendChild(ov);sh=g('nx-sh');

 g('nx-x').onclick=closeM;
 ov.addEventListener('click',function(e){if(e.target===ov)closeM()});
 addEventListener('keydown',function(e){if(e.key==='Escape'&&ov.classList.contains('open'))closeM()});
 g('nx-tabs').addEventListener('click',function(e){var b=e.target.closest('button');if(b)tab(b.dataset.p)});
 g('nx-acc').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.acc=b.dataset.v;seg()});
 g('nx-pay').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;S.pay=(S.pay===b.dataset.v)?'':b.dataset.v;seg()});
 g('nx-list').addEventListener('click',function(e){var r=e.target.closest('.nr');if(r)edit(r.dataset.id)});
 g('nx-save').onclick=save;g('nx-cancel').onclick=function(){reset();draw()};g('nx-del').onclick=remove;
 g('nx-who').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();g('nx-gift').focus()}});
 g('nx-gift').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();g('nx-amt').focus()}});
 g('nx-amt').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();save()}});
 ['nx-who','nx-gift','nx-amt'].forEach(function(i){g(i).addEventListener('input',function(){g('nx-err').textContent=''})});

 /* tirer la poignée vers le bas = fermer */
 var gb=sh.querySelector('.grab'),y0=0,dy=0;
 gb.addEventListener('touchstart',function(e){y0=e.touches[0].clientY;dy=0;sh.style.animation='none';sh.style.transition='none'},{passive:true});
 gb.addEventListener('touchmove',function(e){dy=Math.max(0,e.touches[0].clientY-y0);sh.style.transform='translateY('+dy+'px)'},{passive:true});
 gb.addEventListener('touchend',function(){sh.style.transition='transform .25s';if(dy>110)closeM();sh.style.transform='';dy=0;setTimeout(function(){sh.style.transition='';sh.style.animation=''},300)});

 /* clavier mobile : la fenêtre se cale sur la zone visible */
 var vv=window.visualViewport;
 if(vv){vv.addEventListener('resize',fit);vv.addEventListener('scroll',fit)}
 ov.addEventListener('focusin',function(e){if(e.target.tagName==='INPUT')setTimeout(function(){fit();try{e.target.scrollIntoView({block:'nearest'})}catch(x){}},350)});
 reset();
}
function fit(){
 var vv=window.visualViewport;if(!ov||!ov.classList.contains('open')||!vv)return;
 ov.style.top=vv.offsetTop+'px';ov.style.height=vv.height+'px';ov.style.bottom='auto';
 var kb=innerHeight-vv.height>120;sh.style.maxHeight=Math.max(260,kb?vv.height-14:vv.height*.88)+'px';
}
function openM(){build();tab('S');ov.classList.add('open');document.body.classList.add('lock');try{buzz()}catch(e){}fit();draw()}
function closeM(){if(!ov)return;ov.classList.remove('open');ov.style.top=ov.style.height=ov.style.bottom='';sh.style.maxHeight='';document.body.classList.remove('lock');reset()}
function tab(p){S.tab=p;g('nx-pS').hidden=p!=='S';g('nx-pT').hidden=p!=='T';
 g('nx-tabs').querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.p===p)});g('nx-sc').scrollTop=0;draw()}
function seg(){
 g('nx-acc').querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.v===S.acc)});
 g('nx-pay').querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.v===S.pay)});
}

/* ---------- Saisie / modification ---------- */
function reset(){
 S.editId=null;S.acc=(allowed()&&UIDS[user.uid])||S.acc||'T';S.pay='';
 ['nx-who','nx-gift','nx-amt'].forEach(function(i){if(g(i))g(i).value=''});
 if(g('nx-err'))g('nx-err').textContent='';
 mode();seg();
}
function mode(){
 var e=!!S.editId;
 g('nx-ft').textContent=e?'Modifier le cadeau':'Ajouter un cadeau';
 g('nx-save').innerHTML=e?'Enregistrer les modifications':(ic('check')+' Ajouter le cadeau');
 g('nx-cancel').hidden=!e;g('nx-del').hidden=!e;
}
function edit(id){
 var it=S.items.filter(function(x){return x.id===id})[0];if(!it)return;
 S.editId=id;S.acc=it.account||'T';S.pay=it.payer||'';
 g('nx-who').value=it.who||'';g('nx-gift').value=it.gift||'';g('nx-amt').value=it.amount;
 g('nx-err').textContent='';mode();seg();draw();g('nx-sc').scrollTop=0;try{buzz()}catch(e){}
}
function fail(e){console.warn('[noel]',e);toast('Erreur de sauvegarde')}
function save(){
 var who=g('nx-who').value.trim(),gift=g('nx-gift').value.trim(),amt=parseFloat(String(g('nx-amt').value).replace(',','.')),er=g('nx-err');
 if(!who){er.textContent='Indique pour qui est le cadeau.';g('nx-who').focus();return}
 if(!(amt>0)){er.textContent='Entre un montant.';g('nx-amt').focus();return}
 amt=Math.round(amt*100)/100;
 var rec={who:who,gift:gift,amount:amt,account:S.acc,payer:S.pay};
 var wasEdit=!!S.editId;
 if(S.editId){
  var up=Object.assign({},rec,{updatedAt:Date.now(),updatedBy:user.uid});
  db.collection(COL).doc(S.editId).update(up).catch(fail);
  toast('Cadeau modifié');
 }else{
  var ref=db.collection(COL).doc();
  ref.set(Object.assign({year:Y},rec,{createdAt:Date.now(),by:user.uid})).catch(fail);
  toast('Ajouté : '+who+' '+money(amt),function(){ref.delete().catch(fail)});
 }
 var keep=S.acc;reset();S.acc=keep;seg();try{buzz()}catch(e){}
 try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur()}catch(e){}
}
function remove(){
 var id=S.editId,it=S.items.filter(function(x){return x.id===id})[0];if(!it)return;
 var copy=Object.assign({},it);delete copy.id;
 db.collection(COL).doc(id).delete().catch(fail);
 reset();try{buzz()}catch(e){}
 toast('Supprimé',function(){db.collection(COL).doc(id).set(copy).catch(fail)});
}

/* ---------- Affichage ---------- */
function bars(o,keys){
 var m=Math.max.apply(null,keys.map(function(k){return o[k]||0}).concat([1]));
 return keys.map(function(k){var v=o[k]||0;
  return '<div class="nhb"><div><span>'+NM[k]+'</span><span>'+money(v)+'</span></div><div class="nbar"><i style="width:'+(v/m*100)+'%;background:'+CL[k]+'"></i></div></div>'}).join('');
}
function draw(){
 if(!fab)return;
 var L=S.items,n=L.length,tot=L.reduce(function(a,x){return a+(Number(x.amount)||0)},0);
 var nb=g('nx-n');if(nb)nb.textContent=n?String(n):'';
 if(!ov.classList.contains('open'))return;
 g('nx-h').innerHTML=ic('tree')+' Noël '+Y;g('nx-tot').textContent=money(tot);
 if(S.editId&&!L.some(function(x){return x.id===S.editId})){reset()}
 if(S.tab==='S'){
  var sorted=L.slice().sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0)});
  g('nx-list').innerHTML=sorted.length?sorted.map(function(x){var y=x.payer||'N';
   return '<div class="nr'+(x.id===S.editId?' ed':'')+'" data-id="'+esc(x.id)+'"><div><div class="nrt">'+esc(x.who||'')+(x.gift?' · '+esc(x.gift):'')+'</div><div><span class="nb nb-'+x.account+'">Compte '+NM[x.account]+'</span><span class="nb nb-'+y+'">Paie : '+NM[y]+'</span></div></div><div class="nra"><span>'+money(x.amount)+'</span>'+PEN+'</div></div>'}).join(''):'<p class="nempty">Aucun cadeau pour l’instant.</p>';
 }else{
  var ppl={},acc={},pay={T:0,A:0,N:0};
  L.forEach(function(x){var a=Number(x.amount)||0;ppl[x.who]=(ppl[x.who]||0)+a;acc[x.account]=(acc[x.account]||0)+a;
   if(x.payer==='B'){pay.T+=a/2;pay.A+=a/2}else if(x.payer==='T'||x.payer==='A')pay[x.payer]+=a;else pay.N+=a});
  var names=Object.keys(ppl).sort(function(a,b){return ppl[b]-ppl[a]}),mx=Math.max.apply(null,names.map(function(k){return ppl[k]}).concat([1]));
  g('nx-pT').innerHTML=n?
   '<div class="nhero"><div style="font-size:13px;font-weight:700;opacity:.9">Total des cadeaux</div><div class="v">'+money(tot)+'</div><div style="font-size:13px;opacity:.9">'+n+' cadeau'+(n>1?'x':'')+' · '+names.length+' personne'+(names.length>1?'s':'')+'</div></div>'
   +'<div class="ng"><h3>Sur quels comptes</h3>'+bars(acc,['T','A','J'])+'</div>'
   +'<div class="ng"><h3>Qui paie au final</h3>'+bars(pay,['T','A','N'])+'<div class="nnote">« Les deux » compte pour moitié chacun.</div></div>'
   +'<div class="ng"><h3>Par personne</h3>'+names.map(function(k){return '<div class="nhb"><div><span>'+esc(k)+'</span><span>'+money(ppl[k])+'</span></div><div class="nbar"><i style="width:'+(ppl[k]/mx*100)+'%;background:#FFD36A"></i></div></div>'}).join('')+'</div>'
   :'<p class="nempty">Ajoute un premier cadeau pour voir les stats.</p>';
 }
}

/* ---------- Synchronisation Firestore (temps réel, collection séparée) ---------- */
function unsub(){if(S.unsub){try{S.unsub()}catch(e){}}S.unsub=null;S.key='';S.items=[]}
function sub(){
 var k=String(Y);if(S.unsub&&S.key===k)return;
 unsub();S.key=k;
 S.unsub=db.collection(COL).where('year','==',Y).onSnapshot(function(snap){
  S.items=snap.docs.map(function(d){return Object.assign({id:d.id},d.data())});draw();
 },function(err){
  console.warn('[noel]',err);S.items=[];
  if(!S.errShown){S.errShown=true;toast('Cadeaux indisponibles pour le moment')}draw();
 });
}
function sync(){
 if(active()){build();if(fab.hidden)fab.hidden=false;sub()}
 else{if(fab)fab.hidden=true;if(ov&&ov.classList.contains('open'))closeM();unsub();if(fab)draw()}
}

var _r=render;
render=function(){_r.apply(this,arguments);try{sync()}catch(e){console.warn('[noel]',e)}};
try{sync()}catch(e){console.warn('[noel]',e)}
}catch(e){console.warn('[noel] désactivé :',e)}
})();
