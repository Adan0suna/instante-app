import React, { useRef, useState, useEffect } from 'react';

// Utilidad para leer parámetros de la URL
function useQuery() {
  return new URLSearchParams(window.location.search);
}

const GrabarPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery();
  const matchId = query.get('matchId');

  // Obtener dispositivos de video
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  // Obtener stream de la cámara seleccionada
  useEffect(() => {
    if (!selectedDeviceId) return;
    const getStream = async () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedDeviceId } },
          audio: true
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('No se pudo acceder a la cámara.');
      }
    };
    getStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const startRecording = () => {
    if (!mediaStream) return;
    setChunks([]);
    const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setChunks(prev => [...prev, e.data]);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(e.target.value);
  };

  const handleUpload = async () => {
    if (!chunks.length) return;
    setUploading(true);
    setError(null);
    try {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], `grabacion_${Date.now()}.webm`, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', file);
      if (matchId) formData.append('matchId', matchId);
      // Cambia la URL por la de tu backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const uploadUrl = `${backendUrl}/recordings/upload-recording`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        alert('¡Video subido correctamente!');
        setVideoUrl(null);
        setChunks([]);
      } else {
        setError('Error al subir el video.');
      }
    } catch (err) {
      setError('Error al subir el video.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Grabar Video</h1>
      {devices.length > 1 && (
        <div className="mb-2">
          <label className="mr-2">Selecciona cámara:</label>
          <select value={selectedDeviceId} onChange={handleDeviceChange}>
            {devices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>{device.label || `Cámara ${device.deviceId}`}</option>
            ))}
          </select>
        </div>
      )}
      <video ref={videoRef} autoPlay playsInline muted className="w-full rounded mb-4 bg-black" style={{ minHeight: 240 }} />
      <div className="mb-4">
        {!recording && (
          <button className="bg-green-600 text-white px-4 py-2 rounded mr-2" onClick={startRecording} disabled={!mediaStream}>Iniciar grabación</button>
        )}
        {recording && (
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={stopRecording}>Detener grabación</button>
        )}
      </div>
      {videoUrl && (
        <div className="mb-4">
          <h2 className="font-semibold mb-2">Vista previa:</h2>
          <video src={videoUrl} controls className="w-full rounded mb-2" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleUpload} disabled={uploading}>{uploading ? 'Subiendo...' : 'Subir video'}</button>
        </div>
      )}
      {error && <div className="text-red-600 font-semibold">{error}</div>}
    </div>
  );
};

export default GrabarPage; 