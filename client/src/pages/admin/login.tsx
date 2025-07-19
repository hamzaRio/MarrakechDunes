import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function AdminLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Login failed");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success", 
        description: "Login successful",
      });
      // Redirect based on user role
      if (data.user?.role === "superadmin") {
        setLocation("/admin/ceo");
      } else {
        setLocation("/admin");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-moroccan-blue via-blue-900 to-moroccan-blue flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-repeat bg-gradient-to-r from-transparent via-white to-transparent"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-moroccan-gold rounded-full flex items-center justify-center mb-6 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-2 text-4xl font-bold text-white drop-shadow-lg">
            {t('admin.adminAccess')}
          </h2>
          <p className="mt-3 text-lg text-blue-100 drop-shadow">
            {t('admin.loginSubtitle')}
          </p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-moroccan-gold to-yellow-500 text-white text-center py-8">
            <CardTitle className="text-2xl font-bold">
              MarrakechDunes Admin
            </CardTitle>
            <p className="text-yellow-100 mt-2">Management Portal</p>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        {t('admin.username')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="text"
                          placeholder="Enter your username"
                          className="h-12 border-2 border-gray-200 focus:border-moroccan-blue focus:ring-moroccan-blue/20 rounded-lg text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        {t('admin.password')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password"
                          placeholder="Enter your password"
                          className="h-12 border-2 border-gray-200 focus:border-moroccan-blue focus:ring-moroccan-blue/20 rounded-lg text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-moroccan-red to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-lg rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t('admin.signingIn')}</span>
                    </div>
                  ) : (
                    t('admin.signIn')
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-blue-100 text-sm">
            Authorized Personnel Only • MarrakechDunes 2025
          </p>
        </div>
      </div>
    </div>
  );
}