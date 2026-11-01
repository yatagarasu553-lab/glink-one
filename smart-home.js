(()=>{
"use strict";
const $=id=>document.getElementById(id);
const catalog=[["printDocs","書類印刷","書類 印刷 PDF"],["cbCalc","CB計算","特典 キャッシュバック"],["reports","日報入力","日報 活動報告"],["register","個別実績","契約 登録"],["leads","見込み管理","再来店 カレンダー"],["ranking","ランキング","順位"],["monthlyArchive","月別分析","グラフ 月間"],["reportImage","活動報告画像","PNG"],["announcements","お知らせ","連絡"],["team","チーム共有","同期"],["mypage","マイページ","プロフィール"],["pushSettings","iPhone通知","通知"],["login","ログイン","アカウント"],["paste","店舗報告コピペ","店舗日報","admin"],["analytics","店舗分析","分析","admin"],["staffGoals","個人目標","目標","admin"],["settings","店舗設定","管理者","admin"]];
const defaults=["printDocs","cbCalc","reports","register","leads","ranking"];
const glyphs={monthlyArchive:"▥",reportImage:"▧",announcements:"◉",team:"☁",mypage:"♙",pushSettings:"♧",login:"🔐",paste:"▣",analytics:"▥",staffGoals:"◎",settings:"⚙"};
const admin=()=>{try{return typeof activeRole!=="undefined"&&activeRole==="admin"}catch{return false}};
const isSP=()=>{try{return typeof activeRole!=="undefined"&&activeRole==="sp"}catch{return false}};
const allowed=id=>{const f=catalog.find(x=>x[0]===id);return !!f&&!(isSP()&&id==="reportImage")&&(!f[3]||admin())};
const key=kind=>{let user="guest";try{if(typeof cloudSession!=="undefined"&&cloudSession?.user?.id)user=cloudSession.user.id}catch{}return "glink-smart-"+kind+"-v1-"+user};
const read=(kind,fallback)=>{try{return JSON.parse(localStorage.getItem(key(kind))||"null")??fallback}catch{return fallback}};
const save=(kind,v)=>{try{localStorage.setItem(key(kind),JSON.stringify(v))}catch(e){console.warn("Smart preference",e)}};
const open=id=>{if(allowed(id)&&typeof navigate==="function")navigate(id)};
function search(){
const area=$("gsmartSearchResults"),q=$("gsmartSearch")?.value.trim().toLowerCase()||"";if(!area)return;area.replaceChildren();area.hidden=!q;if(!q)return;
const found=catalog.filter(x=>allowed(x[0])&&(x[1]+" "+x[2]).toLowerCase().includes(q)).slice(0,10);
if(!found.length){area.textContent="該当する機能がありません";return}
for(const item of found){const b=document.createElement("button");b.type="button";b.textContent=item[1]+"　›";b.addEventListener("click",()=>{$("gsmartSearch").value="";search();open(item[0])});area.appendChild(b)}
}
function addMissingFeatures(){
const grid=document.querySelector("#home .home-workspace-grid");if(!grid)return;
const existing=new Set(items().map(x=>x.id));
for(const f of catalog){if(existing.has(f[0]))continue;
 const b=document.createElement("button");b.type="button";b.dataset.smartPage=f[0];
 const icon=document.createElement("span");icon.className="gsmart-dynamic-icon";icon.textContent=glyphs[f[0]]||"▦";
 const name=document.createElement("b");name.textContent=f[1];const hint=document.createElement("small");hint.textContent=f[2].split(" ")[0]+"を開く";
 b.append(icon,name,hint);b.onclick=()=>open(f[0]);grid.appendChild(b);
}}
function migrateLegacy(){
let prior=null,stored=null;try{prior=JSON.parse(localStorage.getItem("glink-quick-shortcuts-v1")||"null")}catch{}
try{stored=JSON.parse(localStorage.getItem(key("workspace"))||"null")}catch{}
if(stored&&Array.isArray(stored.order)&&stored.order.includes("monthlyArchive"))return;
const ids=catalog.map(x=>x[0]),legacy=Array.isArray(prior)?prior.filter(x=>ids.includes(x)):[];
const priorOrder=Array.isArray(stored?.order)?stored.order.filter(x=>ids.includes(x)):[];
const priorHidden=Array.isArray(stored?.hidden)?stored.hidden.filter(x=>ids.includes(x)):[];
const visible=[...new Set([...legacy,...priorOrder.filter(x=>!priorHidden.includes(x)),...defaults])];
const order=[...new Set([...legacy,...priorOrder,...defaults,...ids])];
save("workspace",{order,hidden:ids.filter(x=>!visible.includes(x)),pins:[]});
}
function items(){
const grid=document.querySelector("#home .home-workspace-grid");if(!grid)return [];
return [...grid.children].filter(x=>x.tagName==="BUTTON").map(button=>({button,id:button.dataset.smartPage||(button.getAttribute("onclick")||"").split("navigate('")[1]?.split("'")[0]})).filter(x=>x.id)
}
function cfg(){
const ids=items().map(x=>x.id),stored=read("workspace",{}),order=Array.isArray(stored.order)?stored.order.filter(x=>ids.includes(x)):defaults.filter(x=>ids.includes(x)),hidden=Array.isArray(stored.hidden)?stored.hidden.filter(x=>ids.includes(x)):ids.filter(x=>!defaults.includes(x));
const pins=Array.isArray(stored.pins)?stored.pins.filter(x=>ids.includes(x)).slice(0,3):[];return {order:[...new Set([...order,...ids])],hidden,pins};
}
function apply(){
const grid=document.querySelector("#home .home-workspace-grid");if(!grid)return;const list=items(),c=cfg();
for(const id of [...c.pins,...c.order.filter(x=>!c.pins.includes(x))]){const item=list.find(x=>x.id===id);if(!item)continue;item.button.dataset.smartPage=id;grid.appendChild(item.button);const hide=c.hidden.includes(id)||!allowed(id);item.button.hidden=hide;item.button.style.display=hide?"none":"";item.button.classList.toggle("gsmart-pinned",c.pins.includes(id));}
editor();
}
function editor(){
const root=$("gsmartEditorDetails"),area=$("gsmartWorkspaceOptions");if(!root?.open||!area)return;
area.replaceChildren();const c=cfg();
const shown=[...c.pins,...c.order.filter(x=>!c.pins.includes(x))].filter(allowed);
for(const [i,id] of shown.entries()){
const row=document.createElement("div");row.className="gsmart-workspace-row";
const label=document.createElement("label"),check=document.createElement("input");check.type="checkbox";check.checked=!c.hidden.includes(id);
check.addEventListener("change",()=>{const v=cfg();v.hidden=check.checked?v.hidden.filter(x=>x!==id):[...new Set([...v.hidden,id])];save("workspace",v);apply()});
label.append(check,document.createTextNode(" "+(catalog.find(x=>x[0]===id)?.[1]||id)));row.appendChild(label);
const group=document.createElement("div");
for(const step of [-1,1]){const b=document.createElement("button");b.type="button";b.textContent=step<0?"↑":"↓";b.disabled=i+step<0||i+step>=shown.length;b.addEventListener("click",()=>{const v=cfg(),shown=[...v.pins,...v.order.filter(x=>!v.pins.includes(x))].filter(allowed),n=shown.indexOf(id);if(n<0||n+step<0||n+step>=shown.length)return;const other=v.order.indexOf(shown[n+step]),own=v.order.indexOf(id);[v.order[own],v.order[other]]=[v.order[other],v.order[own]];save("workspace",v);apply()});group.appendChild(b)}
const pin=document.createElement("button");pin.type="button";pin.className="gsmart-pin";pin.textContent=c.pins.includes(id)?"★":"☆";pin.title="上部に固定（最大3件）";pin.setAttribute("aria-label",c.pins.includes(id)?"ピン留め解除":"ピン留め");
pin.onclick=()=>{const v=cfg();v.pins=v.pins.filter(x=>x!==id);if(!c.pins.includes(id)){if(v.pins.length>=3){alert("ピン留めは最大3件です");return}v.pins.push(id)}v.hidden=v.hidden.filter(x=>x!==id);save("workspace",v);apply()};group.appendChild(pin);
row.appendChild(group);area.appendChild(row);
}
}
function recent(){
const box=$("gsmartRecent"),area=$("gsmartRecentItems");if(!box||!area)return;
const r=read("recent",[]),ids=Array.isArray(r)?r.filter(allowed).slice(0,4):[];area.replaceChildren();box.hidden=!ids.length;
for(const id of ids){const b=document.createElement("button");b.type="button";b.textContent=(catalog.find(x=>x[0]===id)?.[1]||id)+" ›";b.onclick=()=>open(id);area.appendChild(b)}
}

function columns(){
 const n=read("columns",3)===2?2:3;
 const grid=document.querySelector("#home .home-workspace-grid");
 if(grid){grid.classList.toggle("gsmart-three",n===3);grid.classList.toggle("gsmart-two",n===2)}
 const select=$("gsmartColumns");if(select)select.value=String(n);
}
function pointerSorting(){
 const grid=document.querySelector("#home .home-workspace-grid");if(!grid)return;
 let timer=null,active=null,origin=null,used=false;
 function clear(){if(timer){clearTimeout(timer);timer=null}}
 grid.addEventListener("pointerdown",e=>{
  const b=e.target.closest("button[data-smart-page]");if(!b||b.hidden||e.button!==0)return;
  origin={button:b,x:e.clientX,y:e.clientY,pointerId:e.pointerId};
  clear();timer=setTimeout(()=>{
   if(!origin)return;
   active=origin.button;active.classList.add("gsmart-dragging");used=true;
   if(navigator.vibrate)try{navigator.vibrate(15)}catch{}
  },480);
 },{passive:true});
 grid.addEventListener("pointermove",e=>{
  if(!origin||origin.pointerId!==e.pointerId)return;
  if(!active&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>10){clear();origin=null;return}
  if(active){
   const target=document.elementFromPoint(e.clientX,e.clientY)?.closest("#home .home-workspace-grid button[data-smart-page]");
   if(target&&target!==active&&!target.hidden){
    const c=cfg(),src=active.dataset.smartPage,dst=target.dataset.smartPage;
    c.pins=c.pins.filter(x=>x!==src);const ordered=[...c.pins,...c.order.filter(x=>!c.pins.includes(x))];
    c.order=c.order.filter(x=>x!==src);
    const index=c.order.indexOf(dst);c.order.splice(index<0?c.order.length:index,0,src);
    save("workspace",c);
    // Move the actual element without rerendering the controls during a drag.
    const rect=target.getBoundingClientRect();
    grid.insertBefore(active,(e.clientY<rect.top+rect.height/2||(Math.abs(e.clientY-(rect.top+rect.height/2))<rect.height/2&&e.clientX<rect.left+rect.width/2))?target:target.nextSibling);
   }
  }
 },{passive:true});
 const stop=()=>{clear();if(active){active.classList.remove("gsmart-dragging");active=null;apply();setTimeout(()=>{used=false},150)}origin=null};
 window.addEventListener("pointerup",stop,{passive:true});
 window.addEventListener("pointercancel",stop,{passive:true});
 // Preserve ordinary scrolling; prevent native page pan only after the long press activates.
 grid.addEventListener("touchmove",e=>{if(active&&e.cancelable)e.preventDefault()},{passive:false});
 grid.addEventListener("click",e=>{if(used){e.preventDefault();e.stopImmediatePropagation();used=false}},true);
}
function foldLongPages(){
 for(const pageName of ["settings","cbCalc"]){
  const page=$(pageName);if(!page)continue;
  const panels=[...page.children].filter(el=>el.classList?.contains("panel"));
  panels.forEach((panel,index)=>{
   if(index===0||panel.dataset.gfoldReady)return;
   const head=panel.querySelector(":scope > .sectiontitle");
   if(!head)return;
   panel.dataset.gfoldReady="1";
   const title=head.textContent.trim();const b=document.createElement("button");
   b.type="button";b.className="gfold-toggle tinybtn";b.textContent="閉じる −";b.setAttribute("aria-label",title+"の詳細を開閉");b.setAttribute("aria-expanded","true");
   head.appendChild(b);
   b.onclick=()=>{const collapsed=panel.classList.toggle("gfold-collapsed");b.textContent=collapsed?"開く ＋":"閉じる −";b.setAttribute("aria-expanded",String(!collapsed))};
   // Keep everything initially expanded to preserve familiar behavior and avoid hidden required fields.
  })
 }
}

function init(){
if(!$("gsmartEditorDetails"))return;
if($("gsmartSearch")){$("gsmartSearch").addEventListener("input",search);$("gsmartSearch").addEventListener("change",search)}
$("gsmartEditorDetails").addEventListener("toggle",editor);
$("gsmartEditorDetails").querySelector("summary")?.addEventListener("click",()=>requestAnimationFrame(editor));
$("gsmartColumns")?.addEventListener("change",e=>{save("columns",Number(e.target.value)===2?2:3);columns()});
$("gsmartResetWorkspace")?.addEventListener("click",()=>{save("workspace",{order:[...defaults,...catalog.map(x=>x[0]).filter(x=>!defaults.includes(x))],hidden:catalog.map(x=>x[0]).filter(x=>!defaults.includes(x)),pins:[]});apply()});
$("gsmartClearRecent")?.addEventListener("click",()=>{save("recent",[]);recent()});
window.addEventListener("glink-role-changed",()=>{apply();recent()});
addMissingFeatures();migrateLegacy();addMissingFeatures();migrateLegacy();apply();columns();pointerSorting();foldLongPages();recent();search();
let previous=document.querySelector(".screen.active")?.id||"home";
const host=document.querySelector("main");
if(host)new MutationObserver(()=>{const current=document.querySelector(".screen.active")?.id||"home";if(current===previous)return;previous=current;if(current!=="home"&&allowed(current)){const r=read("recent",[]);save("recent",[current,...(Array.isArray(r)?r.filter(x=>x!==current&&allowed(x)):[])].slice(0,5))}else if(current==="home"){apply();recent()}}).observe(host,{attributes:true,attributeFilter:["class"],subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();