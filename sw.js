// Tank-Log Service Worker – Offline-Shell + frische Updates
// HTML: network-first (neue Version erscheint nach Push sofort, offline aus Cache)
// Übrige Dateien (Icons, Bibliotheken): cache-first
const CACHE='tanklog-v22';
const SHELL=['./','./index.html','./supabase.min.js','./manifest.webmanifest'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>{})); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE && k!=='tanklog-share').map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const req=e.request;
  // Share-Target (Android): per Teilen erhaltenes Foto zwischenspeichern und zur App weiterleiten
  if(req.method==='POST'){
    let pu; try{ pu=new URL(req.url); }catch(_){ return; }
    if(pu.pathname.endsWith('share-target')){
      e.respondWith((async()=>{
        try{ const fd=await req.formData(); const file=fd.get('photo'); if(file){ const cache=await caches.open('tanklog-share'); await cache.put('shared-photo', new Response(file, {headers:{'Content-Type':(file.type||'image/jpeg')}})); } }catch(_){}
        return Response.redirect('./?shared=1', 303);
      })());
      return;
    }
    return; // andere POST-Anfragen nicht behandeln
  }
  if(req.method!=='GET') return;
  let url; try{ url=new URL(req.url); }catch(_){ return; }
  // Daten/API immer aus dem Netz, nie cachen
  if(url.hostname.endsWith('supabase.co') || url.hostname.indexOf('frankfurter')>=0 || url.hostname.indexOf('api.anthropic.com')>=0) return;
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return res; })
                .catch(()=> caches.match(req).then(h=> h || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res=>{
      if(res && (res.ok || res.type==='opaque')){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); }
      return res;
    }).catch(()=> Promise.reject('offline')))
  );
});
