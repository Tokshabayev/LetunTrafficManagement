// src/components/main/flights/flight-track.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { useSelector } from 'react-redux';
import { useAppDispatch, RootStore } from '@/src/app-store';
import { FlightsState } from '@/src/slices/flights/flights-state';
import { createFlightAsync, flightsActions } from '@/src/slices/flights/flights-slice';
import 'leaflet/dist/leaflet.css';

// React-Leaflet components (SSR disabled)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer   = dynamic(() => import('react-leaflet').then(m => m.TileLayer),   { ssr: false });
const Polyline    = dynamic(() => import('react-leaflet').then(m => m.Polyline),    { ssr: false });
const Marker      = dynamic(() => import('react-leaflet').then(m => m.Marker),      { ssr: false });
const Circle      = dynamic(() => import('react-leaflet').then(m => m.Circle),      { ssr: false });
const Tooltip     = dynamic(() => import('react-leaflet').then(m => m.Tooltip),     { ssr: false });

// Message types from WebSocket
interface StartMsg {
  type: 'start';
  flight_id: number;
  drone_id: number;
  timestamp: number; // seconds since epoch (float)
}
interface StopMsg {
  type: 'stop';
  flight_id: number;
  drone_id: number;
  timestamp: number;
}
interface TelemetryMsg {
  type: 'telemetry';
  flight_id: number;
  drone_id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
}
type WSMsg = StartMsg | StopMsg | TelemetryMsg;

// Telemetry entry stored in state
interface TelemetryEntry extends TelemetryMsg {
  receivedAt: Date;
}

// Hardcoded no-fly zones
const NO_FLY_ZONES = [
  { id: 1, name: 'Ak Orda Area',        center: [51.1258334, 71.4466667] as [number, number], radius: 5000 },
  { id: 2, name: 'Astana Airport Area', center: [51.0313889, 71.4633333] as [number, number], radius: 5000 },
];

export function FlightTrack() {
  const dispatch = useAppDispatch();
  const { trackFlightOpen: isOpen, isLoading, createFlight } = useSelector<RootStore, FlightsState>(s => s.flights);
  const { isValid, error: createError, points: rawPoints } = createFlight;
  const hasError = Boolean(createError);

  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  const mapRef = useRef<any>(null);

  // Initialize Leaflet icons
  useEffect(() => {
    import('leaflet').then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
        iconUrl: require('leaflet/dist/images/marker-icon.png'),
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      });
    });
  }, []);

  // Haversine distance (meters)
  const haversine = (a: [number, number], b: [number, number]) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const [lat1, lon1] = a, [lat2, lon2] = b;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const sinDlat = Math.sin(dLat/2), sinDlon = Math.sin(dLon/2);
    const val = sinDlat*sinDlat + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*sinDlon*sinDlon;
    return R * 2 * Math.atan2(Math.sqrt(val), Math.sqrt(1-val));
  };

  // WebSocket effect
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8081/wsclient');
    ws.onopen = () => console.log('WS connected');
    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data as string) as WSMsg;
        if (msg.type === 'start') {
          // timestamp может быть строкой или числом
          let timestamp = msg.timestamp;
          if (typeof timestamp === 'string') timestamp = parseFloat(timestamp);
          // Проверка, в секундах или миллисекундах
          const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
          const dt = new Date(ms);
          const ts = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ` +
                     `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}:${String(dt.getSeconds()).padStart(2,'0')}`;
          setStatusLog(prev => [...prev, `🚀 Drone ${msg.drone_id} started flight ${msg.flight_id} at ${ts}`]);
        }
        else if (msg.type === 'stop') {
          let timestamp = msg.timestamp;
          if (typeof timestamp === 'string') timestamp = parseFloat(timestamp);
          const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp;
          const dt = new Date(ms);
          const ts = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')} ` +
                     `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}:${String(dt.getSeconds()).padStart(2,'0')}`;
          setStatusLog(prev => [...prev, `🛑 Drone ${msg.drone_id} stopped flight ${msg.flight_id} at ${ts}`]);
        }
        else if (msg.type === 'telemetry') {
          const pt: [number, number] = [msg.latitude, msg.longitude];
          NO_FLY_ZONES.forEach(zone => {
            if (haversine(pt, zone.center) <= zone.radius) {
              const vst = new Date().toISOString().replace('T',' ').split('.')[0];
              setStatusLog(prev => [...prev, `⚠️ Drone ${msg.drone_id} entered zone '${zone.name}' at ${vst}`]);
            }
          });
          const entry: TelemetryEntry = { ...msg, receivedAt: new Date() };
          setTelemetry(prev => [...prev, entry]);
          mapRef.current?.setView([entry.latitude, entry.longitude], 13);
        }
      } catch(e) { console.error(e); }
    };
    ws.onerror = e => console.error('WS error', e);
    return () => ws.close();
  }, []);

  // group telemetry by flight
  const flightsMap = React.useMemo(() => {
    const m = new Map<number, TelemetryEntry[]>();
    telemetry.forEach(e => {
      const arr = m.get(e.flight_id)||[];
      arr.push(e);
      m.set(e.flight_id, arr);
    });
    return m;
  }, [telemetry]);

  const colors = ['blue','green','orange','purple','darkred','darkblue'];

  return (
    <Dialog open={isOpen} onOpenChange={open => dispatch(flightsActions.setTrackFlightOpen(open))}>
      <DialogContent className="!max-w-none w-[1700px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Flight Tracking</DialogTitle>
          <DialogDescription className={hasError?'text-destructive':''}>
            {hasError?createError:'Real-time telemetry & zones'}
          </DialogDescription>
        </DialogHeader>

        {/* Status log */}
        <div className="mb-4">
          <strong>Status log:</strong>
          <ul className="list-disc list-inside text-sm max-h-24 overflow-auto">
            {statusLog.map((s,i)=><li key={i}>{s}</li>)}
          </ul>
        </div>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="points">Points</Label>
            <Input id="points" placeholder="lat,lng;..." disabled={isLoading}
              className="col-span-3" value={rawPoints}
              onChange={e=>dispatch(flightsActions.setCreateFlightPoints(e.target.value))} />
          </div>

          <div className="h-[600px] w-full">
            {isOpen && (
              <MapContainer key={String(isOpen)} center={[51.1694,71.4491]} zoom={10}
                whenCreated={map=>mapRef.current=map}
                style={{height:'100%',width:'100%'}} scrollWheelZoom={true}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* zones */}
                {NO_FLY_ZONES.map(z=>(
                  <Circle key={z.id} center={z.center} radius={z.radius}
                    pathOptions={{color:'red',fillOpacity:0.1,weight:2}} />
                ))}

                {/* flight tracks + markers */}
                {Array.from(flightsMap.entries()).map(([fid,msgs],idx)=>(
                  <React.Fragment key={fid}>
                    <Polyline positions={msgs.map(m=>[m.latitude,m.longitude] as [number,number])}
                      pathOptions={{color:colors[idx%colors.length],weight:3}} />
                    {/* latest marker */}
                    {msgs.length>0 && (()=>{
                      const latest=msgs[msgs.length-1];
                      const ts=latest.receivedAt.toISOString().replace('T',' ').split('.')[0];
                      const violation=NO_FLY_ZONES.find(z=>haversine([latest.latitude,latest.longitude],z.center)<=z.radius);
                      return (
                        <Marker position={[latest.latitude, latest.longitude] as [number,number]}>  
                          <Tooltip permanent direction="right">
                            <div className="text-xs">
                              <div>Time: {ts}</div>
                              <div>Flight ID: {latest.flight_id}</div>
                              <div>Drone ID: {latest.drone_id}</div>
                              <div>Alt: {latest.altitude} m</div>
                              <div>Speed: {latest.speed} km/h</div>
                              {violation && <div className="text-red-600">🚨 Violation: {violation.name}</div>}
                            </div>
                          </Tooltip>
                        </Marker>
                      );
                    })()}
                  </React.Fragment>
                ))}

              </MapContainer>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button disabled={!isValid||isLoading} onClick={()=>dispatch(createFlightAsync())}>
            {isLoading&&<Loader2 className="w-5 h-5 animate-spin mr-2"/>}Start Tracking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FlightTrack;
