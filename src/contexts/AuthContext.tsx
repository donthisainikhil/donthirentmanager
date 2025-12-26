import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  ref,
  set as firebaseSet,
  get as firebaseGet,
  onValue,
  runTransaction,
} from 'firebase/database';
import { auth, database } from '@/lib/firebase';

type UserStatus = 'pending' | 'approved' | 'rejected';
type UserRole = 'admin' | 'user';

type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  status: UserStatus;
  created_at: string;
};

type RoleRecord = {
  role: UserRole;
  created_at: string;
};

export interface Profile extends ProfileRecord {
  role: UserRole;
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
    const roleRef = ref(database, `user_roles/${userId}`);

    const [profileSnap, roleSnap] = await Promise.all([
      firebaseGet(profileRef),
      firebaseGet(roleRef),
    ]);

    if (!profileSnap.exists()) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }

    const base = profileSnap.val() as ProfileRecord;
    const role = roleSnap.exists() ? ((roleSnap.val() as RoleRecord).role ?? 'user') : 'user';

    setProfile({ ...base, role });
    setIsAdmin(role === 'admin');
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  useEffect(() => {
    let profileUnsub: undefined | (() => void);
    let roleUnsub: undefined | (() => void);

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous listeners
      profileUnsub?.();
      roleUnsub?.();
      profileUnsub = undefined;
      roleUnsub = undefined;

      if (!firebaseUser) {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      const profileRef = ref(database, `profiles/${firebaseUser.uid}`);
      const roleRef = ref(database, `user_roles/${firebaseUser.uid}`);

      profileUnsub = onValue(profileRef, (snapshot) => {
        if (!snapshot.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const base = snapshot.val() as ProfileRecord;
        setProfile((prev) => ({
          ...base,
          role: prev?.role ?? 'user',
        }));
        setLoading(false);
      });

      roleUnsub = onValue(roleRef, (snapshot) => {
        const role = snapshot.exists() ? ((snapshot.val() as RoleRecord).role ?? 'user') : 'user';
        setIsAdmin(role === 'admin');
        setProfile((prev) => (prev ? { ...prev, role } : prev));
        setLoading(false);
      });
    });

    return () => {
      authUnsub();
      profileUnsub?.();
      roleUnsub?.();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Claim "first admin" atomically (prevents multiple users becoming admin)
      const claimRef = ref(database, 'meta/firstAdminUid');
      const claimResult = await runTransaction(claimRef, (current) => current ?? userId);
      const isFirstUser = claimResult.snapshot.val() === userId;

      const now = new Date().toISOString();

      const profileRecord: ProfileRecord = {
        id: userId,
        email,
        full_name: fullName,
        status: isFirstUser ? 'approved' : 'pending',
        created_at: now,
      };

      const roleRecord: RoleRecord = {
        role: isFirstUser ? 'admin' : 'user',
        created_at: now,
      };

      // Store profile + role separately (roles are NOT stored on the profile)
      await Promise.all([
        firebaseSet(ref(database, `profiles/${userId}`), profileRecord),
        firebaseSet(ref(database, `user_roles/${userId}`), roleRecord),
      ]);

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

