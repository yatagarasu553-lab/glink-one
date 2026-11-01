(()=>{
"use strict";
const $=id=>document.getElementById(id);
const catalog=[["printDocs","書類印刷","書類 印刷 PDF"],["cbCalc","CB計算","特典 キャッシュバック"],["reports","日報入力","日報 活動報告"],["register","個別実績","契約 登録"],["leads","見込み管理","再来店 カレンダー"],["ranking","ランキング","順位"],["monthlyArchive","月別分析","グラフ 月間"],["reportImage","活動報告画像","PNG"],["announcements","お知らせ","連絡"],["team","チーム共有","同期"],["mypage","マイページ","プロフィール"],["pushSettings","iPhone通知","通知"],["login","ログイン","アカウント"],["paste","店舗報告コピペ","店舗日報","admin"],["analytics","店舗分析","分析","admin"],["staffGoals","個人目標","目標","admin"],["settings","店舗設定","管理者","admin"]];
const defaults=["printDocs","cbCalc","reports","register","leads","ranking"];
const glyphs={monthlyArchive:"▥",reportImage:"▧",announcements:"◉",team:"☁",mypage:"♙",pushSettings:"♧",login:"🔐",paste:"▣",analytics:"▥",staffGoals:"◎",settings:"⚙"};
const admin=()=>{try{return typeof activeRole!=="undefined"&&activeRole==="admin"}catch{return false}};
const allowed=id=>{const f=catalog.find(x=>x[0]===id);return !!f&&(!f[3]||admin())};
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
save("workspace",{order,hidden:ids.filter(x=>!visible.includes(x))});
}
function items(){
const grid=document.querySelector("#home .home-workspace-grid");if(!grid)return [];
return [...grid.children].filter(x=>x.tagName==="BUTTON").map(button=>({button,id:button.dataset.smartPage||(button.getAttribute("onclick")||"").split("navigate('")[1]?.split("'")[0]})).filter(x=>x.id)
}
function cfg(){
const ids=items().map(x=>x.id),stored=read("workspace",{}),order=Array.isArray(stored.order)?stored.order.filter(x=>ids.includes(x)):defaults.filter(x=>ids.includes(x)),hidden=Array.isArray(stored.hidden)?stored.hidden.filter(x=>ids.includes(x)):ids.filter(x=>!defaults.includes(x));
return {order:[...new Set([...order,...ids])],hidden};
}
function apply(){
const grid=document.querySelector("#home .home-workspace-grid");if(!grid)return;const list=items(),c=cfg();
for(const id of c.order){const item=list.find(x=>x.id===id);if(!item)continue;item.button.dataset.smartPage=id;grid.appendChild(item.button);const hide=c.hidden.includes(id)||!allowed(id);item.button.hidden=hide;item.button.style.display=hide?"none":""}
editor();
}
function editor(){
const root=$("gsmartEditorDetails"),area=$("gsmartWorkspaceOptions");if(!root?.open||!area)return;
area.replaceChildren();const c=cfg();
for(const [i,id] of c.order.filter(allowed).entries()){
const row=document.createElement("div");row.className="gsmart-workspace-row";
const label=document.createElement("label"),check=document.createElement("input");check.type="checkbox";check.checked=!c.hidden.includes(id);
check.addEventListener("change",()=>{const v=cfg();v.hidden=check.checked?v.hidden.filter(x=>x!==id):[...new Set([...v.hidden,id])];save("workspace",v);apply()});
label.append(check,document.createTextNode(" "+(catalog.find(x=>x[0]===id)?.[1]||id)));row.appendChild(label);
const group=document.createElement("div");
for(const step of [-1,1]){const b=document.createElement("button");b.type="button";b.textContent=step<0?"↑":"↓";b.disabled=i+step<0||i+step>=c.order.filter(allowed).length;b.addEventListener("click",()=>{const v=cfg(),shown=v.order.filter(allowed),n=shown.indexOf(id);if(n<0||n+step<0||n+step>=shown.length)return;const other=v.order.indexOf(shown[n+step]),own=v.order.indexOf(id);[v.order[own],v.order[other]]=[v.order[other],v.order[own]];save("workspace",v);apply()});group.appendChild(b)}
row.appendChild(group);area.appendChild(row);
}
}
function recent(){
const box=$("gsmartRecent"),area=$("gsmartRecentItems");if(!box||!area)return;
const r=read("recent",[]),ids=Array.isArray(r)?r.filter(allowed).slice(0,4):[];area.replaceChildren();box.hidden=!ids.length;
for(const id of ids){const b=document.createElement("button");b.type="button";b.textContent=(catalog.find(x=>x[0]===id)?.[1]||id)+" ›";b.onclick=()=>open(id);area.appendChild(b)}
}
function init(){
if(!$("gsmartSearch")||!$("gsmartEditorDetails"))return;
$("gsmartSearch").addEventListener("input",search);
$("gsmartSearch").addEventListener("change",search);
$("gsmartEditorDetails").addEventListener("toggle",editor);
$("gsmartEditorDetails").querySelector("summary")?.addEventListener("click",()=>requestAnimationFrame(editor));
$("gsmartResetWorkspace")?.addEventListener("click",()=>{save("workspace",{order:[...defaults,...catalog.map(x=>x[0]).filter(x=>!defaults.includes(x))],hidden:catalog.map(x=>x[0]).filter(x=>!defaults.includes(x))});apply()});
$("gsmartClearRecent")?.addEventListener("click",()=>{save("recent",[]);recent()});
addMissingFeatures();migrateLegacy();apply();recent();search();
let previous=document.querySelector(".screen.active")?.id||"home";
const host=document.querySelector("main");
if(host)new MutationObserver(()=>{const current=document.querySelector(".screen.active")?.id||"home";if(current===previous)return;previous=current;if(current!=="home"&&allowed(current)){const r=read("recent",[]);save("recent",[current,...(Array.isArray(r)?r.filter(x=>x!==current&&allowed(x)):[])].slice(0,5))}else if(current==="home"){apply();recent()}}).observe(host,{attributes:true,attributeFilter:["class"],subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();