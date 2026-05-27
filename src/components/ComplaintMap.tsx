import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Complaint, IssueCategory } from '../types'
import { ISSUE_CATEGORIES, STATUS_CONFIG } from '../lib/departments'
import { format } from 'date-fns'

// Fix Vite asset resolution for Leaflet's default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeIcon(category: IssueCategory) {
  const { markerColor, icon } = ISSUE_CATEGORIES[category]
  return L.divIcon({
    className: '',
    html: `<div style="background:${markerColor};width:34px;height:34px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">${icon}</div>`,
    iconSize:    [34, 34],
    iconAnchor:  [17, 17],
    popupAnchor: [0, -22],
  })
}

const PIN_ICON = L.divIcon({
  className: '',
  html: '<div style="background:#1e40af;width:22px;height:22px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
})

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyToLocation({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 17)
  }, [target, map])
  return null
}

interface Props {
  complaints?: Complaint[]
  onLocationPick?: (lat: number, lng: number) => void
  pickedLocation?: { lat: number; lng: number } | null
  flyTo?: { lat: number; lng: number } | null
  height?: string
}

const HOWRAH_CENTER: [number, number] = [22.5958, 88.2636]

export default function ComplaintMap({
  complaints = [],
  onLocationPick,
  pickedLocation,
  flyTo,
  height = '400px',
}: Props) {
  return (
    <MapContainer
      center={HOWRAH_CENTER}
      zoom={13}
      style={{ height, width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onLocationPick && <LocationPicker onPick={onLocationPick} />}
      {flyTo && <FlyToLocation target={flyTo} />}

      {pickedLocation && (
        <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={PIN_ICON}>
          <Popup>Selected location</Popup>
        </Marker>
      )}

      {complaints.map((c) => (
        <Marker key={c.id} position={[c.location_lat, c.location_lng]} icon={makeIcon(c.category)}>
          <Popup maxWidth={280}>
            <div className="text-sm space-y-1">
              <div className="font-bold text-gray-900">
                {ISSUE_CATEGORIES[c.category].icon} {ISSUE_CATEGORIES[c.category].label}
              </div>
              <div className="text-xs font-mono text-blue-700">{c.complaint_number}</div>
              <div className="text-gray-600 text-xs">{c.description}</div>
              {c.address && (
                <div className="text-xs text-gray-500">📍 {c.address}{c.ward_number ? `, ${c.ward_number}` : ''}</div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[c.status].color}`}>
                  {STATUS_CONFIG[c.status].label}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(c.created_at), 'dd MMM yyyy')}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
