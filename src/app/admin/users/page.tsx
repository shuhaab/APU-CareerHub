import { ApproveEmployerButton, SetUserActiveButton } from "@/components/admin-user-actions";
import { DashboardHeading } from "@/components/app-shell";
import { CreateAdministratorDialog } from "@/components/create-administrator-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { enforcePageRole } from "@/lib/auth/server";
import { getAllUsers } from "@/lib/data/firestore";
import type { UserProfile } from "@/types";

function UsersTable({ users, currentAdminId, canManageAdmins, view = "all" }: {
  users: UserProfile[];
  currentAdminId: string;
  canManageAdmins: boolean;
  view?: "all" | "administrators" | "pending";
}) {
  const rows = view === "pending"
    ? users.filter((user) => user.requestedRole === "employer" && !user.approved)
    : view === "administrators"
      ? users.filter((user) => user.role === "admin")
      : users;
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Identifier</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((user) => {
            const initials = user.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
            const awaitingApproval = user.requestedRole === "employer" && !user.approved;
            return (
              <TableRow key={user.id}>
                <TableCell><div className="flex items-center gap-3"><Avatar className="size-9">{user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.fullName}'s profile picture`} />}<AvatarFallback className="bg-muted text-xs font-bold text-foreground">{initials}</AvatarFallback></Avatar><div><p className="font-semibold text-foreground">{user.fullName}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div></TableCell>
                <TableCell><div className="flex flex-wrap gap-1.5"><Badge variant="secondary" className="capitalize">{user.role}</Badge>{user.canManageAdmins && <Badge className="bg-primary text-primary-foreground">Primary admin</Badge>}</div></TableCell>
                <TableCell className="text-muted-foreground">{user.studentId ?? user.department ?? "System account"}</TableCell>
                <TableCell><Badge variant="outline" className={awaitingApproval ? "border-amber-200 bg-amber-50 text-amber-700" : user.accountActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}>{user.accountStatusRequested !== undefined ? "Account change pending" : awaitingApproval ? "Pending approval" : user.accountActive ? "Active" : "Deactivated"}</Badge></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {awaitingApproval && user.accountActive && <ApproveEmployerButton employerId={user.id} />}
                    {user.id !== currentAdminId && (user.role !== "admin" || canManageAdmins) && <SetUserActiveButton userId={user.id} active={user.accountStatusRequested ?? !user.accountActive} retry={user.accountStatusRequested !== undefined} />}
                    {!awaitingApproval && user.id === currentAdminId && <span className="text-xs font-medium text-muted-foreground">Current account</span>}
                    {!awaitingApproval && user.role === "admin" && user.id !== currentAdminId && !canManageAdmins && <span className="text-xs font-medium text-muted-foreground">Primary admin only</span>}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No matching user accounts.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function AdminUsersPage() {
  const admin = await enforcePageRole("admin");
  const users = await getAllUsers();
  const canManageAdmins = admin.profile.canManageAdmins === true;
  const pendingCount = users.filter((user) => user.requestedRole === "employer" && !user.approved).length;
  const administratorCount = users.filter((user) => user.role === "admin").length;
  return (
    <div>
      <DashboardHeading
        title="Users and access"
        description="Manage database-backed student, employer, and administrator accounts from one controlled directory."
        actions={canManageAdmins ? <CreateAdministratorDialog /> : undefined}
      />
      <Tabs defaultValue="all" className="mt-6">
        <TabsList><TabsTrigger value="all">All users ({users.length})</TabsTrigger><TabsTrigger value="administrators">Administrators ({administratorCount})</TabsTrigger><TabsTrigger value="pending">Pending employer access ({pendingCount})</TabsTrigger></TabsList>
        <TabsContent value="all"><UsersTable users={users} currentAdminId={admin.uid} canManageAdmins={canManageAdmins} /></TabsContent>
        <TabsContent value="administrators"><UsersTable users={users} currentAdminId={admin.uid} canManageAdmins={canManageAdmins} view="administrators" /></TabsContent>
        <TabsContent value="pending"><UsersTable users={users} currentAdminId={admin.uid} canManageAdmins={canManageAdmins} view="pending" /></TabsContent>
      </Tabs>
    </div>
  );
}
