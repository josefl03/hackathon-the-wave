const MIN_PROB = 0.02;
const MAX_PROB = 0.14;

const MICROPHONES_BASE = [
  { id: 'mic_01', name: 'Micrófono Ambiental Delicias', lat: 41.6521, lng: -0.9080 },
  { id: 'mic_02', name: 'Sensor de Audio Pza. Pilar', lat: 41.6560, lng: -0.8773 },
  { id: 'mic_03', name: 'Captador Acústico Romareda', lat: 41.6366, lng: -0.9004 },
  { id: 'mic_04', name: 'Sensor Sonoro Actur', lat: 41.6720, lng: -0.8850 },
  { id: 'mic_05', name: 'Micrófono Vía Hispanidad', lat: 41.6390, lng: -0.9160 },
  { id: 'mic_06', name: 'Sensor de Sonido Oliver', lat: 41.6500, lng: -0.9250 },
  { id: 'mic_07', name: 'Micrófono de Calle Alfonso', lat: 41.6545, lng: -0.8800 }
];

let cacheData = [];

function generateMicrophoneData() {
  cacheData = MICROPHONES_BASE.map(mic => {
    // Random prediction between 2% and 14% (0.02 to 0.14)
    const prob = Number((Math.random() * (MAX_PROB - MIN_PROB) + MIN_PROB).toFixed(4));
    return {
      ...mic,
      prob,
      timestamp: new Date().toISOString()
    };
  });
  console.log(`[Microfonos] Updated data for ${cacheData.length} microphones.`);
}

function fetchMicrofonos() {
  generateMicrophoneData();
  return cacheData;
}

function getMicrofonos() {
  return cacheData;
}

module.exports = {
  fetchMicrofonos,
  getMicrofonos
};
