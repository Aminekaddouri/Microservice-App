import { navigateTo } from "@/utils/router";
import { api } from '@/services/api';
import { loadingIndicator } from "@/utils/utils";
import { getCurrentUser } from '@/utils/authState';
import { isLoggedIn, getAccessToken } from '../utils/auth';
import io, { Socket } from 'socket.io-client';
import {searchUsers} from "./ChatPage";
import { tournamentSearchingModalHtml } from "@/components/tournament-component";
import { online } from "@/game-tools/online-game-tools";
import { createTheGame } from "@/game-tools/game-setups";
import { countDownAnimation } from "@/game-tools/uiCreator";
import { GameMessage } from "@/types/game-types-protocol";
import { createGameOverPageHtml, createOpponentDisconnectedPageHtml } from "@/components/game-components";

import {socketsCollector} from '@/utils/router';

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
    socketsCollector.push(tournamentSocket);
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

    tournamentSocket.on('matchProposal', async (data: any) => {
      const pong = await createTheGame(app);
      if (pong) {
        pong.setLeftPaddleEvents(tournamentSocket!);
        // await pong.setNames(data.players);
      }
      const animation = countDownAnimation();
      tournamentSocket?.emit('tournament:matchAccepted');
      animation.startCountdown();
      setTimeout(() => {
        animation.stopCountdown();
      }, 3000);
  
      tournamentSocket?.on('tournament:state', (data: GameMessage) => {
        console.log('states=========');
        if (!pong) return;
        pong.updateBall(data.payload.ball);
        pong.updatePaddles(data.payload.paddles);
      });
  
      // update score
      tournamentSocket.on('tournament:updateScore', (data: number[]) => {
        pong?.setScore(data);
      });
          
      tournamentSocket?.on('tournament:gameOver', (data: any) => { // remove the any data type
        console.log('game over', data);
        const gameFrame = document.getElementById('gameFrame');
        gameFrame?.appendChild(createGameOverPageHtml());
        pong?.setWinnerName();
        tournamentSocket.disconnect();
      });

      tournamentSocket?.on('oppenentDisconnected', () => {
      app.innerHTML = '';
      app.appendChild(createOpponentDisconnectedPageHtml());
      pong?.stop();
    });

      // accept the proposal
      tournamentSocket.emit('proposal:accept');
      console.log('tournament match accepted');
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