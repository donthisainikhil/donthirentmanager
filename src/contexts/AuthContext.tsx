import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref, set, get, onValue } from 'firebase/database';
import { auth, database } from '@/lib/firebase';

type UserStatus = 'pending' | 'approved' | 'rejected';
type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  status: UserStatus;
  role: UserRole;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isApproved: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const profileRef = ref(database, `profiles/${userId}`);
    const snapshot = await get(profileRef);
    
    if (snapshot.exists()) {
      const profileData = snapshot.val() as Profile;
      setProfile(profileData);
      setIsAdmin(profileData.role === 'admin');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen for profile changes in realtime
        const profileRef = ref(database, `profiles/${firebaseUser.uid}`);
        onValue(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.val() as Profile;
            setProfile(profileData);
            setIsAdmin(profileData.role === 'admin');
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Check if this is the first user
      const profilesRef = ref(database, 'profiles');
      const profilesSnapshot = await get(profilesRef);
      const isFirstUser = !profilesSnapshot.exists();
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Create profile in Realtime Database
      const newProfile: Profile = {
        id: userId,
        email,
        full_name: fullName,
        status: isFirstUser ? 'approved' : 'pending',
        role: isFirstUser ? 'admin' : 'user',
        created_at: new Date().toISOString()
      };
      
      await set(ref(database, `profiles/${userId}`), newProfile);
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const isApproved = profile?.status === 'approved';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isApproved,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
