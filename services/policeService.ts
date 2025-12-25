import { 
  PoliceOfficer, 
  EmergencyCall, 
  PoliceDispatch, 
  TrafficViolation, 
  PoliceVehicle, 
  PoliceStation,
  TrafficControlRoom,
  UserLocation,
  DispatchUpdate
} from '../types';

class PoliceService {
  private officers: Map<string, PoliceOfficer> = new Map();
  private emergencyCalls: Map<string, EmergencyCall> = new Map();
  private dispatches: Map<string, PoliceDispatch> = new Map();
  private violations: Map<string, TrafficViolation> = new Map();
  private vehicles: Map<string, PoliceVehicle> = new Map();
  private stations: Map<string, PoliceStation> = new Map();
  private controlRooms: Map<string, TrafficControlRoom> = new Map();

  // Emergency Call Management
  createEmergencyCall(callData: Omit<EmergencyCall, 'id' | 'timestamp' | 'status'>): EmergencyCall {
    const call: EmergencyCall = {
      ...callData,
      id: `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'RECEIVED'
    };

    this.emergencyCalls.set(call.id, call);
    
    // Auto-dispatch based on priority
    if (call.priority === 'CRITICAL' || call.priority === 'HIGH') {
      this.autoDispatch(call);
    }

    return call;
  }

  // Auto-dispatch nearest available officers
  private autoDispatch(call: EmergencyCall): void {
    const nearestOfficers = this.findNearestAvailableOfficers(call.location, 3);
    
    if (nearestOfficers.length > 0) {
      const dispatch = this.createDispatch({
        callId: call.id,
        officerIds: nearestOfficers.map(o => o.id),
        instructions: `Respond to ${call.type} at location. Priority: ${call.priority}`,
        priority: call.priority
      });

      // Update call status
      call.status = 'DISPATCHED';
      call.assignedOfficers = nearestOfficers.map(o => o.id);
      
      // Update officer status
      nearestOfficers.forEach(officer => {
        officer.status = 'RESPONDING';
        officer.currentIncident = call.id;
      });
    }
  }

  // Find nearest available officers
  findNearestAvailableOfficers(location: UserLocation, count: number = 5): PoliceOfficer[] {
    const availableOfficers = Array.from(this.officers.values())
      .filter(officer => officer.status === 'ON_DUTY' || officer.status === 'PATROL');

    return availableOfficers
      .map(officer => ({
        officer,
        distance: this.calculateDistance(location, officer.location)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(item => item.officer);
  }

  // Calculate distance between two locations (simplified)
  private calculateDistance(loc1: UserLocation, loc2: UserLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Create dispatch
  createDispatch(dispatchData: Omit<PoliceDispatch, 'id' | 'dispatchTime' | 'status' | 'updates' | 'estimatedArrival'>): PoliceDispatch {
    const dispatch: PoliceDispatch = {
      ...dispatchData,
      id: `DISPATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dispatchTime: Date.now(),
      status: 'DISPATCHED',
      updates: [],
      estimatedArrival: Date.now() + (15 * 60 * 1000) // 15 minutes default
    };

    this.dispatches.set(dispatch.id, dispatch);
    return dispatch;
  }

  // Update dispatch status
  updateDispatch(dispatchId: string, update: Omit<DispatchUpdate, 'id' | 'timestamp'>): void {
    const dispatch = this.dispatches.get(dispatchId);
    if (!dispatch) return;

    const dispatchUpdate: DispatchUpdate = {
      ...update,
      id: `UPDATE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    dispatch.updates.push(dispatchUpdate);

    // Update dispatch status based on update type
    if (update.type === 'STATUS_UPDATE') {
      if (update.message.includes('arrived')) {
        dispatch.status = 'ARRIVED';
      } else if (update.message.includes('en route')) {
        dispatch.status = 'EN_ROUTE';
      } else if (update.message.includes('completed')) {
        dispatch.status = 'COMPLETED';
      }
    }
  }

  // Officer Management
  addOfficer(officer: PoliceOfficer): void {
    this.officers.set(officer.id, officer);
  }

  updateOfficerLocation(officerId: string, location: UserLocation): void {
    const officer = this.officers.get(officerId);
    if (officer) {
      officer.location = location;
    }
  }

  updateOfficerStatus(officerId: string, status: PoliceOfficer['status']): void {
    const officer = this.officers.get(officerId);
    if (officer) {
      officer.status = status;
    }
  }

  // Traffic Violation Management
  createViolation(violationData: Omit<TrafficViolation, 'id' | 'timestamp' | 'status'>): TrafficViolation {
    const violation: TrafficViolation = {
      ...violationData,
      id: `VIOLATION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'DETECTED'
    };

    this.violations.set(violation.id, violation);
    return violation;
  }

  // Issue fine for violation
  issueFine(violationId: string, officerId: string): void {
    const violation = this.violations.get(violationId);
    if (violation) {
      violation.status = 'ISSUED';
      violation.officerId = officerId;
    }
  }

  // Vehicle Management
  addVehicle(vehicle: PoliceVehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
  }

  updateVehicleLocation(vehicleId: string, location: UserLocation): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      vehicle.location = location;
    }
  }

  assignVehicleToOfficer(vehicleId: string, officerId: string): void {
    const vehicle = this.vehicles.get(vehicleId);
    const officer = this.officers.get(officerId);
    
    if (vehicle && officer) {
      if (!vehicle.assignedOfficers.includes(officerId)) {
        vehicle.assignedOfficers.push(officerId);
      }
      officer.assignedVehicle = vehicleId;
    }
  }

  // Station Management
  addStation(station: PoliceStation): void {
    this.stations.set(station.id, station);
  }

  // Control Room Management
  addControlRoom(controlRoom: TrafficControlRoom): void {
    this.controlRooms.set(controlRoom.id, controlRoom);
  }

  // Analytics and Reporting
  getOfficerPerformanceStats(officerId: string): any {
    const officer = this.officers.get(officerId);
    if (!officer) return null;

    const officerViolations = Array.from(this.violations.values())
      .filter(v => v.officerId === officer.id);

    const officerDispatches = Array.from(this.dispatches.values())
      .filter(d => d.officerIds.includes(officer.id));

    return {
      officer: officer,
      violationsIssued: officerViolations.length,
      dispatchesHandled: officerDispatches.length,
      averageResponseTime: this.calculateAverageResponseTime(officerDispatches),
      currentStatus: officer.status,
      performanceRating: officer.performance.rating
    };
  }

  private calculateAverageResponseTime(dispatches: PoliceDispatch[]): number {
    if (dispatches.length === 0) return 0;
    
    const responseTimes = dispatches
      .filter(d => d.status === 'COMPLETED')
      .map(d => {
        const arrivedUpdate = d.updates.find(u => u.message.includes('arrived'));
        return arrivedUpdate ? arrivedUpdate.timestamp - d.dispatchTime : 0;
      })
      .filter(time => time > 0);

    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60) // Convert to minutes
      : 0;
  }

  // Get dashboard data
  getDashboardData() {
    const totalOfficers = this.officers.size;
    const onDutyOfficers = Array.from(this.officers.values()).filter(o => o.status === 'ON_DUTY' || o.status === 'PATROL' || o.status === 'RESPONDING').length;
    const activeIncidents = Array.from(this.emergencyCalls.values()).filter(c => c.status === 'IN_PROGRESS' || c.status === 'DISPATCHED').length;
    const pendingCalls = Array.from(this.emergencyCalls.values()).filter(c => c.status === 'RECEIVED').length;
    const availableVehicles = Array.from(this.vehicles.values()).filter(v => v.status === 'AVAILABLE').length;

    return {
      totalOfficers,
      onDutyOfficers,
      activeIncidents,
      pendingCalls,
      availableVehicles,
      recentCalls: Array.from(this.emergencyCalls.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10),
      recentViolations: Array.from(this.violations.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    };
  }

  // Getters
  getAllOfficers(): PoliceOfficer[] {
    return Array.from(this.officers.values());
  }

  getAllEmergencyCalls(): EmergencyCall[] {
    return Array.from(this.emergencyCalls.values());
  }

  getAllDispatches(): PoliceDispatch[] {
    return Array.from(this.dispatches.values());
  }

  getAllViolations(): TrafficViolation[] {
    return Array.from(this.violations.values());
  }

  getAllVehicles(): PoliceVehicle[] {
    return Array.from(this.vehicles.values());
  }

  getAllStations(): PoliceStation[] {
    return Array.from(this.stations.values());
  }

  getOfficer(id: string): PoliceOfficer | undefined {
    return this.officers.get(id);
  }

  getEmergencyCall(id: string): EmergencyCall | undefined {
    return this.emergencyCalls.get(id);
  }

  getDispatch(id: string): PoliceDispatch | undefined {
    return this.dispatches.get(id);
  }

  getViolation(id: string): TrafficViolation | undefined {
    return this.violations.get(id);
  }

  getVehicle(id: string): PoliceVehicle | undefined {
    return this.vehicles.get(id);
  }

  getStation(id: string): PoliceStation | undefined {
    return this.stations.get(id);
  }
}

export const policeService = new PoliceService();