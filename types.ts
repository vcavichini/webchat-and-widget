export enum Sender {
  User = 'user',
  Bot = 'bot'
}

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean; // Tracks if the current session user clicked this
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isError?: boolean;
  reactions?: Reaction[];
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
  System = 'system'
}

export interface N8NResponse {
  output: string; // Adapt this based on your actual N8N JSON response structure
}