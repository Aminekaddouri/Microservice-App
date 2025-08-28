import { navigateTo } from "@/utils/router";
import { tournamentSocket } from "@/pages/tournamentPage";
import { i18n } from '@/services/i18n';

export function tournamentSearchingModalHtml(): HTMLElement {
  const loadingHtml = `
    <div class="flex flex-col items-center space-y-4 p-6 rounded-lg">
      <div role="status" aria-live="polite" class="flex flex-col items-center">
        <div class="w-20 h-20 border-4 border-t-orange-500 border-b-orange-500 rounded-full animate-spin mb-4"></div>

        <div class="text-white text-2xl font-bold tracking-wide">
          ${i18n.t('game.searchingForTournament')}
        </div>

        <div class="text-gray-300 mt-2 flex items-center space-x-3">
          <span class="text-sm">${i18n.t('game.pleaseWait')}</span>
          <div class="flex items-center space-x-2">
            <span class="inline-block w-2.5 h-2.5 bg-white rounded-full animate-bounce"></span>
            <span class="inline-block w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-150"></span>
            <span class="inline-block w-2.5 h-2.5 bg-white rounded-full animate-bounce delay-300"></span>
          </div>
        </div>
      </div>

      <button
        type="button"
        data-action="cancel-search"
        class="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        ${i18n.t('game.cancel')}
      </button>
    </div>
  `;
  const overlay = document.createElement('div');
  overlay.classList.add(
    'flex',
    'items-center',
    'justify-center',
  );
  overlay.addEventListener('click', () => {
    if (tournamentSocket) {
      tournamentSocket.disconnect();
    }
    navigateTo('/game');
  })
  overlay.innerHTML = loadingHtml;

  return overlay;
}