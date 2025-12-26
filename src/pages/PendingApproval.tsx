import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-card animate-fade-in text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Pending Approval</CardTitle>
            <CardDescription className="mt-2">
              Your account is awaiting admin approval
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Hi {profile?.full_name || 'there'}! Your account has been created successfully. 
            An administrator will review your request and grant you access soon.
          </p>
          <p className="text-sm text-muted-foreground">
            You'll be able to access the app once your account is approved.
          </p>
          <Button variant="outline" onClick={signOut} className="w-full mt-4">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
