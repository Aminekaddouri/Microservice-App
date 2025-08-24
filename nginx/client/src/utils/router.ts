type RouteHandler = () => void;

const routes: Record<string, RouteHandler> = {};

export function registerRoute(
    path: string,
    handler: RouteHandler
): void {
    routes[path] = handler;
}

export function navigateTo(path: string): void {
    window.history.pushState({}, '', path);
    renderRoute(path);
}

export function renderRoute(path: string): void {
    if (path in routes) {
        const route = routes[path];
        route();
    } else {
        document.getElementById('app')!.innerHTML = `<h1 class="text-2xl">404 Not Found</h1>`;
    }
}

window.addEventListener('popstate', () => {
    renderRoute(location.pathname);
});