import { navigateTo } from "@/utils/router";
import { api } from '@/services/api';
import { loadingIndicator } from "@/utils/utils";
import { getCurrentUser } from '@/utils/authState';
import { isLoggedIn, getAccessToken } from '../utils/auth';
import io, { Socket } from 'socket.io-client';
import {searchUsers} from "./ChatPage";
import { tournamentSearchingModalHtml } from "@/components/tournament-component";

export let tournamentSocket: SocketIOClient.Socket;
type PlayerData = {
  userId: string;
  socketId: string;
  queuedAt: number;
  status: 'waiting' | 'claimed' | 'in-match';
};
// export const onlineGameRomm = new Map<string, PlayerData>();

export async function renderTournament() {
  if (!isLoggedIn()) {
    navigateTo('/');
    return ;
  }

  // start the tournamentSocket connection
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.id)
    return ;
  tournamentSocket = io('http://localhost:8081/tournament', {
    auth: {
        token: getAccessToken(),
        userId: currentUser.id
    },
    transports: ['websocket', 'polling']
  });

  // testing to remove later
  // tournamentSocket.on('debug', (data: any) => {
  //   console.log(data);
  // });

  const app = document.getElementById('app');
  if (!app) return;

  tournamentSocket.on('connect', () => {
    app.innerHTML = '';
    app.appendChild(tournamentSearchingModalHtml());
      // send request to play online
    tournamentSocket?.emit('tournament');
    tournamentSocket.on('tournament:ready', () => {
      app.innerHTML = '<div class="tournament-ready">Tournament is ready to start!</div>';
    });
    
    tournamentSocket.on('tournament:message', (data: any) => {
      // Handle different types of tournament messages with proper styling
      if (typeof data === 'string') {
        if (data.includes('you have a match to play')) {
          app.innerHTML = `
            <div class="tournament-match-notification">
              <div class="tournament-match-card">
                <div class="tournament-match-icon">⚔️</div>
                <h2 class="tournament-match-title">Match Ready!</h2>
                <p class="tournament-match-message">You have a match to play</p>
                <div class="tournament-match-loader">
                  <div class="spinner"></div>
                  <p>Preparing your match...</p>
                </div>
              </div>
            </div>
          `;
        } else {
          app.innerHTML = `<div class="tournament-message">${data}</div>`;
        }
      } else if (data && data.type === 'matchProposal') {
        app.innerHTML = `
          <div class="tournament-proposal">
            <div class="tournament-proposal-card">
              <div class="tournament-proposal-icon">🎮</div>
              <h2 class="tournament-proposal-title">Match Proposal</h2>
              <p class="tournament-proposal-message">${data.message}</p>
              <div class="tournament-proposal-actions">
                <button id="accept-match" class="btn-accept">Accept Match</button>
                <button id="decline-match" class="btn-decline">Decline</button>
              </div>
            </div>
          </div>
        `;
        
        // Add event listeners for proposal buttons
        const acceptBtn = document.getElementById('accept-match');
        const declineBtn = document.getElementById('decline-match');
        
        if (acceptBtn) {
          acceptBtn.addEventListener('click', () => {
            tournamentSocket.emit('proposal:accept');
            app.innerHTML = `
              <div class="tournament-waiting">
                <div class="tournament-waiting-card">
                  <div class="spinner"></div>
                  <h2>Match Accepted!</h2>
                  <p>Waiting for opponent...</p>
                </div>
              </div>
            `;
          });
        }
        
        if (declineBtn) {
          declineBtn.addEventListener('click', () => {
            tournamentSocket.emit('proposal:decline');
            navigateTo('/game');
          });
        }
      } else {
        app.innerHTML = `<div class="tournament-message">${JSON.stringify(data)}</div>`;
      }
    });
  });

  tournamentSocket.on('disconnect', () => {
    console.log('tournament disconnected');
    navigateTo('/game');
  });
}

window.addEventListener("beforeunload", () => {
  tournamentSocket.disconnect();
});