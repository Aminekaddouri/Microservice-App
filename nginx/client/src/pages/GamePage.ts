import { isLoggedIn, getAccessToken } from '../utils/auth';
import { navigateTo } from '../utils/router';
import {createTheGame} from '../game-tools/main'
import io from 'socket.io-client';
import { api } from '@/services/api';
import { getCurrentUser } from '@/utils/authState';

import { GameMessage, gameWorldDimensions, MovePayload, StatePayload } from "../types/game-types-protocol";
import { Pong } from '@/game-tools/pingPong';

export const gameData = {
  paddleColor: "bg-blue-500",
  ballColor: "bg-yellow-500",
  fieldColor: "bg-red-800"
}

export async function renderGame() {
  if (!isLoggedIn()) {
    navigateTo('/');
    return;
  }

  const app = document.getElementById("app");
  let pong: undefined | Pong = undefined;
  if (!app) return;

  // start the socket connection
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.id)
    return ;

  let socket = io('http://localhost:8080/game', {
      auth: {
          token: getAccessToken(),
          userId: currentUser.id
      },
      transports: ['websocket', 'polling']
  });
  socket.on('disconnect', () => {
    console.log('connection closed');
    if (pong) {
        pong.stop();
    }
    if (isLoggedIn())
      navigateTo('/game');
    console.log('navigating to /game');
  });

  // the main page of the game
  app.innerHTML = '';
  const localGameButton = document.createElement('button');
  localGameButton.textContent = 'local game';
  app.appendChild(localGameButton);

  const onlineGameButton = document.createElement('button');
  onlineGameButton.textContent = 'online game';
  app.appendChild(onlineGameButton);

  // local game
  localGameButton.addEventListener('click', () => {
    socket.once('localGame:ready', () => {
      // setup the game
      pong = createTheGame(app);
      if (pong) {
          pong.setLeftPaddleEvents(socket);
          pong.setRightPaddleEvents(socket);
      }

      socket.on('localGame:state', (data: GameMessage) => {
        if (!pong) return;
        pong.updateBall(data.payload.ball);
        pong.updatePaddles(data.payload.paddles);
      });
    });
    // a loading page can be set here
    app.innerHTML = "tsnaa";
    // start the game
    setTimeout(() => {
      socket.emit('localGame');
    }, 1000);
  });

  // online game
  onlineGameButton.addEventListener('click', () => {
    // send request to play online
    socket.emit('onlineGame');
    // a loading page can be set here
    app.innerHTML = "searching for apponent";

    // proposal request
    socket.once('onlineGame:proposalMatch', (data: any) => { // need to remove the any data type
      console.log(data);
      pong = createTheGame(app);
      if (pong) {
          pong.setLeftPaddleEvents(socket);
      }
  
      socket.on('onlineGame:state', (data: GameMessage) => {
        if (!pong) return;
        pong.updateBall(data.payload.ball);
        pong.updatePaddles(data.payload.paddles);
      });

      socket.on('oppenentDisconnected', () => {
        console.log('oppenent disconnected');
        app.innerHTML = 'oppenent disconnected';
        app.style.color = 'white';
        pong?.stop();
      });
  
      socket.on('onlineGame:gameOver', (data: any) => { // remove the any data type
        console.log('game over', data);
      });
      socket.emit('onlineGame:matchAccepted');
    });


    socket.on('timeOut', () => {
      console.log('time out no oppenent available');
      app.innerHTML = 'time out no oppenent available';
    });
  })
}