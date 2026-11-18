/** Dark olive Google-Maps style (Android / Google provider) matching the app palette; forests stand out. */
export const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1b2208' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a9b27a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#141906' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#3a4614' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3711' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#223010' }] },
  { featureType: 'landscape.natural.landcover', elementType: 'geometry', stylers: [{ color: '#2f4614' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a1c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4f6a6e' }] },
];
