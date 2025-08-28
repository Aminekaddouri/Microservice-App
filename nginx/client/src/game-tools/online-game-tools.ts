import {createTheGame , mount} from './game-setups'
import io from 'socket.io-client';
import { GameMessage, gameWorldDimensions, MovePayload, StatePayload } from "../types/game-types-protocol";
import { getCurrentUser } from '@/utils/authState';
import { isLoggedIn, getAccessToken } from '../utils/auth';
import { navigateTo } from '@/utils/router';
import { sharedData } from '../pages/GamePage';
import { createPatternLoadingPageHtml, createMatchTimeoutPageHtml, createGameOverPageHtml, createOpponentDisconnectedPageHtml } from '@/components/game-components';
import { countDownAnimation } from './uiCreator';

export function online(type: string, pathToGoAftertheIsOver: string) {
  console.log('online game on');
  // start the socket connection
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.id)
  return ;

  if (sharedData.gameSocket) {
    sharedData.gameSocket?.disconnect();
  }
  if (sharedData.game) {
    sharedData.game.stop();
  }

  sharedData.gameSocket = io('http://localhost:8080/game', {
      auth: {
          token: getAccessToken(),
          userId: currentUser.id
      },
      transports: ['websocket', 'polling']
  });

  const socket = sharedData.gameSocket;
  socket.on('connect', async () => {
    const app = document.getElementById('app');
    if (!app) return;
    sharedData.game = await createTheGame(app);
    const pong = sharedData.game;
    if (pong) {
      pong.setLeftPaddleEvents(socket);
      // await pong.setNames(data.players);
    }
    const animation = countDownAnimation();
    animation.startCountdown();
    setTimeout(() => {
      animation.stopCountdown();
    }, 3000);
    socket.on(`${type}:state`, (data: GameMessage) => {
    if (!pong) return;
      pong.updateBall(data.payload.ball);
      pong.updatePaddles(data.payload.paddles);
    });

    // update score
    socket.on(`${type}:updateScore`, (data: number[]) => {
      console.log(data);
      pong?.setScore(data);
    });

    socket.on('oppenentDisconnected', () => {
      console.log('oppenent disconnected');
      app.innerHTML = '';
      app.appendChild(createOpponentDisconnectedPageHtml());
      pong?.stop();
      socket.disconnect();
    });

    socket.on(`${type}:gameOver`, (data: any) => { // remove the any data type
      console.log('game over', data);
      const gameFrame = document.getElementById('gameFrame');
      gameFrame?.appendChild(createGameOverPageHtml());
      pong?.setWinnerName();
      socket.disconnect();
    });
    socket.emit(`${type}:match`);
  });
}

window.addEventListener("beforeunload", () => {
  console.log('before reload');
  sharedData.gameSocket?.disconnect();
  sharedData.game?.stop();
  navigateTo(window.location.pathname);
});