import { isLoggedIn, getAccessToken } from '../utils/auth';
import { navigateTo, socketsCollector } from '../utils/router';
import {createTheGame} from '../game-tools/game-setups'
import io from 'socket.io-client';
import { api } from '@/services/api';
import { getCurrentUser } from '@/utils/authState';
import { i18n } from '@/services/i18n';

import { GameMessage, gameWorldDimensions, MovePayload, StatePayload } from "../types/game-types-protocol";
import { Pong } from '@/game-tools/pingPong';
import { createPatternLoadingPageHtml } from '../components/game-components';

import { localGame, pong, onlineGame } from '@/game-tools/available-games';

export const gameData = {
  paddleColor: "bg-blue-500",
  ballColor: "bg-yellow-500",
  fieldColor: "#711f1f"//"bg-red-800"
}

let socket: undefined | SocketIOClient.Socket = undefined;
export const sharedData: {
  gameSocket?: SocketIOClient.Socket;
  game?: Pong
} = {
  gameSocket: socket,
  game: pong
};

export async function renderGame() {
  if (!isLoggedIn()) {
    navigateTo('/');
    return;
  }

  const app = document.getElementById("app");
  if (!app) return;

  // start the socket connection
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.id)
    return ;

  if (socket) {
    socket.disconnect();
  }
  if (pong) {
    pong.stop();
  }

  socket = io('http://localhost:8081/game', {
      auth: {
          token: getAccessToken(),
          userId: currentUser.id
      },
      transports: ['websocket', 'polling']
  });

  socketsCollector.push(socket!);

  socket.on('disconnect', (error: any) => {
    console.log(error);
  });

  // // the main page of the game
  app.innerHTML = '';
  app.innerHTML = gamePage();
  const localGameButton = document.querySelector('.local');

  const onlineGameButton = document.querySelector('.classic');

  const tournamentButton = document.querySelector('.tournament');

  // local game
  localGameButton?.addEventListener('click', () => {
    // socket.on('connection', () => {
      localGame(socket!, app);
    // });
  });

  // // online game
  onlineGameButton?.addEventListener('click', () => {
    onlineGame(socket!, app);
  });

  // tournament
  tournamentButton?.addEventListener('click', () => {
    navigateTo('/tournament');
  });
}

function gamePage() {
  return `
    <div class="min-h-screen p-6 flex items-center justify-center">
      <div class="w-full max-w-6xl">
        <!-- Page Header -->
        <div class="text-center mb-12">
          <h1 class="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-4">
            ${i18n.t('game.chooseGameMode')}
          </h1>
          <p class="text-xl text-gray-300 max-w-2xl mx-auto">
            ${i18n.t('game.selectGameModes')}
          </p>
        </div>

        <!-- Game Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <!-- Classic Game Card -->
          <div class="card classic group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 via-blue-600/10 to-blue-700/20 backdrop-blur-xl border border-blue-400/30 shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer">
            <!-- Background Image Overlay -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
            
            <!-- Glow Effect -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Content -->
            <div class="relative z-10 p-8 h-80 flex flex-col justify-between">
              <!-- Icon -->
              <div class="flex justify-center mb-6">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              
              <!-- Title -->
              <div class="text-center">
                <h2 class="text-3xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors duration-300">${i18n.t('game.classic')}</h2>
                <p class="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors duration-300">${i18n.t('game.firstToScore')}</p>
              </div>
              
              <!-- Bottom Accent -->
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>

          <!-- Local Game Card -->
          <div class="card local group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500/20 via-green-600/10 to-green-700/20 backdrop-blur-xl border border-green-400/30 shadow-2xl hover:shadow-green-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer">
            <!-- Background Image Overlay -->
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
            
            <!-- Glow Effect -->
            <div class="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Content -->
            <div class="relative z-10 p-8 h-80 flex flex-col justify-between">
              <!-- Icon -->
              <div class="flex justify-center mb-6">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
              </div>
              
              <!-- Title -->
              <div class="text-center">
                <h2 class="text-3xl font-bold text-white mb-3 group-hover:text-green-200 transition-colors duration-300">${i18n.t('game.local')}</h2>
                <p class="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors duration-300">${i18n.t('game.grabFriendAndPlay')}</p>
              </div>
              
              <!-- Bottom Accent -->
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600 opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>

          <!-- Tournament Game Card -->
          <div class="card tournament group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-purple-700/20 backdrop-blur-xl border border-purple-400/30 shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer">
            <!-- Background Image Overlay -->
            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
            
            <!-- Glow Effect -->
            <div class="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <!-- Content -->
            <div class="relative z-10 p-8 h-80 flex flex-col justify-between">
              <!-- Icon -->
              <div class="flex justify-center mb-6">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                  </svg>
                </div>
              </div>
              
              <!-- Title -->
              <div class="text-center">
                <h2 class="text-3xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">${i18n.t('game.tournament')}</h2>
                <p class="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors duration-300">${i18n.t('game.win2GamesToClaim')}</p>
              </div>
              
              <!-- Bottom Accent -->
              <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-purple-600 opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
        </div>

        <!-- Additional Info Section -->
        <div class="text-center mt-12">
          <div class="inline-flex items-center px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <svg class="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-gray-300 text-sm font-medium">${i18n.t('game.clickAnyCard')}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}