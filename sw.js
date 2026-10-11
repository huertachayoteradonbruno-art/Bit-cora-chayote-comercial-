
const CACHE_NAME = "bitacora-chayote-comercial-v1";
const ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(
        claves
          .filter((clave) =>
            clave.startsWith("bitacora-chayote-comercial-") &&
            clave !== CACHE_NAME
          )
          .map((clave) => caches.delete(clave))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;

  const url = new URL(evento.request.url);

  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    fetch(evento.request)
      .then((respuesta) => {
        if (respuesta && respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(evento.request, copia);
          });
        }
        return respuesta;
      })
      .catch(async () => {
        const guardada = await caches.match(evento.request);
        if (guardada) return guardada;

        if (evento.request.mode === "navigate") {
          const inicio = await caches.match("./index.html");
          if (inicio) return inicio;
        }

        return new Response("Sin conexión y sin copia disponible.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
  );
});
