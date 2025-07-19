
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Shield, LogOut, Trash2, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
);

import { auth } from "@/lib/firebase";
import { signOut, deleteUser } from "firebase/auth";
import { useRouter } from "next/navigation";

export function AccountManagementForm() {
  const { toast } = useToast();
  const router = useRouter();

  const handleChangeRole = () => {
    toast({
      title: "Role Changed",
      description: "Page will refresh to apply new permissions.",
    });
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteUser(user);
        toast({
          variant: "destructive",
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
        });
        router.push("/");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error Deleting Account",
          description: error.message,
        });
      }
    }
  };


  return (
    <div className="space-y-8 max-w-2xl">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Account Type" value="Admin" />
          <Separator />
          <InfoRow label="User ID" value="mock-user-12345" />
          <Separator />
          <InfoRow label="Created" value="1/1/2022" />
        </CardContent>
      </Card>

      {/* Role Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Role Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6">
            <p className="font-bold text-sm">Development Feature</p>
            <p className="text-xs">
              Change your account role to test different access levels. This will
              refresh the page to apply the new role and update navigation
              permissions.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Role</label>
            <div className="flex items-center gap-4">
                <Select defaultValue="admin">
                    <SelectTrigger className="w-[180px]">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleChangeRole}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Change Role
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
            <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                        Continue
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
