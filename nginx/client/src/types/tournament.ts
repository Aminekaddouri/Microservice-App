export type TournamentData = {
  id: string;
  creatorId: string;
  capacity: number;
  status: 'pending' | 'starting' | 'finished';
  playersId: string[];
}