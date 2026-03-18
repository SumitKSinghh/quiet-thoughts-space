import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, CreditCard, Activity, LogOut, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

interface SubRow {
  id: string;
  user_id: string;
  user_email: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const AdminDashboard = () => {
  const { isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, loading, navigate]);

  const fetchData = async () => {
    setLoadingData(true);
    const [usersRes, subsRes] = await Promise.all([
      supabase.rpc("admin_get_all_users"),
      supabase.rpc("admin_get_all_subscriptions"),
    ]);

    if (usersRes.data) setUsers(usersRes.data as UserRow[]);
    if (subsRes.data) setSubscriptions(subsRes.data as SubRow[]);
    setLoadingData(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleUpdateSubscription = async (subId: string, newStatus: string) => {
    const { error } = await supabase.rpc("admin_update_subscription", {
      _subscription_id: subId,
      _status: newStatus as any,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Subscription status updated." });
      fetchData();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const activeSubsCount = subscriptions.filter((s) => s.status === "active").length;
  const totalRevenue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-slate-300 hover:text-white">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:text-white">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                  <p className="text-sm text-slate-400">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{activeSubsCount}</p>
                  <p className="text-sm text-slate-400">Active Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
                  <p className="text-sm text-slate-400">Total Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/60 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-amber-400" />
                <div>
                  <p className="text-2xl font-bold text-white">₹{totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-slate-400">Active Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="users" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Users
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black">
              Subscriptions
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-slate-400">Loading...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Email</TableHead>
                          <TableHead className="text-slate-300">Signed Up</TableHead>
                          <TableHead className="text-slate-300">Last Sign In</TableHead>
                          <TableHead className="text-slate-300">Subscription</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => {
                          const sub = subscriptions.find((s) => s.user_id === user.id && s.status === "active");
                          return (
                            <TableRow key={user.id} className="border-slate-700">
                              <TableCell className="text-white font-medium">{user.email}</TableCell>
                              <TableCell className="text-slate-300">
                                {format(new Date(user.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {user.last_sign_in_at
                                  ? format(new Date(user.last_sign_in_at), "MMM d, yyyy HH:mm")
                                  : "Never"}
                              </TableCell>
                              <TableCell>
                                {sub ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {sub.plan} — Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-slate-700 text-slate-400">
                                    Free
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="bg-slate-800/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">All Subscriptions ({subscriptions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <p className="text-slate-400">Loading...</p>
                ) : subscriptions.length === 0 ? (
                  <p className="text-slate-400">No subscriptions found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">User</TableHead>
                          <TableHead className="text-slate-300">Plan</TableHead>
                          <TableHead className="text-slate-300">Amount</TableHead>
                          <TableHead className="text-slate-300">Status</TableHead>
                          <TableHead className="text-slate-300">Ends At</TableHead>
                          <TableHead className="text-slate-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((sub) => (
                          <TableRow key={sub.id} className="border-slate-700">
                            <TableCell className="text-white">{sub.user_email || "Unknown"}</TableCell>
                            <TableCell className="text-slate-300 capitalize">{sub.plan}</TableCell>
                            <TableCell className="text-slate-300">
                              {sub.currency === "INR" ? "₹" : "$"}{sub.amount}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  sub.status === "active"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : sub.status === "cancelled"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-slate-600 text-slate-300"
                                }
                              >
                                {sub.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {sub.ends_at ? format(new Date(sub.ends_at), "MMM d, yyyy") : "—"}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={sub.status}
                                onValueChange={(val) => handleUpdateSubscription(sub.id, val)}
                              >
                                <SelectTrigger className="w-[130px] bg-slate-700 border-slate-600 text-white text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                  <SelectItem value="expired">Expired</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                              </Select>
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
      </main>
    </div>
  );
};

export default AdminDashboard;
