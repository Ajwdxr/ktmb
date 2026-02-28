import { NextResponse } from 'next/server';
import { transit_realtime } from 'gtfs-realtime-bindings';

export async function GET() {
  try {
    const response = await fetch('https://api.data.gov.my/gtfs-realtime/vehicle-position/ktmb/', {
      cache: 'no-store', // Always get fresh live positions
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GTFS-Realtime: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const feed = transit_realtime.FeedMessage.decode(new Uint8Array(buffer));

    // Convert to a more friendly JSON structure for the frontend
    const vehicles = (feed.entity || []).map((entity: any) => ({
      id: entity.id,
      vehicleId: entity.vehicle?.vehicle?.id,
      label: entity.vehicle?.vehicle?.label,
      latitude: entity.vehicle?.position?.latitude,
      longitude: entity.vehicle?.position?.longitude,
      bearing: entity.vehicle?.position?.bearing,
      timestamp: entity.vehicle?.timestamp,
      tripId: entity.vehicle?.trip?.tripId,
      routeId: entity.vehicle?.trip?.routeId,
    }));

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('GTFS Realtime Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to fetch realtime data' }, { status: 500 });
  }
}
