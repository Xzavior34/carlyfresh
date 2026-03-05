import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function AdminUsers() {
  const [users, setUsers] = useState<(Profile & { role?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [profRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);
      if (profRes.data && rolesRes.data) {
        const roleMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
        setUsers(profRes.data.map((p) => ({ ...p, role: roleMap.get(p.user_id) || "buyer" })));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <p className="text-muted-foreground font-body p-8">Loading users…</p>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground font-body text-sm">{users.length} registered users</p>
      </div>
      <Card className="border border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Name</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Role</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Business</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium font-body text-foreground">{u.full_name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary" className="font-body text-[11px] capitalize">{u.role}</Badge></TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{u.business_name || "—"}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-body">No users yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
