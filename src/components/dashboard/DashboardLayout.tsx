/**
 * DashboardLayout — Global dashboard shell with role-based sidebar
 * TODO: Fetch user role from authentication and render the appropriate sidebar items.
 * DATA SOURCE: Role is currently hardcoded per route. Awaiting auth connection.
 */

import { Outlet, useLocation, Link } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Leaf,
  CreditCard,
  ClipboardList,
  MapPin,
  Wallet,
  ToggleRight,
} from "lucide-react";

// TODO: Derive role from Supabase Auth user metadata
type DashboardRole = "buyer" | "seller" | "driver";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleNavItems: Record<DashboardRole, NavItem[]> = {
  seller: [
    { title: "Overview", url: "/dashboard/seller", icon: LayoutDashboard },
    { title: "Inventory", url: "/dashboard/seller/inventory", icon: Package },
    { title: "Orders", url: "/dashboard/seller/orders", icon: ShoppingCart },
    { title: "Customers", url: "/dashboard/seller/customers", icon: Users },
    { title: "Analytics", url: "/dashboard/seller/analytics", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/seller/settings", icon: Settings },
  ],
  buyer: [
    { title: "My Orders", url: "/dashboard/buyer", icon: ClipboardList },
    { title: "Order History", url: "/dashboard/buyer/history", icon: ShoppingCart },
    { title: "Subscription", url: "/dashboard/buyer/subscription", icon: CreditCard },
    { title: "Settings", url: "/dashboard/buyer/settings", icon: Settings },
  ],
  driver: [
    { title: "Dashboard", url: "/dashboard/driver", icon: LayoutDashboard },
    { title: "Available Jobs", url: "/dashboard/driver/jobs", icon: MapPin },
    { title: "Earnings", url: "/dashboard/driver/earnings", icon: Wallet },
    { title: "Status", url: "/dashboard/driver/status", icon: ToggleRight },
    { title: "Settings", url: "/dashboard/driver/settings", icon: Settings },
  ],
};

const roleTitles: Record<DashboardRole, string> = {
  seller: "Vendor Portal",
  buyer: "Customer Portal",
  driver: "Driver Portal",
};

function getRoleFromPath(pathname: string): DashboardRole {
  if (pathname.includes("/dashboard/driver")) return "driver";
  if (pathname.includes("/dashboard/buyer")) return "buyer";
  return "seller";
}

export default function DashboardLayout() {
  const location = useLocation();
  const role = getRoleFromPath(location.pathname);
  const navItems = roleNavItems[role];
  const portalTitle = roleTitles[role];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-r border-border">
          {/* Brand header */}
          <SidebarHeader className="p-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold tracking-tight font-display text-foreground">
                  CarlyFresh
                </span>
                <span className="text-[10px] text-muted-foreground font-body">
                  {portalTitle}
                </span>
              </div>
            </Link>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-body text-[11px] uppercase tracking-wider text-muted-foreground/60">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span className="font-body">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Portal switcher */}
            <SidebarGroup>
              <SidebarGroupLabel className="font-body text-[11px] uppercase tracking-wider text-muted-foreground/60">
                Switch Portal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {(["buyer", "seller", "driver"] as DashboardRole[]).map((r) => (
                    <SidebarMenuItem key={r}>
                      <SidebarMenuButton
                        asChild
                        isActive={role === r}
                        tooltip={roleTitles[r]}
                      >
                        <Link to={`/dashboard/${r}`}>
                          {r === "buyer" && <ShoppingCart className="h-4 w-4" />}
                          {r === "seller" && <Package className="h-4 w-4" />}
                          {r === "driver" && <Truck className="h-4 w-4" />}
                          <span className="font-body">{roleTitles[r]}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Back to Store">
                  <Link to="/">
                    <LogOut className="h-4 w-4" />
                    <span className="font-body">Back to Store</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            {/* TODO: Add user avatar / notification bell from auth context */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary font-body">CF</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
