import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, RotateCcw, X } from 'lucide-react';

const ImageUpload = ({ onChange, label = 'Food Photo', cameraOnly = false }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [capturedFile, setCapturedFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [photoAccepted, setPhotoAccepted] = useState(false);
  const fileInputRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (cameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  useEffect(() => () => {
    stopCamera();
    if (preview) URL.revokeObjectURL(preview);
    
  }, []);

  const openCamera = async () => {
    setError('');
    setCameraLoading(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot access the camera. Open the website using HTTPS or localhost and try a supported browser.');
      setCameraLoading(false);
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      const message = err?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access in your browser settings and try again.'
        : err?.name === 'NotFoundError'
          ? 'No camera was found on this device.'
          : 'Could not open the camera. Check camera permission and try again.';
      setError(message);
      stopCamera();
    } finally {
      setCameraLoading(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('The camera is not ready yet. Please wait a moment and try again.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Could not capture the photo. Please try again.');
        return;
      }
      const file = new File([blob], `food-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const nextPreview = URL.createObjectURL(blob);
      setPreview((oldPreview) => {
        if (oldPreview) URL.revokeObjectURL(oldPreview);
        return nextPreview;
      });
      setCapturedFile(file);
      setPhotoAccepted(false);
      setError('');
      stopCamera();
      setCameraOpen(false);
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    setPreview((oldPreview) => {
      if (oldPreview) URL.revokeObjectURL(oldPreview);
      return '';
    });
    setCapturedFile(null);
    setPhotoAccepted(false);
    onChange(null);
    openCamera();
  };

  const handleExistingFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.');
      event.target.value = '';
      return;
    }
    setPreview((oldPreview) => {
      if (oldPreview) URL.revokeObjectURL(oldPreview);
      return URL.createObjectURL(file);
    });
    setCapturedFile(file);
    setPhotoAccepted(true);
    setError('');
    onChange(file);
    event.target.value = '';
  };

  const usePhoto = () => {
    if (!capturedFile) return;
    onChange(capturedFile);
    setPhotoAccepted(true);
    setError('');
  };

  const removePhoto = () => {
    stopCamera();
    setCameraOpen(false);
    setPreview((oldPreview) => {
      if (oldPreview) URL.revokeObjectURL(oldPreview);
      return '';
    });
    setCapturedFile(null);
    setPhotoAccepted(false);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!preview && !cameraOpen && (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Camera className="mx-auto mb-2 h-9 w-9 text-emerald-600" />
          <p className="text-sm font-semibold text-slate-700">Take a new food photo</p>
          {!cameraOnly && (
            <div className="mt-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"> Choose Photo </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleExistingFile} className="hidden" />
            </div>
          )}
          <button
            type="button"
            onClick={openCamera}
            disabled={cameraLoading}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {cameraLoading ? 'Opening Camera…' : 'Allow Camera'}
          </button>
        </div>
      )}

      {cameraOpen && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-950 p-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Live camera preview"
            className="max-h-[420px] min-h-48 w-full rounded-xl bg-black object-contain"
          />
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={capturePhoto} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
              <Camera className="h-4 w-4" /> Capture Photo
            </button>
            <button type="button" onClick={() => { stopCamera(); setCameraOpen(false); }} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20">
              Cancel
            </button>
          </div>
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-slate-50">
            <img src={preview} alt="Captured food preview" className="max-h-[420px] w-full object-contain" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={usePhoto} disabled={photoAccepted} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-default disabled:opacity-70">
              <CheckCircle2 className="h-4 w-4" /> {photoAccepted ? 'Photo Selected' : 'Use Photo'}
            </button>
            <button type="button" onClick={removePhoto} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">
              <X className="h-4 w-4" /> Remove
            </button>
          </div>
          {photoAccepted && <p className="text-sm font-medium text-emerald-700">Photo attached.</p>}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
