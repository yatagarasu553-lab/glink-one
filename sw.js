/* GLINK ONE service worker – iOS Home Screen Web Push */
const CACHE_VERSION='glink-push-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
 let data={};
 try{data=event.data?.json()||{}}catch{data={title:'GLINK ONE',body:'新しい通知があります。'}}
 const path=String(data.url||'./?push=home');
 const safeUrl=new URL(path,self.registration.scope);
 const url=safeUrl.origin===self.location.origin&&safeUrl.pathname.startsWith(new URL(self.registration.scope).pathname)?safeUrl.href:self.registration.scope;
 event.waitUntil(self.registration.showNotification(String(data.title||'GLINK ONE'),{
  body:String(data.body||'新しいお知らせがあります。'),
  icon:'./apple-touch-icon.png',
  badge:'./apple-touch-icon.png',
  tag:String(data.tag||'glink'),
  data:{url},
  renotify:false
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const target=String(event.notification.data?.url||self.registration.scope);
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of windows){if(client.url.startsWith(self.registration.scope)){await client.focus();client.navigate(target);return}}
  await self.clients.openWindow(target);
 })());
});
