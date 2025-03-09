import React, { useRef, useEffect, useState, useCallback } from 'react';

interface AudioPlayerProps {
  audioSrc: string;
  play: boolean;
  onPlayEnd: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioSrc, play, onPlayEnd }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioLoaded, setAudioLoaded] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(2.0); // Default to 2x volume boost
  const onPlayEndRef = useRef(onPlayEnd);
  
  // Update callback ref when the prop changes
  useEffect(() => {
    onPlayEndRef.current = onPlayEnd;
  }, [onPlayEnd]);
  
  // Load the audio when the source changes
  useEffect(() => {
    if (audioSrc) {
      setError(null);
      setAudioLoaded(false);
      
      // For blob URLs (uploaded files), we don't need to check existence
      if (audioSrc.startsWith('blob:')) {
        console.log('Using uploaded audio file');
        setAudioLoaded(true);
        return;
      }
      
      // Preload the audio
      const audio = new Audio();
      audio.src = audioSrc;
      
      // Listen for the canplaythrough event
      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through:', audioSrc);
        setAudioLoaded(true);
      });
      
      // Listen for errors
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', audio.error);
        setError(`Could not load audio: ${audio.error?.message || 'Unknown error'}`);
      });
      
      // Start loading
      audio.load();
      
      // Cleanup
      return () => {
        audio.removeEventListener('canplaythrough', () => {});
        audio.removeEventListener('error', () => {});
      };
    }
  }, [audioSrc]);
  
  // Create a second audio element for layered playback (volume boosting)
  const createLayeredAudio = useCallback(() => {
    if (!audioRef.current || !audioSrc) return [];
    
    // Calculate how many layers to create based on volume
    // Volume 1.0 = 1 layer, 2.0 = 2 layers, etc.
    const layerCount = Math.floor(volume);
    const layers = [];
    
    for (let i = 0; i < layerCount; i++) {
      const audio = new Audio(audioSrc);
      audio.volume = 1.0; // Full volume for each layer
      layers.push(audio);
    }
    
    // Add a partial volume layer if needed
    const remainder = volume - layerCount;
    if (remainder > 0.01) {
      const audio = new Audio(audioSrc);
      audio.volume = remainder;
      layers.push(audio);
    }
    
    return layers;
  }, [audioSrc, volume]);
  
  // Play the audio when the play prop changes
  useEffect(() => {
    console.log('Play prop changed:', play, 'Audio loaded:', audioLoaded);
    
    if (play && audioLoaded && audioSrc) {
      console.log('Attempting to play audio with volume boost:', volume);
      
      try {
        // Create layered audio elements for volume boosting
        const layers = createLayeredAudio();
        
        // Play all layers simultaneously
        const playPromises = layers.map(audio => {
          // Reset to beginning
          audio.currentTime = 0;
          return audio.play();
        });
        
        // Handle play promises
        Promise.all(playPromises)
          .then(() => {
            console.log('Audio playback started successfully with', layers.length, 'layers');
          })
          .catch(error => {
            console.error('Audio playback failed:', error);
            setError(`Playback failed: ${error.message}`);
            onPlayEndRef.current();
          });
        
        // Set up ended event on the first layer
        if (layers.length > 0) {
          layers[0].onended = () => {
            console.log('Audio playback ended');
            // Stop any remaining layers
            layers.forEach(audio => {
              audio.pause();
              audio.currentTime = 0;
            });
            onPlayEndRef.current();
          };
        }
      } catch (error: any) {
        console.error('Immediate audio playback error:', error);
        setError(`Immediate playback error: ${error.message}`);
        onPlayEndRef.current();
      }
    }
  }, [play, audioSrc, audioLoaded, volume, createLayeredAudio]);
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    console.log('Setting volume boost to:', newVolume);
    setVolume(newVolume);
  };
  
  return (
    <div className="audio-player">
      <audio 
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        style={{ display: 'none' }}
      />
      
      <div className="volume-control">
        <div className="volume-header">
          <label htmlFor="volume-boost">
            Volume Boost: {volume.toFixed(1)}x
          </label>
        </div>
        <input
          id="volume-boost"
          type="range"
          min="1"
          max="5"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
        />
        <div className="volume-method">
          Using layered audio for volume boosting
        </div>
      </div>
      
      {error && (
        <div className="audio-error">
          {error}
        </div>
      )}
      {!audioLoaded && !error && audioSrc && (
        <div className="audio-loading">
          Loading audio...
        </div>
      )}
      <div className="audio-debug">
        <p>Audio Source: {audioSrc}</p>
        <p>Play State: {play ? 'Playing' : 'Stopped'}</p>
        <p>Loaded: {audioLoaded ? 'Yes' : 'No'}</p>
        <p>Volume Boost: {volume.toFixed(1)}x</p>
        <p>Layers: {Math.ceil(volume)}</p>
      </div>
    </div>
  );
};

export default AudioPlayer; 