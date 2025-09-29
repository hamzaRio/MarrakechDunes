import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Download, Users, Shield } from "lucide-react";

interface Admin {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function AdminManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'admin' });

  // Fetch admins
  const { data: admins, isLoading } = useQuery<Admin[]>({
    queryKey: ["/superadmin/admins"],
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (adminData: { username: string; password: string; role: string }) => {
      return apiFetch("/superadmin/admins", {
        method: "POST",
        data: adminData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/superadmin/admins"] });
      setIsCreateDialogOpen(false);
      setNewAdmin({ username: '', password: '', role: 'admin' });
      toast({
        title: "Success",
        description: "Admin created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create admin",
        variant: "destructive",
      });
    }
  });

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      return apiFetch(`/superadmin/admins/${adminId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/superadmin/admins"] });
      toast({
        title: "Success",
        description: "Admin deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete admin",
        variant: "destructive",
      });
    }
  });

  // Export functions
  const handleExportBookings = async () => {
    try {
      const response = await fetch('/api/admin/export/bookings');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookings.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export bookings",
        variant: "destructive",
      });
    }
  };

  const handleExportAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/export/audit-logs');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-logs.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive",
      });
    }
  };

  const handleCreateAdmin = () => {
    if (!newAdmin.username || !newAdmin.password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    createAdminMutation.mutate(newAdmin);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
          <p className="text-gray-600">Manage admin users and export reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportBookings} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Bookings
          </Button>
          <Button onClick={handleExportAuditLogs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Audit Logs
          </Button>
        </div>
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Admin
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAdmin}
                disabled={createAdminMutation.isPending}
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Users ({admins?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins?.map((admin) => (
              <div key={admin._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-moroccan-blue" />
                  <div>
                    <p className="font-medium">{admin.username}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'}>
                    {admin.role}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete admin "{admin.username}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteAdminMutation.mutate(admin._id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
