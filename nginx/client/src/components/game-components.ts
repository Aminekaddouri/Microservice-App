import { navigateTo } from "@/utils/router";

export function createPatternLoadingPageHtml(): HTMLElement {
  const loadingHtml = `
    <div class="flex flex-col items-center space-y-4 p-6 rounded-lg bg-black/50 backdrop-blur-md border border-white/20">
      <div role="status" aria-live="polite" class="flex flex-col items-center">
        <div class="w-20 h-20 border-4 border-t-orange-500 border-b-orange-500 rounded-full animate-spin mb-4"></div>

        <div class="text-white text-2xl font-bold tracking-wide">
          Searching for opponent
        </div>

        <div class="text-gray-300 mt-2 flex items-center space-x-3">
          <span class="text-sm">Please wait</span>
          <div class="flex items-center space-x-2">
            <span class="inline-block w-2.5 h-2.5 bg-white rounded-full animate-bounce"></span>
            <span class="inline-block w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-150"></span>
            <span class="inline-block w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      </div>

      <button
        type="button"
        id="cancel-search-btn"
        data-action="cancel-search"
        class="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors duration-200"
      >
        Cancel
      </button>
    </div>
  `;
  const overlay = document.createElement('div');
  overlay.classList.add(
    'fixed',
    'inset-0',
    'flex',
    'items-center',
    'justify-center',
    'z-50'
  );
  
  overlay.innerHTML = loadingHtml;
  
  // Add cancel button functionality
  const cancelBtn = overlay.querySelector('#cancel-search-btn');
  cancelBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    navigateTo('/game');
  });

  return overlay;
}


export function createGameOverPageHtml(): HTMLElement {
  const html = `
    <div class="flex flex-col items-center space-y-4 p-6 backdrop-blur-md rounded-lg shadow-xl">
      <div role="status" aria-live="polite" class="flex flex-col items-center">
        <div class="text-red-400 text-5xl font-extrabold mb-2">Game Over</div>

        <div class="text-white text-2xl font-bold tracking-wide mb-2">
          <span id="go-winner">Winner: —</span>
        </div>
      </div>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.classList.add('flex', 'items-center', 'justify-center');

  overlay.innerHTML = html;

  return overlay;
}


export function createMatchTimeoutPageHtml(): HTMLElement {
  const html = `
    <div class="flex flex-col items-center space-y-8 text-center">
      <div role="status" aria-live="polite" class="flex flex-col items-center space-y-2">
        <div class="text-white text-6xl font-extrabold">Time Out</div>
        <div class="text-white text-2xl">No opponent found</div>
        <div class="text-white text-lg">Please try again later</div>
      </div>

      <div class="flex space-x-6">
        <button
          type="button"
          id="toGamePage"
          class="px-8 py-4 text-xl bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-400"
        >
          Game Page
        </button>
      </div>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.classList.add(
    'flex',
    'items-center',
    'justify-center',
    'h-full',
    'w-full'
  );

  overlay.innerHTML = html;
  return overlay;
}

import { i18n } from '@/services/i18n';

export function createOpponentDisconnectedPageHtml(): HTMLElement {
  const html = `
    <div class="flex flex-col items-center space-y-4 p-6 rounded-lg">
      <div role="status" aria-live="polite" class="flex flex-col items-center">
        <div class="text-orange-400 text-4xl font-extrabold mb-2">
          ${i18n.t('game.opponentDisconnected')}
        </div>

        <div class="text-white text-lg font-medium">
          ${i18n.t('game.otherPlayerLeftGame')}
        </div>
      </div>
    </div>
  `;

  const overlay = document.createElement('div');
  overlay.classList.add('flex', 'items-center', 'justify-center');

  overlay.innerHTML = html;

  return overlay;
}
