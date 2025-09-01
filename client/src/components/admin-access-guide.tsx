import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Key, Users, Crown, Settings, Monitor } from "lucide-react";

export default function AdminAccessGuide() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="font-playfair text-3xl font-bold text-moroccan-blue">
          🏛️ MarrakechDunes Admin Access Guide
        </h1>
        <p className="text-gray-600 text-lg">
          Complete guide to access and manage the tourism booking platform
        </p>
      </div>

      {/* Quick Access */}
      <Card className="border-moroccan-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center text-moroccan-blue">
            <Key className="h-5 w-5 mr-2" />
            🚀 Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              className="h-16 bg-moroccan-red hover:bg-red-600 text-white"
              onClick={() => window.open('/admin/login', '_self')}
            >
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-1" />
                <div className="font-bold">Admin Login</div>
                <div className="text-xs opacity-90">Access Dashboard</div>
              </div>
            </Button>
            <Button 
              className="h-16 bg-moroccan-gold hover:bg-yellow-600 text-white"
              onClick={() => window.open('/admin/dashboard', '_self')}
            >
              <div className="text-center">
                <Monitor className="h-6 w-6 mx-auto mb-1" />
                <div className="font-bold">Admin Dashboard</div>
                <div className="text-xs opacity-90">Manage Platform</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Access URLs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-moroccan-blue">
            <Settings className="h-5 w-5 mr-2" />
            📍 Access URLs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Admin Login:</span>
              <code className="bg-blue-100 px-2 py-1 rounded text-sm text-blue-800">
                /admin/login
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Admin Dashboard:</span>
              <code className="bg-green-100 px-2 py-1 rounded text-sm text-green-800">
                /admin/dashboard
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">CEO Dashboard:</span>
              <code className="bg-purple-100 px-2 py-1 rounded text-sm text-purple-800">
                /admin/ceo-dashboard
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-moroccan-blue">
            <Users className="h-5 w-5 mr-2" />
            👥 User Roles & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <Badge variant="secondary" className="bg-green-600 text-white">
                  Admin
                </Badge>
              </div>
              <h4 className="font-semibold text-green-900 mb-2">Regular Admin Access</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Manage bookings and customer communication</li>
                <li>• Create, edit, and manage activities</li>
                <li>• Upload activity photos and images</li>
                <li>• Update booking status and payments</li>
                <li>• Send WhatsApp notifications</li>
                <li>• View analytics and reports</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center mb-2">
                <Crown className="h-5 w-5 text-purple-600 mr-2" />
                <Badge variant="secondary" className="bg-purple-600 text-white">
                  Superadmin
                </Badge>
              </div>
              <h4 className="font-semibold text-purple-900 mb-2">Full System Access</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• All admin permissions</li>
                <li>• User management and creation</li>
                <li>• System audit logs access</li>
                <li>• Advanced analytics and financial reports</li>
                <li>• Platform configuration settings</li>
                <li>• Database management tools</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Credentials */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-800">
            <Key className="h-5 w-5 mr-2" />
            🔐 Default Login Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-orange-900 mb-2">Superadmin Account:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Username:</span>
                    <code className="block bg-gray-100 p-2 mt-1 rounded">admin</code>
                  </div>
                  <div>
                    <span className="text-gray-600">Password:</span>
                    <code className="block bg-gray-100 p-2 mt-1 rounded">admin123</code>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-orange-900 mb-2">Regular Admin Account:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Username:</span>
                    <code className="block bg-gray-100 p-2 mt-1 rounded">ahmed</code>
                  </div>
                  <div>
                    <span className="text-gray-600">Password:</span>
                    <code className="block bg-gray-100 p-2 mt-1 rounded">ahmed123</code>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-orange-100 rounded border border-orange-300">
              <p className="text-xs text-orange-800">
                <strong>Security Note:</strong> These are default credentials for development. 
                Change passwords immediately in production environments.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-moroccan-blue">
            🎯 Platform Management Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">📋</div>
              <h4 className="font-semibold text-blue-900">Booking Management</h4>
              <p className="text-sm text-blue-700 mt-1">
                Handle customer bookings, confirmations, and payments
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎪</div>
              <h4 className="font-semibold text-green-900">Activity Management</h4>
              <p className="text-sm text-green-700 mt-1">
                Create and manage tourism activities with pricing
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold text-purple-900">Analytics & Reports</h4>
              <p className="text-sm text-purple-700 mt-1">
                View revenue, bookings, and performance metrics
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Steps */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">
            🚀 Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">
                1
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Access Admin Login</h4>
                <p className="text-sm text-green-700">Go to /admin/login and use the credentials above</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">
                2
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Navigate Dashboard</h4>
                <p className="text-sm text-green-700">Explore the admin dashboard to manage bookings and activities</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-1">
                3
              </div>
              <div>
                <h4 className="font-semibold text-green-900">Start Managing</h4>
                <p className="text-sm text-green-700">Begin processing bookings and managing tourism activities</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}