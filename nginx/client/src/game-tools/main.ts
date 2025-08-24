import { Pong} from "./pingPong";
import * as uiCreator from "./uiCreator";
import {gameWorldDimensions} from "../types/game-types-protocol";

export function createTheGame(gameContainer: HTMLElement) {
  if (!gameContainer) return;

  gameContainer.innerHTML = '';
  gameContainer.classList.add( // this will be removed in the future cause it will be fixed
    "w-[80%]",
    "h-[30rem]",
    "flex",
    "items-center",
    "justify-center",
    "bg-black"
  );

  const gameFrame = uiCreator.createGameFrame();
  const leftPaddle = uiCreator.createPaddle();
  const rightPaddle = uiCreator.createPaddle();
  const ball = uiCreator.createBall();

  gameFrame.appendChild(leftPaddle);
  gameFrame.appendChild(rightPaddle);
  gameFrame.appendChild(ball);

  gameContainer.appendChild(gameFrame);
  
  const updateGameFrameSize = () => {
    gameFrame.style.width = `${gameContainer.clientWidth * 0.8}px`;
    gameFrame.style.height = `${gameContainer.clientHeight * 0.8}px`;
    leftPaddle.style.width = `${gameFrame.clientWidth * gameWorldDimensions.paddle.w}px`;
    leftPaddle.style.height = `${gameFrame.clientHeight * gameWorldDimensions.paddle.h}px`;
    rightPaddle.style.width = `${gameFrame.clientWidth * gameWorldDimensions.paddle.w}px`;
    rightPaddle.style.height = `${gameFrame.clientHeight * gameWorldDimensions.paddle.h}px`;
    ball.style.width = `${(gameFrame.clientWidth + gameFrame.clientHeight) / 2 * gameWorldDimensions.ball.w}px`;
    ball.style.height = `${(gameFrame.clientWidth + gameFrame.clientHeight) / 2 * gameWorldDimensions.ball.w}px`;
    uiCreator.positionThePaddle(leftPaddle, "left");
    uiCreator.positionThePaddle(rightPaddle, "right");
    uiCreator.centerTheBall(ball);
  }
  
  updateGameFrameSize();
  
  // window.addEventListener("DOMContentLoaded", () => { // i need to learn more into how the dom works
  //   if ("ResizeObserver" in window) {
  //     const ro = new ResizeObserver(updateGameFrameSize);
  //     ro.observe(gameContainer);
  //   }
  // });

  window.addEventListener("resize", updateGameFrameSize);
  
  const game = new Pong([leftPaddle, rightPaddle], ball);
  game.run();
  return game;
}
