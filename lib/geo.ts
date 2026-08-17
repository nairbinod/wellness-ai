const EARTH_RADIUS_MILES = 3958.8;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

// Haversine formula — accurate enough for metro-scale distances (a few dozen
// miles), which is all this app ever needs; no reason to reach for a
// geospatial extension for that.
export function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestMetro<T extends { lat: number; lng: number }>(
  metros: T[],
  lat: number,
  lng: number
): T | undefined {
  return metros.reduce<{ metro: T; dist: number } | undefined>((closest, metro) => {
    const dist = distanceMiles(lat, lng, metro.lat, metro.lng);
    if (!closest || dist < closest.dist) return { metro, dist };
    return closest;
  }, undefined)?.metro;
}

export function formatDistance(miles: number) {
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}
