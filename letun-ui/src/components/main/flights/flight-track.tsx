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

// Динамический импорт для рендеринга без SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

export function FlightTrack() {
  const dispatch = useAppDispatch();
  const flightsState = useSelector<RootStore, FlightsState>((s) => s.flights);

  const isOpen = flightsState.trackFlightOpen;
  const isLoading = flightsState.isLoading;
  const { isValid, error, points: rawPoints } = flightsState.createFlight;
  const hasError = Boolean(error);

  // Преобразуем введенный маршрут "lat,lng;lat,lng;..."
  const route: [number, number][] = React.useMemo(() => {
    if (!rawPoints) return [];
    return rawPoints
      .split(';')
      .map((p) => {
        const [lat, lng] = p.split(',').map((s) => parseFloat(s.trim()));
        return isNaN(lat) || isNaN(lng) ? null : ([lat, lng] as [number, number]);
      })
      .filter((v): v is [number, number] => !!v);
  }, [rawPoints]);

  // Настройки карты
  const defaultCenter: [number, number] = [51.1694, 71.4491]; // Астана
  const defaultZoom = 10;
  const routeZoom = 13;
  const mapHeight = 400; // px

  // Телеметрия: сырые сообщения и точки
  const [rawWsLogs, setRawWsLogs] = useState<string[]>([]);
  const [telemetryPoints, setTelemetryPoints] = useState<[number, number][]>([]);
  const mapRef = useRef<any>(null);

  // Инициализация Leaflet-иконок на клиенте
  useEffect(() => {
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
        iconUrl: require('leaflet/dist/images/marker-icon.png'),
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      });
    });
  }, []);

  // WebSocket: получаем данные телеметрии
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8081/wsclient');
    ws.onopen = () => console.log('WS connected');
    ws.onmessage = ({ data }) => {
      // Логируем каждый фрейм в консоль и в UI
      console.log('WS ←', data);
      setRawWsLogs((logs) => [data as string, ...logs].slice(0, 20));

      try {
        const msg = JSON.parse(data as string);
        if (msg.type === 'telemetry') {
          const pos: [number, number] = [msg.latitude, msg.longitude];
          setTelemetryPoints((prev) => [...prev, pos]);
          // Центрирование на новую точку
          mapRef.current?.setView(pos, route.length ? routeZoom : defaultZoom);
        }
      } catch (err) {
        console.error('WS parse error', err);
      }
    };
    ws.onerror = (e) => console.error('WS error', e);
    return () => ws.close();
  }, [route.length]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => dispatch(flightsActions.setTrackFlightOpen(o))}>
      <DialogContent className="!max-w-none w-[1700px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add flight</DialogTitle>
          <DialogDescription className={hasError ? 'text-destructive' : ''}>
            {hasError ? error : 'Flight will be added to the list.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          {/* Ввод маршрута */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              placeholder="lat,lng;lat,lng;..."
              className="col-span-3"
              disabled={isLoading}
              value={rawPoints}
              onChange={(e) => dispatch(flightsActions.setCreateFlightPoints(e.target.value))}
            />
          </div>

          {/* Панель сырых WS-логов */}
          <div className="bg-black text-white text-xs p-2 max-h-24 overflow-auto rounded">
            {rawWsLogs.length === 0 ? (
              <div>No WS data yet</div>
            ) : (
              rawWsLogs.map((msg, i) => <div key={i}>{msg}</div>)
            )}
          </div>

          {/* Логи телеметрии */}
          <div className="bg-gray-50 border rounded p-3 max-h-32 overflow-auto">
            <h4 className="font-medium mb-1">Received Coordinates:</h4>
            <ul className="list-disc list-inside text-sm">
              {telemetryPoints.length === 0 ? (
                <li className="italic text-gray-500">No data yet</li>
              ) : (
                telemetryPoints.map((pos, idx) => (
                  <li key={idx}>{pos[0].toFixed(6)}, {pos[1].toFixed(6)}</li>
                ))
              )}
            </ul>
          </div>

          {/* Карта */}
          <div className="w-full" style={{ height: `${mapHeight}px` }}>
            <MapContainer
              center={route.length ? route[0] : defaultCenter}
              zoom={route.length ? routeZoom : defaultZoom}
              whenCreated={(map) => (mapRef.current = map)}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {route.length > 0 && <Polyline positions={route} />}
              {route.length > 0 && (
                <>
                  <Marker position={route[0]} />
                  <Marker position={route[route.length - 1]} />
                </>
              )}
              {telemetryPoints.map((pos, i) => (
                <CircleMarker key={i} center={pos} radius={6} />
              ))}
            </MapContainer>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={!isValid || isLoading}
            onClick={() => dispatch(createFlightAsync())}
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FlightTrack;
