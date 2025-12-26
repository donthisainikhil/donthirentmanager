import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { format } from 'date-fns';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Receipt, 
  Loader2, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar
} from 'lucide-react';

import { database } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { useAuth, Profile } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatMonth, getCurrentMonth, getNextMonth, getPrevMonth } from '@/lib/formatters';
import { Property, Unit, Tenant, RentPayment, Expense } from '@/types';

type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

interface UserData {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  payments: RentPayment[];
  expenses: Expense[];
}

export default function AdminDataViewer() {
  const { isAdmin, loading: authLoading, isApproved } = useAuth();

  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [usersData, setUsersData] = useState<Record<string, UserData>>({});
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;

    // Load all profiles from Supabase
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setProfiles(data);
      } else {
        setProfiles([]);
      }
    };

    fetchProfiles();

    // Load all users' data from Firebase
    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allUsersData = snapshot.val() as Record<string, any>;
        const processedData: Record<string, UserData> = {};
        
        Object.entries(allUsersData).forEach(([userId, userData]) => {
          processedData[userId] = {
            properties: userData?.properties ? Object.values(userData.properties) : [],
            units: userData?.units ? Object.values(userData.units) : [],
            tenants: userData?.tenants ? Object.values(userData.tenants) : [],
            payments: userData?.payments ? Object.values(userData.payments) : [],
            expenses: userData?.expenses ? Object.values(userData.expenses) : [],
          };
        });
        
        setUsersData(processedData);
      } else {
        setUsersData({});
      }
      setLoading(false);
    });

    return () => {
      unsubUsers();
    };
  }, [isAdmin]);

  const filteredData = useMemo(() => {
    let baseData: UserData & { properties: any[]; units: any[]; tenants: any[]; payments: any[]; expenses: any[] };
    
    if (selectedUserId === 'all') {
      // Combine all users' data
      baseData = {
        properties: [],
        units: [],
        tenants: [],
        payments: [],
        expenses: [],
      };
      
      Object.entries(usersData).forEach(([userId, data]) => {
        baseData.properties.push(...data.properties.map(p => ({ ...p, _userId: userId })));
        baseData.units.push(...data.units.map(u => ({ ...u, _userId: userId })));
        baseData.tenants.push(...data.tenants.map(t => ({ ...t, _userId: userId })));
        baseData.payments.push(...data.payments.map(p => ({ ...p, _userId: userId })));
        baseData.expenses.push(...data.expenses.map(e => ({ ...e, _userId: userId })));
      });
    } else {
      const userData = usersData[selectedUserId];
      baseData = userData ? {
        properties: userData.properties.map(p => ({ ...p, _userId: selectedUserId })),
        units: userData.units.map(u => ({ ...u, _userId: selectedUserId })),
        tenants: userData.tenants.map(t => ({ ...t, _userId: selectedUserId })),
        payments: userData.payments.map(p => ({ ...p, _userId: selectedUserId })),
        expenses: userData.expenses.map(e => ({ ...e, _userId: selectedUserId })),
      } : {
        properties: [],
        units: [],
        tenants: [],
        payments: [],
        expenses: [],
      };
    }
    
    // Filter payments by selected month
    baseData.payments = baseData.payments.filter((payment: any) => payment.month === selectedMonth);
    
    // Filter expenses by selected month (using createdAt date)
    baseData.expenses = baseData.expenses.filter((expense: any) => {
      if (!expense.createdAt) return false;
      const expenseMonth = format(new Date(expense.createdAt), 'yyyy-MM');
      return expenseMonth === selectedMonth;
    });
    
    return baseData;
  }, [selectedUserId, usersData, selectedMonth]);

  const getUserName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile?.full_name || profile?.email || userId;
  };

  const getUnitInfo = (unitId: string, userId: string) => {
    const userData = usersData[userId];
    if (!userData) return '-';
    const unit = userData.units.find(u => u.id === unitId);
    if (!unit) return '-';
    const property = userData.properties.find(p => p.id === unit.propertyId);
    return `${property?.name || 'Unknown'} - ${unit.unitNumber}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isApproved || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const usersWithData = profiles.filter(p => usersData[p.id]);

  // Calculate stats
  const totalProperties = filteredData.properties.length;
  const totalUnits = filteredData.units.length;
  const totalTenants = filteredData.tenants.length;
  const totalPayments = filteredData.payments.length;
  const totalExpenses = filteredData.expenses.length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Data Viewer</h1>
              <p className="text-muted-foreground mt-1">View all users' property data</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {usersWithData.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Month Selector - Mandatory Filter */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 bg-card rounded-xl border shadow-sm px-4 py-2">
              <Calendar className="h-4 w-4 text-primary" />
              <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-semibold text-lg min-w-[160px] text-center">
                {formatMonth(selectedMonth)}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Units</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTenants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExpenses}</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="units">Units</TabsTrigger>
              <TabsTrigger value="tenants">Tenants</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card>
                <CardHeader>
                  <CardTitle>Properties</CardTitle>
                  <CardDescription>All properties across users</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredData.properties.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No properties found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {selectedUserId === 'all' && <TableHead>Owner</TableHead>}
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Total Units</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.properties.map((property: any) => (
                            <TableRow key={`${property._userId || ''}-${property.id}`}>
                              {selectedUserId === 'all' && (
                                <TableCell>
                                  <Badge variant="outline">{getUserName(property._userId)}</Badge>
                                </TableCell>
                              )}
                              <TableCell className="font-medium">{property.name}</TableCell>
                              <TableCell className="max-w-xs truncate">{property.address}</TableCell>
                              <TableCell>{property.totalUnits}</TableCell>
                              <TableCell>
                                {property.createdAt ? format(new Date(property.createdAt), 'MMM d, yyyy') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="units">
              <Card>
                <CardHeader>
                  <CardTitle>Units</CardTitle>
                  <CardDescription>All units across users</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredData.units.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No units found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {selectedUserId === 'all' && <TableHead>Owner</TableHead>}
                            <TableHead>Unit #</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Monthly Rent</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.units.map((unit: any) => (
                            <TableRow key={`${unit._userId || ''}-${unit.id}`}>
                              {selectedUserId === 'all' && (
                                <TableCell>
                                  <Badge variant="outline">{getUserName(unit._userId)}</Badge>
                                </TableCell>
                              )}
                              <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                              <TableCell>{unit.type}</TableCell>
                              <TableCell>{formatCurrency(unit.monthlyRent)}</TableCell>
                              <TableCell>
                                <Badge variant={unit.isOccupied ? 'default' : 'secondary'}>
                                  {unit.isOccupied ? 'Occupied' : 'Vacant'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tenants">
              <Card>
                <CardHeader>
                  <CardTitle>Tenants</CardTitle>
                  <CardDescription>All tenants across users</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredData.tenants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No tenants found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {selectedUserId === 'all' && <TableHead>Owner</TableHead>}
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Aadhar</TableHead>
                            <TableHead>Joined</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.tenants.map((tenant: any) => (
                            <TableRow key={`${tenant._userId || ''}-${tenant.id}`}>
                              {selectedUserId === 'all' && (
                                <TableCell>
                                  <Badge variant="outline">{getUserName(tenant._userId)}</Badge>
                                </TableCell>
                              )}
                              <TableCell className="font-medium">
                                {tenant.firstName} {tenant.lastName}
                              </TableCell>
                              <TableCell>{tenant.phone}</TableCell>
                              <TableCell>{tenant.aadharNumber || '-'}</TableCell>
                              <TableCell>
                                {tenant.createdAt ? format(new Date(tenant.createdAt), 'MMM d, yyyy') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                  <CardDescription>All payments across users</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredData.payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No payments found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {selectedUserId === 'all' && <TableHead>Owner</TableHead>}
                            <TableHead>Unit</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Paid Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.payments.map((payment: any) => (
                            <TableRow key={`${payment._userId || ''}-${payment.id}`}>
                              {selectedUserId === 'all' && (
                                <TableCell>
                                  <Badge variant="outline">{getUserName(payment._userId)}</Badge>
                                </TableCell>
                              )}
                              <TableCell className="font-medium">{getUnitInfo(payment.unitId, payment._userId)}</TableCell>
                              <TableCell>{formatMonth(payment.month)}</TableCell>
                              <TableCell>{formatCurrency(payment.totalAmount)}</TableCell>
                              <TableCell>{formatCurrency(payment.paidAmount)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    payment.status === 'paid' ? 'default' :
                                    payment.status === 'overdue' ? 'destructive' : 'secondary'
                                  }
                                >
                                  {payment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses">
              <Card>
                <CardHeader>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>All expenses across users</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredData.expenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No expenses found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {selectedUserId === 'all' && <TableHead>Owner</TableHead>}
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData.expenses.map((expense: any) => (
                            <TableRow key={`${expense._userId || ''}-${expense.id}`}>
                              {selectedUserId === 'all' && (
                                <TableCell>
                                  <Badge variant="outline">{getUserName(expense._userId)}</Badge>
                                </TableCell>
                              )}
                              <TableCell className="font-medium">{expense.description}</TableCell>
                              <TableCell>{expense.category}</TableCell>
                              <TableCell>{formatCurrency(expense.amount)}</TableCell>
                              <TableCell>
                                {expense.createdAt ? format(new Date(expense.createdAt), 'MMM d, yyyy') : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
