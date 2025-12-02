export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

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