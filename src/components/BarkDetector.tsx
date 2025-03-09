import React, { useState, useEffect, useRef } from 'react';
import Meyda from 'meyda';

interface BarkDetectorProps {
  onBarkDetected: (thresholdData: {
    volume: number,
    threshold: number,
    time: string
  }) => void;
  sensitivity: number;
  isListening: boolean;
}

const BarkDetector: React.FC<BarkDetectorProps> = ({ 
  onBarkDetected, 
  sensitivity = 0.7, 
  isListening 
}) => {
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [detectionData, setDetectionData] = useState<any>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<any>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const callbackRef = useRef(onBarkDetected);
  
  // Update callback ref when the prop changes
  useEffect(() => {
    callbackRef.current = onBarkDetected;
  }, [onBarkDetected]);
  
  // Threshold values for bark detection - lower thresholds for easier detection
  const VOLUME_THRESHOLD = 0.55 * sensitivity;
  const SPECTRAL_FLATNESS_THRESHOLD = 0.7 * (1 - sensitivity);
  const SPECTRAL_CENTROID_MIN = 500 * sensitivity;
  const SPECTRAL_CENTROID_MAX = 6000 * sensitivity;
  
  // Cooldown to prevent multiple detections
  const lastBarkRef = useRef<number>(0);
  const COOLDOWN_PERIOD = 1000; // 1 second cooldown
  
  useEffect(() => {
    // Create audio context only once
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
      } catch (err) {
        console.error('Failed to create AudioContext:', err);
        setError('Your browser does not support Web Audio API. Please try a different browser.');
        return;
      }
    }

    if (isListening && !isSetup) {
      setupAudio();
    } else if (!isListening && isSetup) {
      stopAudio();
    }
    
    return () => {
      if (isSetup) {
        stopAudio();
      }
    };
  }, [isListening, isSetup]);
  
  const setupAudio = async () => {
    if (!audioContextRef.current) return;
    
    try {
      // Resume audio context if it's suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Create source from microphone
      const source = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Create analyzer
      analyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContextRef.current,
        source: source,
        bufferSize: 512,
        featureExtractors: ['rms', 'spectralFlatness', 'spectralCentroid'],
        callback: analyzeAudio
      });
      
      // Start analyzing
      analyzerRef.current.start();
      
      console.log('Audio setup complete, analyzer started');
      setIsSetup(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions and try again.');
    }
  };
  
  const stopAudio = () => {
    console.log('Stopping audio analysis');
    
    if (analyzerRef.current) {
      analyzerRef.current.stop();
      analyzerRef.current = null;
    }
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        console.log('Stopping track:', track.kind, track.readyState);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current = null;
    }
    
    // Don't close the audio context, just keep it for reuse
    setIsSetup(false);
  };
  
  const analyzeAudio = (features: any) => {
    if (!features) return;
    
    const currentVolume = features.rms;
    setVolume(currentVolume);
    
    // Update detection data for display
    setDetectionData({
      volume: currentVolume,
      flatness: features.spectralFlatness,
      centroid: features.spectralCentroid
    });
    
    // Debug output to see if we're getting audio data
    if (currentVolume > 0.01) {
      console.log('Audio detected:', {
        volume: currentVolume,
        flatness: features.spectralFlatness,
        centroid: features.spectralCentroid
      });
    }
    
    const now = Date.now();
    const timeSinceLastBark = now - lastBarkRef.current;
    
    // Check if we're in cooldown period
    if (timeSinceLastBark < COOLDOWN_PERIOD) {
      return;
    }
    
    // FOR TESTING: Simplified detection - just use volume
    if (currentVolume > VOLUME_THRESHOLD) {
      console.log('Loud sound detected!', {
        volume: currentVolume,
        threshold: VOLUME_THRESHOLD
      });
      
      // Trigger the callback directly for testing
      lastBarkRef.current = now;
      
      // Create threshold data to pass to the callback
      const thresholdData = {
        volume: currentVolume,
        threshold: VOLUME_THRESHOLD,
        time: new Date().toLocaleTimeString()
      };
      
      // Use the current callback from the ref to ensure we're using the latest function
      if (callbackRef.current) {
        console.log('Calling onBarkDetected callback with data:', thresholdData);
        callbackRef.current(thresholdData);
      } else {
        console.error('onBarkDetected callback is not defined');
      }
      
      return;
    }
    
    // Full bark detection logic (commented out for now to simplify testing)
    /*
    // Simplified bark detection logic for easier testing
    const isLoudEnough = currentVolume > VOLUME_THRESHOLD;
    const hasRightFlatness = features.spectralFlatness < SPECTRAL_FLATNESS_THRESHOLD;
    const hasRightCentroid = features.spectralCentroid > SPECTRAL_CENTROID_MIN && 
                            features.spectralCentroid < SPECTRAL_CENTROID_MAX;
    
    // For testing, we can just use volume as the main indicator
    if (isLoudEnough) {
      console.log('Loud sound detected!', {
        volume: currentVolume,
        threshold: VOLUME_THRESHOLD
      });
      
      // If it also has the right spectral characteristics, it's likely a bark
      if (hasRightFlatness && hasRightCentroid) {
        console.log('BARK DETECTED!', {
          volume: currentVolume,
          flatness: features.spectralFlatness,
          centroid: features.spectralCentroid,
          thresholds: {
            volume: VOLUME_THRESHOLD,
            flatness: SPECTRAL_FLATNESS_THRESHOLD,
            centroidMin: SPECTRAL_CENTROID_MIN,
            centroidMax: SPECTRAL_CENTROID_MAX
          }
        });
        lastBarkRef.current = now;
        callbackRef.current({
          volume: currentVolume,
          threshold: VOLUME_THRESHOLD,
          time: new Date().toLocaleTimeString()
        });
      }
    }
    */
  };
  
  return (
    <div className="bark-detector">
      <div className="status">
        {error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="status-indicator">
              {isSetup ? 'Listening for barks...' : 'Microphone off'}
            </div>
            <div className="volume-meter">
              <div 
                className="volume-bar" 
                style={{ 
                  width: `${Math.min(volume * 100 * 5, 100)}%`,
                  backgroundColor: volume > VOLUME_THRESHOLD ? '#ff6b6b' : '#4ecdc4'
                }}
              />
            </div>
            <div className="debug-info">
              <p>Current volume: {volume.toFixed(4)}</p>
              <p>Threshold: {VOLUME_THRESHOLD.toFixed(4)}</p>
              {detectionData && (
                <>
                  <p>Spectral Flatness: {detectionData.flatness?.toFixed(4) || 'N/A'}</p>
                  <p>Spectral Centroid: {detectionData.centroid?.toFixed(0) || 'N/A'} Hz</p>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BarkDetector; 