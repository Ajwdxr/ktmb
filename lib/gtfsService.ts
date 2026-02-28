import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { GTFSData, GTFSRoute, GTFSTrip, GTFSStop, GTFSStopTime, GTFSShape } from '@/types/gtfs';

export async function fetchAndParseGTFS(): Promise<GTFSData> {
  const response = await fetch('https://api.data.gov.my/gtfs-static/ktmb', {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GTFS data: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const zip = new AdmZip(Buffer.from(arrayBuffer));
  const zipEntries = zip.getEntries();

  const data: GTFSData = {
    routes: [],
    trips: [],
    stops: [],
    stop_times: [],
    shapes: {},
  };

  let rawShapes: GTFSShape[] = [];

  for (const entry of zipEntries) {
    const content = entry.getData().toString('utf8');
    
    if (entry.entryName === 'routes.txt') {
      data.routes = parse(content, { columns: true, skip_empty_lines: true });
    } else if (entry.entryName === 'trips.txt') {
      data.trips = parse(content, { columns: true, skip_empty_lines: true });
    } else if (entry.entryName === 'stops.txt') {
      data.stops = parse(content, { 
        columns: true, 
        cast: (value, context) => {
          if (context.column === 'stop_lat' || context.column === 'stop_lon') return parseFloat(value);
          return value;
        },
        skip_empty_lines: true 
      });
    } else if (entry.entryName === 'stop_times.txt') {
      data.stop_times = parse(content, { columns: true, skip_empty_lines: true });
    } else if (entry.entryName === 'shapes.txt') {
      rawShapes = parse(content, {
        columns: true,
        cast: (value, context) => {
          if (context.column === 'shape_pt_lat' || context.column === 'shape_pt_lon' || context.column === 'shape_pt_sequence') return parseFloat(value);
          return value;
        },
        skip_empty_lines: true
      });
    }
  }

  // Group shapes by shape_id
  const shapesMap: Record<string, [number, number][]> = {};
  rawShapes.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
  
  for (const point of rawShapes) {
    if (!shapesMap[point.shape_id]) {
      shapesMap[point.shape_id] = [];
    }
    shapesMap[point.shape_id].push([point.shape_pt_lat, point.shape_pt_lon]);
  }
  data.shapes = shapesMap;

  return data;
}
