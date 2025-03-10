import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import BarkDetector from './components/BarkDetector';
import AudioPlayer from './components/AudioPlayer';
import './components/BarkDetector.css';

// Default audio options with verified working URLs
const DEFAULT_AUDIO_OPTIONS = [
  { name: 'Beep Sound', path: 'https://assets.coderrocketfuel.com/pomodoro-times-up.mp3' },
];

// Interface for audio files
interface AudioFile {
  name: string;
  path: string;
}

interface ThresholdData {
  volume: number;
  threshold: number;
  time: string;
}

function App() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(1);
  const [playAudio, setPlayAudio] = useState<boolean>(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(DEFAULT_AUDIO_OPTIONS);
  const [selectedAudio, setSelectedAudio] = useState<string>(DEFAULT_AUDIO_OPTIONS[0].path);
  const [testMode, setTestMode] = useState<boolean>(false); // Default to test mode for easier testing
  const [barkCount, setBarkCount] = useState<number>(0);
  const [lastBarkTime, setLastBarkTime] = useState<string>('Never');
  const [lastThresholdData, setLastThresholdData] = useState<ThresholdData | null>(null);
  const [randomPlayback, setRandomPlayback] = useState<boolean>(true);
  const [customAudioName, setCustomAudioName] = useState<string>('');

  // Function to handle bark detection - using useCallback to ensure stable reference
  const handleBarkDetected = useCallback((thresholdData: ThresholdData) => {
    console.log('Bark detected in App component - playing audio', thresholdData);
    
    // Update bark statistics
    setBarkCount(prev => prev + 1);
    setLastBarkTime(thresholdData.time);
    setLastThresholdData(thresholdData);
    
    // If random playback is enabled and we have multiple audio files, select a random one
    if (randomPlayback && audioFiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * audioFiles.length);
      setSelectedAudio(audioFiles[randomIndex].path);
    }
    
    // Play the audio
    setPlayAudio(true);
    
    // Visual feedback
    document.body.classList.add('bark-detected');
    setTimeout(() => {
      document.body.classList.remove('bark-detected');
    }, 500);
  }, [randomPlayback, audioFiles]);

  // Function to handle audio playback completion
  const handleAudioEnded = useCallback(() => {
    console.log('Audio playback ended');
    setPlayAudio(false);
  }, []);

  // Function to handle audio file upload
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Audio file uploaded:', file.name);
      const audioUrl = URL.createObjectURL(file);
      const fileName = customAudioName || file.name;
      
      // Add the new audio file to the list
      const newAudioFile = { name: fileName, path: audioUrl };
      setAudioFiles(prev => [...prev, newAudioFile]);
      setSelectedAudio(audioUrl);
      setCustomAudioName(''); // Reset the custom name field
    }
  };

  // Function to handle audio selection from dropdown
  const handleDefaultAudioChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPath = event.target.value;
    console.log('Selected audio:', selectedPath);
    setSelectedAudio(selectedPath);
  };

  // Function to remove an audio file
  const handleRemoveAudio = (path: string) => {
    setAudioFiles(prev => prev.filter(audio => audio.path !== path));
    
    // If the removed audio was selected, select the first available one
    if (selectedAudio === path && audioFiles.length > 1) {
      const remainingAudios = audioFiles.filter(audio => audio.path !== path);
      if (remainingAudios.length > 0) {
        setSelectedAudio(remainingAudios[0].path);
      }
    }
  };

  // Function to test audio playback
  const handleTestAudio = () => {
    console.log('Testing audio playback');
    
    // If random playback is enabled, select a random audio file for testing
    if (randomPlayback && audioFiles.length > 0) {
      const randomIndex = Math.floor(Math.random() * audioFiles.length);
      setSelectedAudio(audioFiles[randomIndex].path);
    }
    
    setPlayAudio(true);
  };

  // Function to simulate a bark for testing
  const handleSimulateBark = () => {
    console.log('Simulating bark detection');
    const simulatedData = {
      volume: 0.1,
      threshold: 0.05,
      time: new Date().toLocaleTimeString()
    };
    handleBarkDetected(simulatedData);
  };

  // Debug log when playAudio changes
  useEffect(() => {
    console.log('playAudio state changed:', playAudio);
  }, [playAudio]);

  // Format a number to display with 4 decimal places
  const formatNumber = (num: number) => {
    return num.toFixed(4);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dog Bark Detector</h1>
        <p>This app listens for dog barks and plays a sound in response</p>
      </header>
      
      <main className="App-main">
        <div className="controls">
          <div className="control-group">
            <label htmlFor="listening-toggle">
              <input
                id="listening-toggle"
                type="checkbox"
                checked={isListening}
                onChange={() => setIsListening(!isListening)}
              />
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </label>
          </div>
          
          <div className="control-group">
            <label htmlFor="sensitivity">
              Sensitivity: {sensitivity.toFixed(1)}
            </label>
            <input
              id="sensitivity"
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            />
          </div>
          
          <div className="control-group">
            <label htmlFor="random-playback-toggle">
              <input
                id="random-playback-toggle"
                type="checkbox"
                checked={randomPlayback}
                onChange={() => setRandomPlayback(!randomPlayback)}
              />
              Random Sound Selection
            </label>
            <p className="help-text">
              {randomPlayback 
                ? "A random sound will be played each time a bark is detected" 
                : "The selected sound will be played each time a bark is detected"}
            </p>
          </div>
          
          <div className="control-group">
            <label htmlFor="default-audio">Available Sounds:</label>
            <div className="audio-list">
              {audioFiles.map((audio, index) => (
                <div key={index} className="audio-item">
                  <input
                    type="radio"
                    id={`audio-${index}`}
                    name="audio-selection"
                    checked={selectedAudio === audio.path}
                    onChange={() => setSelectedAudio(audio.path)}
                  />
                  <label htmlFor={`audio-${index}`}>{audio.name}</label>
                  <button 
                    className="remove-audio-button"
                    onClick={() => handleRemoveAudio(audio.path)}
                    disabled={audioFiles.length <= 1} // Prevent removing the last audio file
                  >
                    Remove
                  </button>
                  <button 
                    className="test-audio-button small" 
                    onClick={() => {
                      setSelectedAudio(audio.path);
                      setPlayAudio(true);
                    }}
                  >
                    Test
                  </button>
                </div>
              ))}
            </div>
            <div className="button-group">
              <button 
                className="test-audio-button" 
                onClick={handleTestAudio}
              >
                Test {randomPlayback ? 'Random' : 'Selected'} Sound
              </button>
              <button 
                className="simulate-button" 
                onClick={handleSimulateBark}
              >
                Simulate Bark
              </button>
            </div>
          </div>
          
          <div className="control-group">
            <label htmlFor="audio-name">Custom Sound Name:</label>
            <input
              id="audio-name"
              type="text"
              value={customAudioName}
              onChange={(e) => setCustomAudioName(e.target.value)}
              placeholder="Enter a name for your sound"
            />
            <label htmlFor="audio-upload">Upload Sound File:</label>
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
            />
            <p className="help-text">
              Upload MP3, WAV, or other audio files to use as response sounds
            </p>
          </div>
          
          <div className="control-group">
            <p>
              <strong>Status:</strong> {isListening ? 'Listening for barks' : 'Not listening'}
            </p>
            {playAudio && <p className="playing-status">Playing response sound...</p>}
          </div>
          
          <div className="stats-panel">
            <h3>Detection Statistics</h3>
            <p><strong>Barks Detected:</strong> {barkCount}</p>
            <p><strong>Last Bark:</strong> {lastBarkTime}</p>
            {lastThresholdData && (
              <div className="threshold-data">
                <p><strong>Last Detection Details:</strong></p>
                <p>Volume: {formatNumber(lastThresholdData.volume)} (Threshold: {formatNumber(lastThresholdData.threshold)})</p>
                <p>Ratio: {formatNumber(lastThresholdData.volume / lastThresholdData.threshold)}x above threshold</p>
              </div>
            )}
          </div>
        </div>
        
        <BarkDetector
          onBarkDetected={handleBarkDetected}
          sensitivity={testMode ? sensitivity * 0.5 : sensitivity}
          isListening={isListening}
        />
        
        <AudioPlayer
          audioSrc={selectedAudio}
          play={playAudio}
          onPlayEnd={handleAudioEnded}
        />
        
        <div className="instructions">
          <h2>How to use:</h2>
          <ol>
            <li>Add your own sounds by uploading audio files</li>
            <li>Enable "Random Sound Selection" to play a random sound when a bark is detected</li>
            <li>Test your sounds using the "Test Sound" button</li>
            <li>Click "Start Listening" to begin detecting barks</li>
            <li>Adjust the sensitivity slider if needed</li>
            <li>When your dog barks, the app will play the selected or a random sound</li>
            <li>Use "Simulate Bark" button to test the full detection-response cycle</li>
          </ol>
          <p><strong>Note:</strong> You must grant microphone permissions for this app to work.</p>
          <p><strong>Troubleshooting:</strong> If detection isn't working well, try adjusting the sensitivity.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
