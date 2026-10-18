import Link from "next/link";
import { LayoutDashboard, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getSessionUser, type SessionUser } from "@/lib/auth/server";

const navigation = [
  { href: "/jobs", label: "Find jobs" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-employers", label: "For employers" },
  { href: "/#support", label: "Support" },
];

export async function PublicHeader({ sessionUser }: { sessionUser?: SessionUser | null } = {}) {
  const user = sessionUser === undefined ? await getSessionUser() : sessionUser;
  const dashboardHref = user ? `/${user.role}` : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <BrandMark />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-[#d91b62]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          {user && dashboardHref ? (
            <>
              <span className="hidden text-sm text-slate-500 xl:inline">Welcome, <strong className="font-semibold text-slate-700">{user.profile.fullName.split(" ")[0]}</strong></span>
              <LogoutButton compact className="w-auto rounded-lg px-3 py-2 text-slate-600" />
              <Button asChild className="bg-[#24345c] text-white shadow-sm hover:bg-[#18233f]"><Link href={dashboardHref}><LayoutDashboard className="size-4" /> Dashboard</Link></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-slate-700"><Link href="/login">Sign in</Link></Button>
              <Button asChild className="bg-[#24345c] text-white shadow-sm hover:bg-[#18233f]"><Link href="/register">Create account</Link></Button>
            </>
          )}
        </div>
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open navigation menu" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[88%] p-6">
            <SheetHeader className="p-0 text-left">
              <SheetTitle><BrandMark /></SheetTitle>
            </SheetHeader>
            <nav className="mt-10 flex flex-col gap-1" aria-label="Mobile navigation">
              {navigation.map((item) => (
                <SheetClose render={<Link href={item.href} />} nativeButton={false} key={item.href}>
                  <span className="block rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100">
                    {item.label}
                  </span>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-8 grid gap-3">
              {user && dashboardHref ? <><Button asChild className="bg-[#24345c] text-white"><Link href={dashboardHref}><LayoutDashboard className="size-4" /> Go to dashboard</Link></Button><LogoutButton compact className="justify-center rounded-lg border border-slate-200 py-2.5" /></> : <><Button variant="outline" asChild><Link href="/login">Sign in</Link></Button><Button asChild className="bg-[#24345c] text-white"><Link href="/register">Create account</Link></Button></>}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
