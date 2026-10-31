/* Simulador de mapas de Karnaugh: Quine-McCluskey, mapa, circuito y tabla de verdad */
const $=s=>document.querySelector(s),L='ABCDE',COL=['#b5483a','#2f6aa3','#3f8352','#b7862b','#7a5aa0','#2d8a8f','#a24b7c','#7f9a2f','#c06a30','#53589e'];
let n=4,mode='sop',hl=null,st=[],plain='',last=-1;
const gray=k=>k==1?[0,1]:[0,1,3,2],bin=(v,k)=>v.toString(2).padStart(k,'0'),pc=x=>{let c=0;while(x){c+=x&1;x>>=1}return c};
const cv=(t,x)=>(x&~t[1])===t[0];
function qm(a){let cur=new Map(),P=[];a.forEach(x=>cur.set(x+'_0',[x,0]));
 while(cur.size){const A=[...cur.values()],u=new Set(),nx=new Map();
  for(let i=0;i<A.length;i++)for(let j=i+1;j<A.length;j++){const[x,xm]=A[i],[y,ym]=A[j];if(xm!==ym)continue;const d=x^y;
   if(d&&!(d&(d-1))){const v=x&~d;nx.set(v+'_'+(xm|d),[v,xm|d]);u.add(i);u.add(j)}}
  A.forEach((t,i)=>{if(!u.has(i))P.push(t)});cur=nx}
 return P}
function minimize(T,D){if(!T.length)return[];const P=qm([...T,...D]),sel=[],rem=new Set(T);
 T.forEach(x=>{const c=P.filter(t=>cv(t,x));if(c.length==1&&!sel.includes(c[0]))sel.push(c[0])});
 sel.forEach(t=>T.forEach(x=>cv(t,x)&&rem.delete(x)));
 while(rem.size){let b=null,bs=-1;P.forEach(t=>{if(sel.includes(t))return;const s=[...rem].filter(x=>cv(t,x)).length*10+pc(t[1]);if(s>bs){bs=s;b=t}});
  sel.push(b);[...rem].forEach(x=>cv(b,x)&&rem.delete(x))}
 return sel}
function lits(t){const r=[];for(let i=0;i<n;i++){const b=1<<(n-1-i);if(t[1]&b)continue;const one=!!(t[0]&b);r.push([L[i],mode=='sop'?!one:one])}return r}
const lh=l=>l[1]?`<i class="o">${l[0]}</i>`:l[0],lp=l=>l[0]+(l[1]?"'":"");
const termH=t=>{const l=lits(t);return mode=='sop'?l.map(lh).join(''):'('+l.map(lh).join(' + ')+')'};
const termP=t=>{const l=lits(t);return mode=='sop'?l.map(lp).join(''):'('+l.map(lp).join(' + ')+')'};
function cell(i,mem){const v=st[i],cl='c '+['v0','v1','vx'][v]+(hl!==null?(mem.includes(hl)?' lit':' dim'):'')+(i==last?' pop':'');
 return `<button class="${cl}" data-i="${i}"${mem.length?` style="--g:${COL[mem[0]%10]}"`:''} aria-label="m${i} = ${'01X'[v]}"><b>${'01X'[v]}</b><small>${i}</small><span class="d">${mem.map(k=>`<s style="background:${COL[k%10]}"></s>`).join('')}</span></button>`}
function G(x,y,w,h,and){return and?`M${x} ${y}H${x+w-h/2}A${h/2} ${h/2} 0 0 1 ${x+w-h/2} ${y+h}H${x}Z`:`M${x} ${y}Q${x+w*.3} ${y+h/2} ${x} ${y+h}Q${x+w*.7} ${y+h} ${x+w} ${y+h/2}Q${x+w*.7} ${y} ${x} ${y}Z`}
function circuit(sel,T,free){const box=$('#cir');
 if(!T.length||free){box.innerHTML=`<p class="hint">La función es la constante <b>${(mode=='sop')==!T.length?0:1}</b>: no necesita compuertas.</p>`;return}
 const sop=mode=='sop',K=sel.length,gx=n*24+60,rowH=76,gh=44,H=K*rowH+40,fh=Math.max(48,K*18),fw=22+fh/2,fx=gx+44+90,W=fx+fw+90;
 let s='';const p=(d,c,col)=>s+=`<path class="w0 ${c}" d="${d}" style="${col?`stroke:${col};`:''}"/>`;
 for(let i=0;i<n;i++){const x=24+i*24;p(`M${x} 30V${H-10}`,'b');s+=`<text x="${x}" y="18" text-anchor="middle" class="t">${L[i]}</text>`}
 const outs=[],cy=24+gh/2+(K-1)*rowH/2;
 sel.forEach((t,k)=>{const ls=lits(t),m=ls.length,gy=24+k*rowH,col=COL[k%10];
  ls.forEach((l,j)=>{const y=m==1?gy+gh/2:gy+(j+1)*gh/(m+1),x=24+L.indexOf(l[0])*24;
   p(`M${x} ${y}H${gx-(l[1]?8:0)}`,'',col);s+=`<circle cx="${x}" cy="${y}" r="3" class="dt"/>`;if(l[1])s+=`<circle cx="${gx-4}" cy="${y}" r="4" class="bb"/>`});
  if(m>1){p(G(gx,gy,44,gh,sop),'g',col);outs.push([gx+44,gy+gh/2,col])}else outs.push([gx,gy+gh/2,col])});
 let ex;
 if(K>1){const fy=cy-fh/2;p(G(fx,fy,fw,fh,!sop),'g','var(--tx)');
  outs.forEach((o,j)=>{const y=fy+(j+1)*fh/(K+1),mx=o[0]+22+j*5;p(`M${o[0]} ${o[1]}H${mx}V${y}H${fx}`,'',o[2])});ex=fx+fw}else ex=outs[0][0];
 p(`M${ex} ${cy}H${ex+50}`,'','var(--tx)');s+=`<text x="${ex+60}" y="${cy+5}" class="t" style="font-size:18px">F</text>`;
 box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}">${s}</svg>`}
function render(){const ones=[],zer=[],dcs=[];st.forEach((v,i)=>(v==1?ones:v==2?dcs:zer).push(i));
 const T=mode=='sop'?ones:zer,sel=minimize(T,dcs),N=1<<n;
 const mem=Array.from({length:N},(_,i)=>sel.map((t,k)=>cv(t,i)?k:-1).filter(k=>k>=0));
 const lay=n==5?2:1,m=n==5?4:n,rb=m>>1,cb=m-rb,off=n==5?1:0,Rr=gray(rb),Cc=gray(cb);let h='';
 for(let y=0;y<lay;y++){h+=`<div class="lay">${n==5?`<h3>A = ${y}</h3>`:''}<div class="map" style="--c:${Cc.length}"><div class="h">${L.slice(off,off+rb)}\\${L.slice(off+rb,n)}</div>`;
  Cc.forEach(c=>h+=`<div class="h">${bin(c,cb)}</div>`);
  Rr.forEach(r=>{h+=`<div class="h">${bin(r,rb)}</div>`;Cc.forEach(c=>{const i=y<<m|r<<cb|c;h+=cell(i,mem[i])})});h+='</div></div>'}
 $('#maps').innerHTML=h;last=-1;
 const free=sel.some(t=>t[1]==N-1);let ex,pl;
 if(!T.length||free){ex=pl=(mode=='sop')==!T.length?'0':'1'}else{ex=sel.map(termH).join(mode=='sop'?' + ':'');pl=sel.map(termP).join(mode=='sop'?' + ':' · ')}
 plain='F = '+pl;$('#res').innerHTML='F = '+ex;
 $('#rl').textContent=mode=='sop'?'Suma de productos (SOP) mínima':'Producto de sumas (POS) mínimo';
 $('#chips').innerHTML=sel.map((t,k)=>`<button class="chip" data-k="${k}" aria-pressed="${hl===k}" style="--g:${COL[k%10]}"><span class="dot" style="background:${COL[k%10]}"></span>${termH(t)||'1'}<em>${mem.filter(a=>a.includes(k)).length} celdas</em></button>`).join('');
 const opp=mode=='sop'?zer:ones,good=T.every(x=>mem[x].length)&&opp.every(x=>!mem[x].length),nl=sel.reduce((s,t)=>s+n-pc(t[1]),0);
 $('#st').innerHTML=[['Unos',ones.length],['Ceros',zer.length],['X',dcs.length],['Grupos',sel.length],['Literales',nl]].map(a=>`<div class="k"><b>${a[1]}</b><span>${a[0]}</span></div>`).join('')+`<div class="k ${good?'ok':'bad'}"><b>${good?'✓':'✗'}</b><span>${good?'Verificado':'Error'}</span></div>`;
 if(document.activeElement!==$('#mi')&&document.activeElement!==$('#di')){$('#mi').value=ones.join(',');$('#di').value=dcs.join(',')}
 circuit(sel,T,free);
 let t=`<table><tr>${[...L.slice(0,n)].map(c=>`<th>${c}</th>`).join('')}<th>F</th></tr>`;
 for(let i=0;i<N;i++)t+=`<tr><td>${[...bin(i,n)].join('</td><td>')}</td><td><button data-i="${i}" class="${['','v1','vx'][st[i]]}">${'01X'[st[i]]}</button></td></tr>`;
 $('#tt').innerHTML=t+'</table>'}
function setN(k){n=k;st=Array(1<<n).fill(0);hl=null;document.querySelectorAll('#nv button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.n==k));render()}
$('#nv').innerHTML=[2,3,4,5].map(k=>`<button data-n="${k}" aria-pressed="${k==n}">${k}</button>`).join('');
$('#nv').onclick=e=>{const b=e.target.closest('button');if(b)setN(+b.dataset.n)};
$('#md').onclick=e=>{const b=e.target.closest('button');if(!b)return;mode=b.dataset.m;hl=null;document.querySelectorAll('#md button').forEach(x=>x.setAttribute('aria-pressed',x==b));render()};
const cyc=e=>{const b=e.target.closest('button[data-i]');if(!b)return;const i=+b.dataset.i;st[i]=(st[i]+1)%3;render();last=i;const c=document.querySelector(`#maps [data-i="${i}"]`);c&&c.classList.add('pop')};
$('#maps').onclick=cyc;$('#tt').onclick=cyc;
$('#chips').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;const k=+b.dataset.k;hl=hl===k?null:k;render()};
const parse=s=>[...new Set(s.split(/[^0-9]+/).filter(Boolean).map(Number).filter(x=>x<1<<n))];
$('#mi').oninput=$('#di').oninput=()=>{st.fill(0);parse($('#mi').value).forEach(x=>st[x]=1);parse($('#di').value).forEach(x=>st[x]=2);hl=null;render()};
const EX={2:[[0,1,3],[]],3:[[0,1,2,5,6,7],[]],4:[[0,1,2,5,8,9,10,13],[7]],5:[[0,1,2,3,8,9,10,11,16,17,24,25,29,31],[12,20]]};
$('#ex').onclick=()=>{st.fill(0);EX[n][0].forEach(x=>st[x]=1);EX[n][1].forEach(x=>st[x]=2);hl=null;render()};
$('#rn').onclick=()=>{st=st.map(()=>{const r=Math.random();return r<.4?1:r<.47?2:0});hl=null;render()};
$('#cl').onclick=()=>{st.fill(0);hl=null;render()};
$('#cp').onclick=async()=>{try{await navigator.clipboard.writeText(plain);$('#cp').textContent='Copiado'}catch(e){$('#cp').textContent='Copia manual'}setTimeout(()=>$('#cp').textContent='Copiar',1500)};
setN(4);$('#ex').click();