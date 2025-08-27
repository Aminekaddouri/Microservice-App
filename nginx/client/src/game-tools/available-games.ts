import { countDownAnimation } from '@/game-tools/uiCreator';
import { GameMessage, gameWorldDimensions, MovePayload, StatePayload } from "../types/game-types-protocol";
import {createTheGame, mount} from './game-setups';
import { Pong } from '@/game-tools/pingPong';
import { createPatternLoadingPageHtml, createMatchTimeoutPageHtml, createGameOverPageHtml, createOpponentDisconnectedPageHtml } from '@/components/game-components';
import { navigateTo } from '@/utils/router';

export let pong: Pong | undefined = undefined;

type Payload = {
    players: {
        userId: string;
    }[];
    acceptTimeoutMs: number;
}

export async function localGame(socket: SocketIOClient.Socket, app: HTMLElement) {
  console.log('Local game started, setting up game...');
  
  // Clear the app and setup the game first
  const pong = await createTheGame(app);
  if (pong) {
      console.log('Pong game created successfully, setting up paddle events...');
      pong.setLeftPaddleEvents(socket);
      pong.setRightPaddleEvents(socket);
  } else {
      console.error('Failed to create pong game!');
      return;
  }
  
  // Now that the game is set up, start the countdown animation
  console.log('Starting countdown animation...');
  const animation = countDownAnimation();
  animation.startCountdown();

  socket.once('localGame:ready', () => {
    console.log('Local game ready event received from server');
    socket.on('localGame:state', (data: GameMessage) => {
      if (!pong) return;
      pong.updateBall(data.payload.ball);
      pong.updatePaddles(data.payload.paddles);
    });
    // update score
    socket.on('localGame:updateScore', (data: number[]) => {
      console.log('Score update received:', data);
      pong?.setScore(data);
    });
  });

  // start the game after countdown
  setTimeout(() => {
    console.log('Countdown finished, emitting localGame event to server...');
    animation.stopCountdown();
    socket.emit('localGame');
  }, 3000);
}

export function onlineGame(socket: SocketIOClient.Socket, app: HTMLElement) {
  // send request to play online
  socket?.emit('onlineGame');
  // a loading page can be set here
  app.innerHTML = '';
  app.appendChild(createPatternLoadingPageHtml());

  // proposal request
  socket?.once('onlineGame:proposalMatch', async (data: Payload) => { // need to remove the any data type    
    pong = await createTheGame(app);
    if (pong) {
        pong.setLeftPaddleEvents(socket!);
        await pong.setNames(data.players);
    }
    const animation = countDownAnimation();
    socket?.emit('onlineGame:matchAccepted');
    animation.startCountdown();
    setTimeout(() => {
      animation.stopCountdown();
    }, 3000);

    socket?.on('onlineGame:state', (data: GameMessage) => {
      if (!pong) return;
      pong.updateBall(data.payload.ball);
      pong.updatePaddles(data.payload.paddles);
    });

    // update score
    socket.on('onlineGame:updateScore', (data: number[]) => {
      pong?.setScore(data);
    });

    socket?.on('oppenentDisconnected', () => {
      app.innerHTML = '';
      app.appendChild(createOpponentDisconnectedPageHtml());
      pong?.stop();
      socket.disconnect();
    });

    socket?.on('onlineGame:gameOver', (data: any) => { // remove the any data type
      console.log('game over', data);
      const gameFrame = document.getElementById('gameFrame');
      gameFrame?.appendChild(createGameOverPageHtml());
      pong?.setWinnerName();
      socket.disconnect();
    });
  });

  socket?.on('timeOut', () => {
    console.log('time out no oppenent available');
    app.innerHTML = '';
    app.appendChild(createMatchTimeoutPageHtml());
    const toGame = document.getElementById('toGamePage');
    toGame?.addEventListener('click', () => {
      navigateTo('/game');
    })
  });
}