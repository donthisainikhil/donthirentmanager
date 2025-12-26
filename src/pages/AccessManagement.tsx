import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onValue, ref, update } from 'firebase/database';
import { format } from 'date-fns';
import { Check, Clock, Loader2, UserCheck, UserX, Users, X } from 'lucide-react';
import { toast } from 'sonner';

import { database } from '@/lib/firebase';
import { Layout } from '@/components/Layout';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UserStatus = 'pending' | 'approved' | 'rejected';

type ProfileRecord = Omit<Profile, 'role'>;

type RoleRecord = {
  role?: 'admin' | 'user';
  created_at?: string;
};

export default function AccessManagement() {
  const { isAdmin, loading: authLoading, isApproved } = useAuth();

  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, 'admin' | 'user'>>({});
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      console.log('[AccessManagement] Not admin, skipping data fetch');
      return;
    }

    console.log('[AccessManagement] Setting up Firebase listeners');
    const profilesRef = ref(database, 'profiles');
    const rolesRef = ref(database, 'user_roles');

    const unsubProfiles = onValue(profilesRef, (snapshot) => {
      console.log('[AccessManagement] Profiles snapshot received:', snapshot.exists());
      if (snapshot.exists()) {
        const profilesData = snapshot.val();
        console.log('[AccessManagement] Profiles data:', profilesData);
        const list = Object.values(profilesData) as ProfileRecord[];
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setProfiles(list);
      } else {
        console.log('[AccessManagement] No profiles found');
        setProfiles([]);
      }
      setProfilesLoading(false);
    }, (error) => {
      console.error('[AccessManagement] Profiles listener error:', error);
      setProfilesLoading(false);
    });

    const unsubRoles = onValue(rolesRef, (snapshot) => {
      console.log('[AccessManagement] Roles snapshot received:', snapshot.exists());
      const map: Record<string, 'admin' | 'user'> = {};
      if (snapshot.exists()) {
        const rolesData = snapshot.val() as Record<string, RoleRecord>;
        console.log('[AccessManagement] Roles data:', rolesData);
        Object.entries(rolesData).forEach(([uid, rec]) => {
          map[uid] = rec?.role === 'admin' ? 'admin' : 'user';
        });
      }
      setRolesByUserId(map);
      setRolesLoading(false);
    }, (error) => {
      console.error('[AccessManagement] Roles listener error:', error);
      setRolesLoading(false);
    });

    return () => {
      unsubProfiles();
      unsubRoles();
    };
  }, [isAdmin]);

  const users: Profile[] = useMemo(() => {
    return profiles.map((p) => ({
      ...p,
      role: rolesByUserId[p.id] ?? 'user',
    })) as Profile[];
  }, [profiles, rolesByUserId]);

  const loading = profilesLoading || rolesLoading;

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    setUpdatingUser(userId);

    try {
      const profileRef = ref(database, `profiles/${userId}`);
      await update(profileRef, { status });
      toast.success(`User ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch {
      toast.error('Failed to update user status');
    }

    setUpdatingUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isApproved) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const approvedCount = users.filter((u) => u.status === 'approved').length;
  const rejectedCount = users.filter((u) => u.status === 'rejected').length;

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning">
            Pending
          </Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-primary text-primary-foreground">Admin</Badge>
    ) : (
      <Badge variant="outline">User</Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Access Management</h1>
          <p className="text-muted-foreground mt-1">Manage user access and approvals</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{approvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{rejectedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Review and manage user access requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell>{getStatusBadge(u.status)}</TableCell>
                        <TableCell>{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          {u.role !== 'admin' && (
                            <div className="flex justify-end gap-2">
                              {u.status !== 'approved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-success hover:text-success hover:bg-success/10"
                                  onClick={() => updateUserStatus(u.id, 'approved')}
                                  disabled={updatingUser === u.id}
                                >
                                  {updatingUser === u.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {u.status !== 'rejected' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => updateUserStatus(u.id, 'rejected')}
                                  disabled={updatingUser === u.id}
                                >
                                  {updatingUser === u.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
