export interface GameWithParticipants extends Game {
    creator: any;
    participants: GameParticipant[];
}
export interface Game {
    find(arg0: (p: any) => boolean): unknown;
    startedAt: string | number | Date;
    type: any;
    winnerId: string;
    playersCount: string;
    duration: string;
    finishedAt: Date;
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface GameParticipant {
    fullName: any;
    id: string;
    avatarUrl: string;
    username: any;
    userId: string;
    gameId: string;
    score: number;
    isWinner: boolean;
}
export interface CreateGameRequest {
    themeId: string;
    type: 'oneVone' | 'tournament';
}
export interface CreateGameResponse {
    participants: GameParticipant[];
    map(arg0: (p: any) => string): unknown;
    games: any;
    success: boolean;
    message: string;
    game: GameWithParticipants;
}