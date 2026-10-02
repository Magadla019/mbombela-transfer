import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

const bikeIcon = L.divIcon({ className: 'live-bike', html: '<span>🏍</span>', iconSize: [42, 42], iconAnchor: [21, 21] });
const pinIcon = L.divIcon({ className: 'live-destination', html: '<span>●</span>', iconSize: [32, 32], iconAnchor: [16, 16] });
function Follow({ position, follow }: { position: [number, number]; follow: boolean }) { const map = useMap(); useEffect(() => { if (follow) map.flyTo(position, 15, { duration: 1.2 }); }, [position, follow, map]); return null; }
function Frame({points}: {points:[number,number][]}) { const map=useMap(); useEffect(()=>{if(points.length>1)map.fitBounds(points,{padding:[32,32],maxZoom:15});else if(points.length)map.setView(points[0],15)},[map,points.map(p=>p.join(',')).join(';')]);return null; }

export function TransferMap({ driverLocation, destination }: { driverLocation: {lat:number;lng:number}|undefined; destination?: {lat:number;lng:number} }) {
  const [follow, setFollow] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]);
  const driver: [number,number] | undefined = driverLocation ? [driverLocation.lat,driverLocation.lng] : undefined;
  const end: [number,number] | undefined = destination ? [destination.lat,destination.lng] : undefined;
  useEffect(() => { if (!driver || !end) { setRoute([]); return; } const controller = new AbortController(); fetch(`https://router.project-osrm.org/route/v1/driving/${driver[1]},${driver[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`, {signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{const coordinates=data?.routes?.[0]?.geometry?.coordinates as [number,number][]|undefined;if(coordinates)setRoute(coordinates.map(([lng,lat])=>[lat,lng]));}).catch(()=>{});return()=>controller.abort(); }, [driverLocation?.lat,driverLocation?.lng,destination?.lat,destination?.lng]);
  if (!driver) return <div className="flex h-[50vh] min-h-[350px] items-center justify-center bg-card text-center text-muted-foreground">Waiting for the rider’s live location</div>;
  return <div className="relative h-[50vh] min-h-[350px] overflow-hidden"><MapContainer center={driver} zoom={15} scrollWheelZoom className="h-full w-full"><TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{route.length>1&&<Polyline positions={route} pathOptions={{color:'var(--orange)',weight:6,opacity:.9}}/>}{end&&<Marker position={end} icon={pinIcon}/>}<Marker position={driver} icon={bikeIcon}/><Follow position={driver} follow={follow}/><Frame points={end?[driver,end]:[driver]}/></MapContainer><Button onClick={()=>setFollow(v=>!v)} className="absolute bottom-5 right-5 z-[500] h-11 rounded-full bg-orange text-foreground"><Navigation size={17}/> {follow?'Following rider':'Live Tracking'}</Button></div>;
}