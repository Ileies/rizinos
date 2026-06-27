const CACHE_VERSION = 'v1';
const SHELL_CACHE = `rz-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `rz-assets-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys
						.filter((k) => k.startsWith('rz-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
						.map((k) => caches.delete(k))
				)
			)
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	// Navigation: network-first, fall back to cached shell for offline
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Pass through server-side redirects (e.g. auth) without absorbing them
					if (response.redirected) {
						return Response.redirect(response.url, 302);
					}
					if (response.ok) {
						const clone = response.clone();
						event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone)));
					}
					return response;
				})
				.catch(async () => {
					const cache = await caches.open(SHELL_CACHE);
					return (await cache.match(request)) ?? (await cache.match('/app')) ?? Response.error();
				})
		);
		return;
	}

	// SvelteKit immutable assets: content-hashed filenames never change, cache-first forever
	if (url.pathname.startsWith('/_app/immutable/')) {
		event.respondWith(
			caches.open(ASSET_CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				if (cached) return cached;
				const response = await fetch(request);
				if (response.ok) cache.put(request, response.clone());
				return response;
			})
		);
		return;
	}

	// Other static assets (icons, fonts, styles): stale-while-revalidate
	if (
		request.destination === 'script' ||
		request.destination === 'style' ||
		request.destination === 'image' ||
		request.destination === 'font'
	) {
		event.respondWith(
			caches.open(ASSET_CACHE).then(async (cache) => {
				const cached = await cache.match(request);
				if (cached) {
					event.waitUntil(
						fetch(request)
							.then((response) => {
								if (response.ok) cache.put(request, response.clone());
							})
							.catch(() => {})
					);
					return cached;
				}
				const response = await fetch(request);
				if (response.ok) cache.put(request, response.clone());
				return response;
			})
		);
	}
});
