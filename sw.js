// Tank-Log Service Worker – Offline-Shell + frische Updates
// HTML: network-first (neue Version erscheint nach Push sofort, offline aus Cache)
// Übrige Dateien (Icons, Bibliotheken): cache-first
const CACHE='tanklog-v2';
const SHELL=['./','./index.html'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()).catch(()=>{})); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const req=e.request; if(req.method!=='GET') return;
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
