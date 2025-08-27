import { setNotification } from '@/utils/notification';

export { setNotification } from '@/utils/notification';

type RouteHandler = () => void | Promise<void>;

const routes: Record<string, RouteHandler> = {};

export function registerRoute(path: string, handler: RouteHandler): void {
  routes[path] = handler;
}

function renderErrorPage(code: number, title: string, message: string) {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <main class="w-full min-h-screen flex items-center justify-center">
      <section class="relative w-full min-h-screen  flex flex-col items-center justify-center px-6">
        <div class="absolute inset-0 bg-black/40" aria-hidden="true"></div>
        <div class="relative z-10 w-full max-w-md text-center space-y-6">
          <div class="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent rounded-3xl"></div>
            <div class="absolute inset-0 rounded-3xl shadow-inner shadow-white/10"></div>
            <div class="relative z-10 space-y-4">
              <h1 class="font-semibold text-white text-4xl">${code}</h1>
              <h2 class="text-white text-2xl">${title}</h2>
              <p class="text-white/90">${message}</p>
              <button id="error-home" class="group relative w-full bg-white/90 hover:bg-white text-gray-700 rounded-2xl py-3 px-6 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-300 ease-out border border-white/30 hover:border-white/50">
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
  document.getElementById('error-home')?.addEventListener('click', () => {
    navigateTo('/');
  });
}

export function navigateTo(path: string): void {
  // Avoid re-navigating to the same path to prevent recursion and history bloat
  if (location.pathname === path) {
    return;
  }
  window.history.pushState({}, '', path);
  renderRoute(path);
}

export async function renderRoute(path: string): Promise<void> {
  setNotification();
  if (path in routes) {
    const route = routes[path];
    try {
      await route();
    } catch (err) {
      console.error('Route render error:', err);
      renderErrorPage(500, 'Server Error', 'Something went wrong while rendering this page. Please try again later.');
    }
  } else {
    renderErrorPage(404, 'Page Not Found', "The page you're looking for doesn't exist or has been moved.");
  }

  // Let the outer app (client.ts) know a route has rendered so it can update the shell
  window.dispatchEvent(new CustomEvent('route:rendered', { detail: { path } }));
}

window.addEventListener('popstate', async () => {
  await renderRoute(location.pathname);
});