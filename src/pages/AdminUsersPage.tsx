import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Search, Users, ShieldCheck, UserX, Crown, Hash, ChevronLeft, ChevronRight, Copy, Mail, Phone, Building2, Calendar, CreditCard, FileText, Briefcase } from "lucide-react";
import { adminApi, type AdminUser, type AdminStats } from "@/lib/api-client";
import MainLayout from "@/components/layout/MainLayout";

const PAGE_SIZE = 15;

export default function AdminUsersPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ id: number; name: string; currentRole: string } | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ id: number; name: string; active: boolean } | null>(null);

  const statsQuery = useQuery<AdminStats>({ queryKey: ["admin", "stats"], queryFn: () => adminApi.getStats() });
  const usersQuery = useQuery({
    queryKey: ["admin", "users", search, roleFilter, statusFilter, planFilter, page],
    queryFn: () => adminApi.listUsers({
      search: search || undefined,
      role: roleFilter !== "all" ? roleFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      plan: planFilter !== "all" ? planFilter : undefined,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.changeRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin"] }); setRoleChangeTarget(null); toast({ title: "Role updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => adminApi.changeStatus(id, active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin"] }); setStatusChangeTarget(null); toast({ title: "Status updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const users = usersQuery.data?.users || [];
  const total = usersQuery.data?.total || 0;
  const stats = statsQuery.data;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const roleBadge = (role: string) => {
    if (role === "admin") return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Admin</Badge>;
    if (role === "disabled") return <Badge variant="destructive">Disabled</Badge>;
    return <Badge variant="secondary">User</Badge>;
  };

  const planBadge = (sub: AdminUser["subscription"]) => {
    if (!sub) return <Badge variant="outline" className="text-gray-400">None</Badge>;
    const colors: Record<string, string> = {
      free_trial: "bg-amber-50 text-amber-700 border-amber-200",
      starter: "bg-blue-50 text-blue-700 border-blue-200",
      professional: "bg-emerald-50 text-emerald-700 border-emerald-200",
      enterprise: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return <Badge className={colors[sub.plan] || "bg-gray-50 text-gray-700"}>{sub.plan.replace("_", " ")}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-purple-600" />
            User Management
          </h1>
          <p className="mt-1 text-gray-500">Manage all registered users of the platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: stats?.totalUsers ?? "—", icon: Users, color: "text-blue-600" },
            { label: "Active Users", value: stats?.activeUsers ?? "—", icon: Users, color: "text-emerald-600" },
            { label: "Admins", value: stats?.adminUsers ?? "—", icon: ShieldCheck, color: "text-purple-600" },
            { label: "On Trial", value: stats?.trialUsers ?? "—", icon: Crown, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{s.value}</div></CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search by name, email, or User ID (OKB-XXXXX)..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10" />
              </div>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free Tier</SelectItem>
                  <SelectItem value="free_trial">Free Trial</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden xl:table-cell">Usage</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b"><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" /></td></tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      <UserX className="mx-auto h-10 w-10 mb-2" />No users found
                    </td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          <Hash className="h-2.5 w-2.5" />{u.userCode || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{u.companyName || "—"}</td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{planBadge(u.subscription)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">{fmt(u.createdAt)}</td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>{u.stats.invoices} inv</span>
                          <span>{u.stats.clients} clients</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setRoleChangeTarget({ id: u.id, name: `${u.firstName} ${u.lastName}`, currentRole: u.role })}>
                            Role
                          </Button>
                          <Button variant="ghost" size="sm" className={`text-xs h-7 ${u.role === "disabled" ? "text-emerald-600" : "text-red-600"}`}
                            onClick={() => setStatusChangeTarget({ id: u.id, name: `${u.firstName} ${u.lastName}`, active: u.role === "disabled" })}>
                            {u.role === "disabled" ? "Enable" : "Disable"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-gray-500">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={(o) => { if (!o) setSelectedUser(null); }}>
          <DialogContent className="max-w-lg">
            {selectedUser && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedUser.firstName} {selectedUser.lastName}
                    {roleBadge(selectedUser.role)}
                  </DialogTitle>
                  <DialogDescription>
                    <span className="inline-flex items-center gap-1 font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-xs">
                      <Hash className="h-3 w-3" />{selectedUser.userCode || "—"}
                    </span>
                    <button className="ml-2 text-gray-400 hover:text-gray-600" onClick={() => { navigator.clipboard.writeText(selectedUser.userCode || ""); toast({ title: "Copied!" }); }}>
                      <Copy className="h-3 w-3 inline" />
                    </button>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4" />{selectedUser.email}</div>
                    {selectedUser.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4" />{selectedUser.phone}</div>}
                    {selectedUser.companyName && <div className="flex items-center gap-2 text-gray-600"><Building2 className="h-4 w-4" />{selectedUser.companyName}</div>}
                    <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4" />Joined {fmt(selectedUser.createdAt)}</div>
                  </div>
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" />Subscription</h4>
                    {selectedUser.subscription ? (
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Plan: {planBadge(selectedUser.subscription)}</div>
                        <div>Status: <Badge variant={selectedUser.subscription.status === "active" ? "default" : "secondary"}>{selectedUser.subscription.status}</Badge></div>
                        {selectedUser.subscription.trialEndsAt && <div className="col-span-2">Trial ends: {fmt(selectedUser.subscription.trialEndsAt)}</div>}
                      </div>
                    ) : <p className="text-gray-400">No active subscription</p>}
                  </div>
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2"><FileText className="h-4 w-4" />Platform Usage</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Invoices", value: selectedUser.stats.invoices },
                        { label: "Clients", value: selectedUser.stats.clients },
                        { label: "Proposals", value: selectedUser.stats.proposals },
                      ].map((s) => (
                        <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold">{s.value}</div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {(selectedUser.panNumber || selectedUser.gstin) && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4" />Business Info</h4>
                      <div className="grid grid-cols-2 gap-2 text-gray-600 text-xs">
                        {selectedUser.panNumber && <div>PAN: <span className="font-mono">{selectedUser.panNumber}</span></div>}
                        {selectedUser.gstin && <div>GSTIN: <span className="font-mono">{selectedUser.gstin}</span></div>}
                        {selectedUser.companyType && <div>Type: {selectedUser.companyType}</div>}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedUser(null); setRoleChangeTarget({ id: selectedUser.id, name: `${selectedUser.firstName} ${selectedUser.lastName}`, currentRole: selectedUser.role }); }}>
                    Change Role
                  </Button>
                  <Button variant={selectedUser.role === "disabled" ? "default" : "destructive"} size="sm"
                    onClick={() => { setSelectedUser(null); setStatusChangeTarget({ id: selectedUser.id, name: `${selectedUser.firstName} ${selectedUser.lastName}`, active: selectedUser.role === "disabled" }); }}>
                    {selectedUser.role === "disabled" ? "Activate" : "Deactivate"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Role Change Dialog */}
        <AlertDialog open={!!roleChangeTarget} onOpenChange={(o) => { if (!o) setRoleChangeTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Role — {roleChangeTarget?.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Current role: <strong>{roleChangeTarget?.currentRole}</strong>. Select the new role:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {roleChangeTarget?.currentRole !== "admin" && (
                <AlertDialogAction className="bg-purple-600 hover:bg-purple-700" onClick={() => roleChangeTarget && roleMutation.mutate({ id: roleChangeTarget.id, role: "admin" })}>
                  Promote to Admin
                </AlertDialogAction>
              )}
              {roleChangeTarget?.currentRole !== "user" && (
                <AlertDialogAction onClick={() => roleChangeTarget && roleMutation.mutate({ id: roleChangeTarget.id, role: "user" })}>
                  Set as User
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Change Dialog */}
        <AlertDialog open={!!statusChangeTarget} onOpenChange={(o) => { if (!o) setStatusChangeTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{statusChangeTarget?.active ? "Activate" : "Deactivate"} — {statusChangeTarget?.name}</AlertDialogTitle>
              <AlertDialogDescription>
                {statusChangeTarget?.active
                  ? "This will re-enable the user's account, allowing them to log in again."
                  : "This will prevent the user from logging in. Their data will be preserved."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={statusChangeTarget?.active ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                onClick={() => statusChangeTarget && statusMutation.mutate({ id: statusChangeTarget.id, active: statusChangeTarget.active })}
              >
                {statusChangeTarget?.active ? "Activate" : "Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
