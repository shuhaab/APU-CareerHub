"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ClipboardList,
  CircleHelp,
  FileText,
  KeyRound,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PortalNotification, UserProfile, UserRole } from "@/types";

const roleNavigation = {
  student: [
    { href: "/student", label: "Overview", icon: LayoutDashboard },
    { href: "/student/jobs", label: "Find jobs", icon: Search },
    { href: "/student/applications", label: "My applications", icon: ClipboardList },
    { href: "/student/documents", label: "Documents", icon: FileText },
    { href: "/student/profile", label: "Profile", icon: UserRound },
  ],
  employer: [
    { href: "/employer", label: "Overview", icon: LayoutDashboard },
    { href: "/employer/vacancies", label: "Vacancies", icon: BriefcaseBusiness },
    { href: "/employer/applications", label: "Applications", icon: ClipboardList },
    { href: "/employer/profile", label: "Department profile", icon: Building2 },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: UsersRound },
    { href: "/admin/vacancies", label: "Vacancies", icon: BriefcaseBusiness },
    { href: "/admin/applications", label: "Applications", icon: ClipboardList },
    { href: "/admin/audit-logs", label: "Audit logs", icon: ShieldCheck },
  ],
} satisfies Record<UserRole, { href: string; label: string; icon: typeof LayoutDashboard }[]>;

const roleLabels = { student: "Student portal", employer: "Employer portal", admin: "Admin portal" };

function Navigation({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1.5" aria-label={`${role} navigation`}>
      {roleNavigation[role].map((item) => {
        const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/11 text-white shadow-sm"
                : "text-white/62 hover:bg-white/7 hover:text-white",
            )}
          >
            <item.icon className={cn("size-[18px]", active ? "text-[#ff6da4]" : "text-white/55")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const supportHref = `/${role}/support`;
  const supportActive = pathname === supportHref;
  return (
    <div className="flex h-full flex-col bg-[#1d294a] px-4 py-5 text-white">
      <div className="px-2"><BrandMark className="[&_span:last-child_span]:text-white" /></div>
      <div className="mx-2 my-6 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Workspace</p>
        <p className="mt-1.5 text-sm font-semibold text-white">{roleLabels[role]}</p>
      </div>
      <Navigation role={role} />
      <div className="mt-auto grid gap-1.5 border-t border-white/10 pt-4">
        <Link
          href={supportHref}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            supportActive ? "bg-white/11 text-white shadow-sm" : "text-white/62 hover:bg-white/7 hover:text-white",
          )}
        >
          <CircleHelp className={cn("size-[18px]", supportActive ? "text-[#ff6da4]" : "text-white/55")} /> Help & support
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}

const notificationIcons = {
  application: ClipboardList,
  vacancy: BriefcaseBusiness,
  employer: Building2,
};

export function AppShell({ role, profile, notifications, children }: { role: UserRole; profile: UserProfile; notifications: PortalNotification[]; children: React.ReactNode }) {
  const initials = profile.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AP";
  const meta = role === "student" ? profile.studentId : role === "employer" ? profile.department : "System administrator";
  const attentionCount = notifications.filter((notification) => notification.attention).length;
  const allNotificationsHref = role === "student" ? "/student/applications" : role === "employer" ? "/employer/applications" : "/admin";
  return (
    <div className="min-h-screen min-w-0 bg-[#f5f7fb] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] lg:block">
        <SidebarContent role={role} />
      </aside>
      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-18 items-center gap-4 border-b border-slate-200 bg-white/92 px-4 backdrop-blur-xl sm:px-7">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open dashboard navigation" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] border-0 p-0">
              <SheetHeader className="sr-only"><SheetTitle>Dashboard navigation</SheetTitle></SheetHeader>
              <SidebarContent role={role} />
            </SheetContent>
          </Sheet>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="h-10 border-slate-200 bg-slate-50 pl-9 shadow-none" placeholder="Search jobs, applications, or people" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative rounded-full text-slate-500" aria-label={attentionCount ? `Notifications, ${attentionCount} requiring attention` : "Notifications"} />}>
                <Bell className="size-5" />
                {attentionCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full border-2 border-white bg-[#d91b62] px-1 text-[9px] font-bold leading-3 text-white">{Math.min(attentionCount, 9)}{attentionCount > 9 ? "+" : ""}</span>}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="font-bold text-[#18233f]">Notifications</p><p className="mt-0.5 text-xs text-slate-400">Recent portal activity</p></div>{attentionCount > 0 && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#d91b62]">{attentionCount} need attention</span>}</div>
                <div className="max-h-[25rem] overflow-y-auto p-1.5">
                  {notifications.map((notification) => {
                    const Icon = notificationIcons[notification.kind];
                    return <DropdownMenuItem key={notification.id} render={<Link href={notification.href} className="items-start px-3 py-3" />}><span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${notification.attention ? "bg-rose-50 text-[#d91b62]" : "bg-slate-100 text-[#24345c]"}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#18233f]">{notification.title}</span><span className="mt-1 block truncate text-xs text-slate-500">{notification.message}</span><span className="mt-1.5 block text-[11px] text-slate-400">{notification.createdAt}</span></span>{notification.attention && <span className="mt-2 size-2 shrink-0 rounded-full bg-[#d91b62]" />}</DropdownMenuItem>;
                  })}
                  {notifications.length === 0 && <div className="px-5 py-10 text-center"><span className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400"><Bell className="size-5" /></span><p className="mt-3 text-sm font-semibold text-slate-700">You’re all caught up</p><p className="mt-1 text-xs text-slate-400">New portal activity will appear here.</p></div>}
                </div>
                {notifications.length > 0 && <div className="border-t border-slate-100 p-2"><Button variant="ghost" size="sm" asChild className="w-full justify-center text-[#24345c]"><Link href={allNotificationsHref}>View related activity</Link></Button></div>}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="h-auto gap-3 rounded-xl px-2 py-1.5" />}>
                  <Avatar className="size-9">{profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={`${profile.fullName}'s profile picture`} />}<AvatarFallback className="bg-[#eef1f7] text-xs font-bold text-[#24345c]">{initials}</AvatarFallback></Avatar>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-semibold text-slate-800">{profile.fullName}</span>
                    <span className="block text-xs text-slate-400">{meta}</span>
                  </span>
                  <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {role !== "admin" && <DropdownMenuItem render={<Link href={`/${role}/profile`} />}><UserRound className="size-4" /> Profile</DropdownMenuItem>}
                  <DropdownMenuItem render={<Link href={`/${role}/account`} />}><Settings className="size-4" /> Account settings</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <div className="p-1"><LogoutButton compact /></div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto min-w-0 max-w-[1500px] p-4 sm:p-7 lg:p-8">
          {profile.mustChangePassword && (
            <div className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3"><KeyRound className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">Replace your temporary password</p><p className="mt-1 text-sm text-amber-900/75">Administrator actions remain locked until you choose a private password.</p></div></div>
              <Button asChild className="bg-amber-900 text-white hover:bg-amber-950"><Link href={`/${role}/account?passwordChange=required`}>Change password now</Link></Button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardHeading({ eyebrow, title, description, actions }: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#d91b62]">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#18233f] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">{actions}</div>}
    </div>
  );
}
