import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EARTH_R = 6_371_000;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat  = toRad(lat2 - lat1);
  const dLon  = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Fetch issues within radiusM metres of a point */
export async function getIssuesNearby(lat: number, lng: number, radiusM = 200) {
  // Simple bounding-box pre-filter, then Haversine refinement
  const latDelta = (radiusM / EARTH_R) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos((lat * Math.PI) / 180);

  const candidates = await prisma.issue.findMany({
    where: {
      latitude:  { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    },
    take: 50,
  });

  return candidates.filter(
    (i) => haversine(lat, lng, i.latitude, i.longitude) <= radiusM,
  );
}

/** Fetch issues within a map bounding box */
export async function getIssuesInBounds(north: number, south: number, east: number, west: number) {
  return prisma.issue.findMany({
    where: {
      latitude:  { gte: south, lte: north },
      longitude: { gte: west,  lte: east  },
    },
    take: 300,
    orderBy: { createdAt: 'desc' },
  });
}
