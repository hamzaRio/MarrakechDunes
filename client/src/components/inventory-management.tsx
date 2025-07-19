import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, Users, MapPin, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface Vehicle {
  id: string;
  type: 'minibus' | 'suv' | 'bus' | 'camel' | 'balloon';
  name: string;
  capacity: number;
  status: 'available' | 'in_use' | 'maintenance' | 'reserved';
  location: string;
  nextAvailable: Date;
  assignments: Assignment[];
}

interface Guide {
  id: string;
  name: string;
  languages: string[];
  specialties: string[];
  status: 'available' | 'busy' | 'off_duty';
  rating: number;
  nextAvailable: Date;
  currentAssignment?: string;
}

interface Assignment {
  id: string;
  activityId: string;
  activityName: string;
  date: Date;
  time: string;
  duration: number;
  customers: number;
  vehicleId?: string;
  guideId?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export default function InventoryManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadInventoryData();
    checkResourceAlerts();
  }, [selectedDate]);

  const loadInventoryData = () => {
    const mockVehicles: Vehicle[] = [
      {
        id: '1',
        type: 'minibus',
        name: 'Desert Express 1',
        capacity: 8,
        status: 'available',
        location: 'Marrakech Base',
        nextAvailable: new Date(),
        assignments: []
      },
      {
        id: '2',
        type: 'suv',
        name: 'Atlas Explorer',
        capacity: 4,
        status: 'in_use',
        location: 'Ourika Valley',
        nextAvailable: new Date(Date.now() + 6 * 60 * 60 * 1000),
        assignments: []
      },
      {
        id: '3',
        type: 'bus',
        name: 'Essaouira Cruiser',
        capacity: 15,
        status: 'available',
        location: 'Marrakech Base',
        nextAvailable: new Date(),
        assignments: []
      },
      {
        id: '4',
        type: 'balloon',
        name: 'Sky Rider 1',
        capacity: 8,
        status: 'maintenance',
        location: 'Balloon Launch Site',
        nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        assignments: []
      },
      {
        id: '5',
        type: 'camel',
        name: 'Sahara Caravan',
        capacity: 6,
        status: 'available',
        location: 'Agafay Desert',
        nextAvailable: new Date(),
        assignments: []
      }
    ];

    const mockGuides: Guide[] = [
      {
        id: '1',
        name: 'Ahmed Ben Ali',
        languages: ['Arabic', 'French', 'English'],
        specialties: ['Desert Tours', 'Cultural History'],
        status: 'available',
        rating: 4.9,
        nextAvailable: new Date()
      },
      {
        id: '2',
        name: 'Fatima El Khamlichi',
        languages: ['Arabic', 'French', 'Spanish'],
        specialties: ['Hot Air Balloon', 'Photography'],
        status: 'busy',
        rating: 4.8,
        nextAvailable: new Date(Date.now() + 4 * 60 * 60 * 1000),
        currentAssignment: 'Hot Air Balloon Ride'
      },
      {
        id: '3',
        name: 'Youssef Mansouri',
        languages: ['Arabic', 'English', 'German'],
        specialties: ['Mountain Trekking', 'Waterfalls'],
        status: 'available',
        rating: 4.7,
        nextAvailable: new Date()
      },
      {
        id: '4',
        name: 'Aicha Bensouda',
        languages: ['Arabic', 'French', 'Italian'],
        specialties: ['Coastal Tours', 'Art & Crafts'],
        status: 'off_duty',
        rating: 4.6,
        nextAvailable: new Date(Date.now() + 16 * 60 * 60 * 1000)
      }
    ];

    const mockAssignments: Assignment[] = [
      {
        id: '1',
        activityId: '1',
        activityName: 'Hot Air Balloon Ride',
        date: new Date(),
        time: '06:00',
        duration: 4,
        customers: 6,
        vehicleId: '1',
        guideId: '2',
        status: 'in_progress'
      },
      {
        id: '2',
        activityId: '4',
        activityName: 'Ourika Valley Adventure',
        date: new Date(),
        time: '08:00',
        duration: 8,
        customers: 4,
        vehicleId: '2',
        guideId: '3',
        status: 'in_progress'
      },
      {
        id: '3',
        activityId: '2',
        activityName: '3-Day Desert Experience',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        time: '09:00',
        duration: 72,
        customers: 8,
        status: 'scheduled'
      }
    ];

    setVehicles(mockVehicles);
    setGuides(mockGuides);
    setAssignments(mockAssignments);
  };

  const checkResourceAlerts = () => {
    const newAlerts: string[] = [];
    
    // Check vehicle maintenance
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
    if (maintenanceVehicles.length > 0) {
      newAlerts.push(`${maintenanceVehicles.length} vehicle(s) in maintenance`);
    }

    // Check guide availability
    const availableGuides = guides.filter(g => g.status === 'available');
    if (availableGuides.length < 2) {
      newAlerts.push('Low guide availability - consider scheduling backups');
    }

    // Check vehicle utilization
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'available').length;
    const utilizationRate = ((totalVehicles - availableVehicles) / totalVehicles) * 100;
    if (utilizationRate > 80) {
      newAlerts.push('High vehicle utilization - consider adding capacity');
    }

    setAlerts(newAlerts);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_use': case 'busy': return 'bg-blue-100 text-blue-800';
      case 'maintenance': case 'off_duty': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'balloon': return '🎈';
      case 'camel': return '🐪';
      case 'bus': return '🚌';
      case 'suv': return '🚗';
      case 'minibus': return '🚐';
      default: return '🚗';
    }
  };

  const assignResource = (assignmentId: string, resourceType: 'vehicle' | 'guide', resourceId: string) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === assignmentId 
        ? { 
            ...assignment, 
            [resourceType === 'vehicle' ? 'vehicleId' : 'guideId']: resourceId 
          }
        : assignment
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Resource & Inventory Management</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <Button>Add Resource</Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Vehicles</p>
                <p className="text-2xl font-bold text-green-600">
                  {vehicles.filter(v => v.status === 'available').length}/{vehicles.length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Guides</p>
                <p className="text-2xl font-bold text-green-600">
                  {guides.filter(g => g.status === 'available').length}/{guides.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {assignments.filter(a => a.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(((vehicles.length - vehicles.filter(v => v.status === 'available').length) / vehicles.length) * 100)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Fleet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Vehicle Fleet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getVehicleIcon(vehicle.type)}</span>
                    <div>
                      <h4 className="font-semibold">{vehicle.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{vehicle.type}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {vehicle.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{vehicle.capacity} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{vehicle.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Available:</span>
                    <span className="font-medium">
                      {vehicle.nextAvailable.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {vehicle.status === 'available' && (
                  <Button size="sm" className="w-full mt-3">Assign to Tour</Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guide Team */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Guide Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guides.map((guide) => (
              <div key={guide.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {guide.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{guide.name}</h4>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm">{guide.rating}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(guide.status)}>
                    {guide.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div>
                    <span className="text-sm text-gray-600">Languages: </span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {guide.languages.map((lang, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Specialties: </span>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {guide.specialties.map((specialty, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{specialty}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {guide.currentAssignment && (
                  <div className="bg-blue-50 p-2 rounded text-sm mb-3">
                    <span className="font-medium">Current: </span>
                    {guide.currentAssignment}
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  Next available: {guide.nextAvailable.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {guide.status === 'available' && (
                  <Button size="sm" className="w-full mt-3">Assign to Tour</Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const assignedVehicle = vehicles.find(v => v.id === assignment.vehicleId);
              const assignedGuide = guides.find(g => g.id === assignment.guideId);
              
              return (
                <div key={assignment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{assignment.activityName}</h4>
                      <p className="text-sm text-gray-600">
                        {assignment.date.toLocaleDateString()} at {assignment.time} 
                        ({assignment.duration}h, {assignment.customers} customers)
                      </p>
                    </div>
                    <Badge className={getStatusColor(assignment.status)}>
                      {assignment.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Vehicle: </span>
                        {assignedVehicle ? (
                          <span className="font-medium">{assignedVehicle.name}</span>
                        ) : (
                          <span className="text-red-600">Not assigned</span>
                        )}
                      </div>
                      {!assignedVehicle && (
                        <select className="text-sm border rounded px-2 py-1">
                          <option>Select vehicle...</option>
                          {vehicles.filter(v => v.status === 'available').map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Guide: </span>
                        {assignedGuide ? (
                          <span className="font-medium">{assignedGuide.name}</span>
                        ) : (
                          <span className="text-red-600">Not assigned</span>
                        )}
                      </div>
                      {!assignedGuide && (
                        <select className="text-sm border rounded px-2 py-1">
                          <option>Select guide...</option>
                          {guides.filter(g => g.status === 'available').map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Resource Optimization */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Optimization Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Fleet Management</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Sky Rider 1 (Balloon) due for maintenance completion tomorrow</li>
                <li>• Desert Express 1 utilization: 78% this month</li>
                <li>• Consider adding SUV capacity for mountain tours</li>
                <li>• Camel availability optimal for desert experiences</li>
                <li>• Schedule regular maintenance during low season</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Staff Optimization</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Ahmed and Youssef available for emergency assignments</li>
                <li>• Fatima specializing in balloon tours - high demand</li>
                <li>• Need German-speaking guide for upcoming group tour</li>
                <li>• Cross-train guides in multiple specialties</li>
                <li>• Consider hiring seasonal staff for peak period</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}