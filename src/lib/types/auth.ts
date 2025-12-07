import { User } from "../db/generated";

export interface AuthContextType {
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  loading: boolean;
}


export interface UserCookie {
  id: string,
  tokens: {
    access: string,
    refresh: string
  }
}