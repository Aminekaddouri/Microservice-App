import { gameData } from "@/pages/GamePage";

// type GameCustomization = {
//   paddleColor?: string;
//   ballColor?: string;
//   fieldColor?: string;
// }

export function createGameFrame(): HTMLElement {
  const gameFrame = document.createElement('div');
  gameFrame.classList.add(
      // "w-[80%]",
      // "h-[80%]",
      gameData.fieldColor,
      "relative"
  );
  return gameFrame;
}

export function createPaddle(): HTMLElement {
  const paddle = document.createElement('div');
  paddle.classList.add(
      // "w-2",
      // "h-24",
      gameData.paddleColor,
      "absolute",
      "rounded-full"
      // "bottom-1/2",
      // "bottom-[157px]",
      // `${paddleSide}`,
      // "translate-y-1/2",
      // "-translate-x-1/2"
  );
  return paddle;
}

export function positionThePaddle(paddle: HTMLElement, side: 'left' | 'right') {
  if (!paddle.parentElement)
    throw new Error("Paddle must have a parent element to position it.");
  if (side === 'left') {
    paddle.classList.add(
      "-translate-y-1/2",
      "-translate-x-1/2",
      "top-1/2",
    )
    paddle.style.left = `${paddle.offsetWidth}px`;
  } else {
      paddle.classList.add(
        "-translate-y-1/2",
        "-translate-x-1/2",
        "top-1/2",
        "right-[0px]",
      );
  }
}

export function createBall(): HTMLElement {
  const ball = document.createElement('div');
  ball.classList.add(
      gameData.ballColor,
      "rounded-full",
      "absolute",
  );
  return ball;
}

export function centerTheBall(ball: HTMLElement) {
  ball.classList.add(
    "top-1/2",
    "left-1/2",
    "-translate-y-1/2",
    "-translate-x-1/2",
  );
}