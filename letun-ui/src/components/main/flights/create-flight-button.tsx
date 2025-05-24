// src/components/main/flights/create-flight-button.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMapEvents,
} from 'react-leaflet';
import { Loader2, PlusIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { useSelector, useDispatch } from 'react-redux';
import { RootStore } from '@/src/app-store';
import { FlightsState } from '@/src/slices/flights/flights-state';
import { createFlightAsync, flightsActions } from '@/src/slices/flights/flights-slice';
import 'leaflet/dist/leaflet.css';

// Запретные зоны
const NO_FLY_ZONES = [
  { id: 1, name: 'Ak Orda Area', center: [51.1258334, 71.4466667] as [number, number], radius: 5000 },
  { id: 2, name: 'Astana Airport Area', center: [51.0313889, 71.4633333] as [number, number], radius: 5000 },
];

// Расчет расстояния между двумя точками (метры)
const haversine = (a: [number, number], b: [number, number]) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlon = Math.sin(dLon / 2);
  const aVal = sinDlat * sinDlat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinDlon * sinDlon;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
};

// Ловим клики на карте
function ClickHandler({ addPoint }: { addPoint: (pt: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      addPoint([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export function CreateFlightButton() {
  const dispatch = useDispatch();
  const { createFlight, isLoading } = useSelector<RootStore, FlightsState>(s => s.flights);
  const { isOpen } = createFlight;

  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  // Для отправки на сервер
  const rawPoints = useMemo(() => JSON.stringify(routePoints), [routePoints]);

  // Проверка пересечения маршрута с зонами (вершины + семплинг сегментов)
  const violationZone = useMemo<string | null>(() => {
    for (const zone of NO_FLY_ZONES) {
      const { center, radius, name } = zone;
      // 1) вершины
      if (routePoints.some(pt => haversine(pt, center) < radius)) {
        return name;
      }
      // 2) сегменты
      for (let i = 0; i < routePoints.length - 1; i++) {
        const [lat1, lng1] = routePoints[i];
        const [lat2, lng2] = routePoints[i + 1];
        for (let t = 0.1; t < 1.0; t += 0.1) {
          const lat = lat1 + (lat2 - lat1) * t;
          const lng = lng1 + (lng2 - lng1) * t;
          if (haversine([lat, lng], center) < radius) {
            return name;
          }
        }
      }
    }
    return null;
  }, [routePoints]);

  const handleAdd = () => {
    setLocalError(null);
    if (routePoints.length < 2) {
      setLocalError('Click at least two points to define a route');
      return;
    }
    if (violationZone) {
      setLocalError(`Route intersects no-fly zone: ${violationZone}`);
      return;
    }
    dispatch(flightsActions.setCreateFlightPoints(rawPoints));
    dispatch(createFlightAsync());
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        dispatch(flightsActions.setCreateFlightOpen(open));
        if (open) {
          setRoutePoints([]);
          setLocalError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon /> Add flight
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-none w-[1700px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Define Route by Clicks</DialogTitle>
          <DialogDescription className={localError ? 'text-destructive' : ''}>
            {localError || 'Click on the map to add waypoints. Click marker to remove.'}
          </DialogDescription>
        </DialogHeader>

        <div className="w-full h-[600px]">
          <MapContainer
            center={[51.1694, 71.4491]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* Отрисовка запретных зон */}
            {NO_FLY_ZONES.map(zone => (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{ color: 'red', fillOpacity: 0.1, weight: 2 }}
              />
            ))}

            <ClickHandler addPoint={pt => setRoutePoints(r => [...r, pt])} />

            {routePoints.map((pt, idx) => (
              <Marker
                key={idx}
                position={pt}
                eventHandlers={{ click: () => setRoutePoints(r => r.filter((_, i) => i !== idx)) }}
              />
            ))}

            {routePoints.length > 1 && (
              <Polyline positions={routePoints} pathOptions={{ color: 'blue', weight: 3 }} />
            )}
          </MapContainer>
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} disabled={isLoading}>
            {isLoading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateFlightButton;
