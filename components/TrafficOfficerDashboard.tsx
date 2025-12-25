import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheckIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  PoliceOfficer, 
  EmergencyCall, 
  PoliceDispatch, 
  TrafficViolation, 
  PoliceVehicle,
  UserLocation,
  Incident
} from '../types';
import { policeService } from '../services/policeService';
import { RealGpsTracker } from './RealGpsTracker';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { StatusBadge } from './ui/StatusBadge';
import { Modal } from './ui/Modal';

interface TrafficOfficerDashboardProps {
  officerId: string;
  onIncidentUpdate?: (incident: Incident) => void;
  onLocationUpdate?: (location: UserLocation) => void;
}

export const TrafficOfficerDashboard: React.FC<TrafficOfficerDashboardProps> = ({
  officerId,
  onIncidentUpdate,
  onLocationUpdate
}) => {
  // State Management
  const [officer, setOfficer] = useState<PoliceOfficer | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calls' | 'incidents' | 'violations' | 'patrol'>('dashboard');
  const [emergencyCalls, setEmergencyCalls] = useState<EmergencyCall[]>([]);
  const [activeDispatch, setActiveDispatch] = useState<PoliceDispatch | null>(null);
  const [violations, setViolations] = useState<TrafficViolation[]>([]);
  const [assignedVehicle, setAssignedVehicle] = useState<PoliceVehicle | null>(null);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<EmergencyCall | null>(null);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [newViolation, setNewViolation] = useState<Partial<TrafficViolation>>({});

  // Load officer data
  useEffect(() => {
    const loadOfficerData = async () => {
      try {
        const officerData = policeService.getOfficer(officerId);
        if (officerData) {
          setOfficer(officerData);
          setIsOnDuty(officerData.status === 'ON_DUTY' || officerData.status === 'RESPONDING' || officerData.status === 'AT_SCENE');
          
          if (officerData.assignedVehicle) {
            const vehicle = policeService.getVehicle(officerData.assignedVehicle);
            if (vehicle) {
              setAssignedVehicle(vehicle);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load officer data:', error);
      }
    };

    loadOfficerData();
  }, [officerId]);

  // Load emergency calls
  useEffect(() => {
    const loadEmergencyCalls = () => {
      try {
        const calls = policeService.getAllEmergencyCalls();
        setEmergencyCalls(calls.filter(call => 
          call.status === 'RECEIVED' || 
          call.assignedOfficers.includes(officerId)
        ));
      } catch (error) {
        console.error('Failed to load emergency calls:', error);
      }
    };

    loadEmergencyCalls();
    const interval = setInterval(loadEmergencyCalls, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [officerId]);

  // Load violations
  useEffect(() => {
    const loadViolations = () => {
      try {
        const allViolations = policeService.getAllViolations();
        setViolations(allViolations.filter(v => v.officerId === officerId));
      } catch (error) {
        console.error('Failed to load violations:', error);
      }
    };

    loadViolations();
  }, [officerId]);

  // Handle location updates
  const handleLocationUpdate = useCallback((location: UserLocation) => {
    setCurrentLocation(location);
    if (officer) {
      policeService.updateOfficerLocation(officerId, location);
    }
    onLocationUpdate?.(location);
  }, [officer, officerId, onLocationUpdate]);

  // Handle duty status toggle
  const toggleDutyStatus = async () => {
    if (!officer) return;
    
    const newStatus = isOnDuty ? 'OFF_DUTY' : 'ON_DUTY';
    policeService.updateOfficerStatus(officerId, newStatus);
    setIsOnDuty(!isOnDuty);
    
    // Update officer state
    setOfficer(prev => prev ? { ...prev, status: newStatus } : null);
  };

  // Handle emergency call response
  const respondToCall = async (call: EmergencyCall) => {
    try {
      // Create dispatch
      const dispatch = policeService.createDispatch({
        callId: call.id,
        officerIds: [officerId],
        instructions: `Respond to ${call.type} - ${call.description}`,
        priority: call.priority
      });

      // Update officer status
      policeService.updateOfficerStatus(officerId, 'RESPONDING');
      setActiveDispatch(dispatch);
      
      // Update call
      call.status = 'DISPATCHED';
      call.assignedOfficers = [officerId];
      
      setEmergencyCalls(prev => prev.map(c => c.id === call.id ? call : c));
    } catch (error) {
      console.error('Failed to respond to call:', error);
    }
  };

  // Handle violation creation
  const createViolation = async () => {
    if (!newViolation.type || !newViolation.vehicleDetails?.registrationNumber) return;

    try {
      const violation = policeService.createViolation({
        ...newViolation as Omit<TrafficViolation, 'id' | 'timestamp' | 'status'>,
        location: currentLocation || officer!.location,
        officerId: officerId,
        evidence: { photos: [], ...newViolation.evidence }
      });

      setViolations(prev => [violation, ...prev]);
      setNewViolation({});
      setShowViolationModal(false);
    } catch (error) {
      console.error('Failed to create violation:', error);
    }
  };

  if (!officer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-8 w-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-tech font-bold text-foreground">
                Officer {officer.name}
              </h1>
              <p className="text-sm text-muted">
                Badge #{officer.badgeNumber} • {officer.rank}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <StatusBadge 
            status={isOnDuty ? 'online' : 'offline'}
            className="text-sm"
          >
            {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
          </StatusBadge>
          
          <Button
            variant={isOnDuty ? 'danger' : 'primary'}
            onClick={toggleDutyStatus}
            icon={isOnDuty ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          >
            {isOnDuty ? 'End Shift' : 'Start Shift'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-surface/50 p-1 rounded-lg">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: ShieldCheckIcon },
          { id: 'calls', label: 'Emergency Calls', icon: PhoneIcon },
          { id: 'incidents', label: 'Incidents', icon: ExclamationTriangleIcon },
          { id: 'violations', label: 'Violations', icon: DocumentTextIcon },
          { id: 'patrol', label: 'Patrol', icon: MapPinIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg'
                : 'text-muted hover:text-foreground hover:bg-surfaceHighlight'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <Card variant="cyber" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Active Calls</p>
                  <p className="text-2xl font-tech font-bold text-foreground">
                    {emergencyCalls.filter(c => c.status === 'RECEIVED').length}
                  </p>
                </div>
                <PhoneIcon className="h-8 w-8 text-warning-400" />
              </div>
            </Card>

            <Card variant="cyber" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Violations Issued</p>
                  <p className="text-2xl font-tech font-bold text-foreground">
                    {violations.length}
                  </p>
                </div>
                <DocumentTextIcon className="h-8 w-8 text-danger-400" />
              </div>
            </Card>

            <Card variant="cyber" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Response Time</p>
                  <p className="text-2xl font-tech font-bold text-foreground">
                    {officer.performance.responseTime}m
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-success-400" />
              </div>
            </Card>

            <Card variant="cyber" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Rating</p>
                  <p className="text-2xl font-tech font-bold text-foreground">
                    {officer.performance.rating}/5
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-cyan-400" />
              </div>
            </Card>
          </div>

          {/* GPS Tracker */}
          <Card variant="cyber" className="p-4">
            <h3 className="text-lg font-tech font-semibold mb-4 text-foreground">
              Live Location
            </h3>
            <div className="text-center text-muted">
              <MapPinIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>GPS Tracker Component</p>
              <p className="text-xs">Real-time location tracking</p>
            </div>
          </Card>
        </div>
      )}

      {/* Emergency Calls Tab */}
      {activeTab === 'calls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-tech font-semibold text-foreground">
              Emergency Calls
            </h2>
            <Button
              variant="primary"
              icon={<ArrowPathIcon className="h-4 w-4" />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {emergencyCalls.length === 0 ? (
              <Card variant="cyber" className="p-8 text-center">
                <PhoneIcon className="h-12 w-12 mx-auto mb-4 text-muted opacity-50" />
                <p className="text-muted">No emergency calls at this time</p>
              </Card>
            ) : (
              emergencyCalls.map((call) => (
                <Card key={call.id} variant="cyber" className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <StatusBadge 
                          status={call.priority === 'CRITICAL' ? 'offline' : 
                                 call.priority === 'HIGH' ? 'warning' : 'online'}
                        >
                          {call.priority}
                        </StatusBadge>
                        <span className="text-sm text-muted">
                          {new Date(call.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <h3 className="font-tech font-semibold text-foreground mb-1">
                        {call.type.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-muted mb-2">{call.description}</p>
                      <p className="text-xs text-muted">
                        Caller: {call.callerPhone}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      {call.status === 'RECEIVED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => respondToCall(call)}
                        >
                          Respond
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCall(call);
                          setShowCallModal(true);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Violations Tab */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-tech font-semibold text-foreground">
              Traffic Violations
            </h2>
            <Button
              variant="primary"
              onClick={() => setShowViolationModal(true)}
            >
              Issue Violation
            </Button>
          </div>

          <div className="grid gap-4">
            {violations.length === 0 ? (
              <Card variant="cyber" className="p-8 text-center">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-muted opacity-50" />
                <p className="text-muted">No violations issued yet</p>
              </Card>
            ) : (
              violations.map((violation) => (
                <Card key={violation.id} variant="cyber" className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <StatusBadge 
                          status={violation.status === 'PAID' ? 'online' : 'warning'}
                        >
                          {violation.status}
                        </StatusBadge>
                        <span className="text-sm text-muted">
                          ₹{violation.fine}
                        </span>
                      </div>
                      
                      <h3 className="font-tech font-semibold text-foreground mb-1">
                        {violation.type.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-muted mb-2">
                        Vehicle: {violation.vehicleDetails.registrationNumber}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(violation.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      {showCallModal && selectedCall && (
        <Modal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          title="Call Details"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-tech font-semibold text-foreground mb-2">
                {selectedCall.type.replace('_', ' ')}
              </h3>
              <p className="text-muted">{selectedCall.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Priority</p>
                <StatusBadge 
                  status={selectedCall.priority === 'CRITICAL' ? 'offline' : 
                         selectedCall.priority === 'HIGH' ? 'warning' : 'online'}
                >
                  {selectedCall.priority}
                </StatusBadge>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Status</p>
                <p className="text-muted">{selectedCall.status}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Caller</p>
              <p className="text-muted">{selectedCall.callerPhone}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Location</p>
              <p className="text-muted">
                {selectedCall.location.lat.toFixed(6)}, {selectedCall.location.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Violation Modal */}
      {showViolationModal && (
        <Modal
          isOpen={showViolationModal}
          onClose={() => setShowViolationModal(false)}
          title="Issue Traffic Violation"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Violation Type
              </label>
              <select
                value={newViolation.type || ''}
                onChange={(e) => setNewViolation(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full p-2 bg-surface border border-border rounded-lg text-foreground"
              >
                <option value="">Select violation type</option>
                <option value="SPEEDING">Speeding</option>
                <option value="RED_LIGHT">Red Light Violation</option>
                <option value="WRONG_LANE">Wrong Lane</option>
                <option value="NO_HELMET">No Helmet</option>
                <option value="NO_SEATBELT">No Seatbelt</option>
                <option value="PARKING">Illegal Parking</option>
                <option value="OVERLOADING">Overloading</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Vehicle Registration
              </label>
              <input
                type="text"
                value={newViolation.vehicleDetails?.registrationNumber || ''}
                onChange={(e) => setNewViolation(prev => ({
                  ...prev,
                  vehicleDetails: { ...prev.vehicleDetails, registrationNumber: e.target.value } as any
                }))}
                className="w-full p-2 bg-surface border border-border rounded-lg text-foreground"
                placeholder="Enter registration number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fine Amount (₹)
              </label>
              <input
                type="number"
                value={newViolation.fine || ''}
                onChange={(e) => setNewViolation(prev => ({ ...prev, fine: parseInt(e.target.value) }))}
                className="w-full p-2 bg-surface border border-border rounded-lg text-foreground"
                placeholder="Enter fine amount"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="primary"
                onClick={createViolation}
                disabled={!newViolation.type || !newViolation.vehicleDetails?.registrationNumber}
              >
                Issue Violation
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowViolationModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};