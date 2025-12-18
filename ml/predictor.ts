import { Intersection, Incident } from '../types';

/**
 * Very small heuristic "model" that scores intersections as hotspot candidates.
 * This is a deterministic, testable stub that can later be swapped for a real model.
 */

export interface HotspotPrediction {
  id: string | number;
  score: number; // 0-1 confidence
  reason?: string;
}

export function trainModelMock(data: { intersections: Intersection[]; incidents: Incident[] }) {
  // Simulate training time and return a lightweight "trained" object (could include weights).
  // For now we just return a timestamped token for demo purposes.
  return { trainedAt: Date.now(), meta: { intersectionsCount: data.intersections.length, incidentsCount: data.incidents.length } };
}

export function predictHotspotsMock(
  intersections: Intersection[],
  incidents: Incident[],
  topK = 5
): HotspotPrediction[] {
  if (!intersections || intersections.length === 0) return [];

  // Helper: support both coords array and SQL-style rows (latitude/longitude or lat/lng).
  function extractCoords(row: any): [number, number] | undefined {
    if (!row) return undefined;
    if (Array.isArray(row.coords) && row.coords.length >= 2) {
      return [row.coords[0], row.coords[1]];
    }
    if (typeof row.latitude === 'number' && typeof row.longitude === 'number') {
      return [row.latitude, row.longitude];
    }
    if (typeof row.lat === 'number' && typeof row.lng === 'number') {
      return [row.lat, row.lng];
    }
    return undefined;
  }

  // Score intersection by closeness to incidents and a pseudo queue length if available.
  const scores: HotspotPrediction[] = intersections.map((ix) => {
    // base score
    let score = 0.05;

    const reasons: string[] = [];
     // if intersection has a "queueLength" numeric property, prefer it (best-effort)
     const anyAsAny = ix as any;
     if (typeof anyAsAny.queueLength === 'number') {
       score += Math.min(1, anyAsAny.queueLength / 50) * 0.5;
       reasons.push('queueLength');
     }

    // proximity to nearest incident (if incidents have lat/lng and intersection has coordinates)
    const ixCoords = extractCoords(anyAsAny);
    if (incidents && incidents.length > 0 && ixCoords) {
      const [ixLat, ixLng] = ixCoords;
       // compute minimal squared distance
       let minDist = Infinity;
       for (const inc of incidents) {
        const incCoords = extractCoords(inc as any);
        if (incCoords) {
          const [incLat, incLng] = incCoords;
           const dLat = ixLat - incLat;
           const dLng = ixLng - incLng;
           const dist2 = dLat * dLat + dLng * dLng;
           minDist = Math.min(minDist, dist2);
         }
       }
       if (minDist !== Infinity) {
         // closer -> higher score
         score += Math.max(0, (0.5 - Math.min(0.5, Math.sqrt(minDist)))) * 0.4;
         reasons.push('nearIncident');
       }
     }

     // clamp and return
     const finalScore = Math.max(0, Math.min(1, score));
     return { id: (ix as any).id, score: Math.round(finalScore * 100) / 100, reason: reasons.length ? reasons.join(';') : undefined };
  });

  // sort desc and take topK
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}
