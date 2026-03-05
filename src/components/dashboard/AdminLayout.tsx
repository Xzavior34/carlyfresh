import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  SidebarProvider, SidebarTrigger, Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Package, Users, ShoppingCart, Truck, Settings, LogOut, Leaf } from "lucide-react";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Deliveries", url: "/admin/deliveries", icon: Truck },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-r border-border">
          <SidebarHeader className="p-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold tracking-tight font-display text-foreground">CarlyFresh</span>
                <span className="text-[10px] text-muted-foreground font-body">Admin Portal</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="font-body text-[11px] uppercase tracking-wider text-muted-foreground/60">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
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
          </SidebarContent>
          <SidebarFooter className="p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Sign Out" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  <span className="font-body">Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur-sm px-4 md:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary font-body">AD</span>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
