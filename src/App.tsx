import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import BarkDetector from './components/BarkDetector';
import AudioPlayer from './components/AudioPlayer';
import './components/BarkDetector.css';

// Default audio options with verified working URLs
const DEFAULT_AUDIO_OPTIONS = [
  { name: 'Beep Sound', path: 'https://assets.coderrocketfuel.com/pomodoro-times-up.mp3' },
  { name: 'Bell Sound', path: 'https://assets.coderrocketfuel.com/notification-sound.mp3' },
  { name: 'Alert Sound', path: 'https://www.soundjay.com/buttons/sounds/button-09.mp3' }
];

interface ThresholdData {
  volume: number;
  threshold: number;
  time: string;
}

function App() {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(0.7);
  const [playAudio, setPlayAudio] = useState<boolean>(false);
  const [selectedAudio, setSelectedAudio] = useState<string>(DEFAULT_AUDIO_OPTIONS[0].path);
  const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<boolean>(true); // Default to test mode for easier testing
  const [barkCount, setBarkCount] = useState<number>(0);
  const [lastBarkTime, setLastBarkTime] = useState<string>('Never');
  const [lastThresholdData, setLastThresholdData] = useState<ThresholdData | null>(null);

  // Function to handle bark detection - using useCallback to ensure stable reference
  const handleBarkDetected = useCallback((thresholdData: ThresholdData) => {
    console.log('Bark detected in App component - playing audio', thresholdData);
    
    // Update bark statistics
    setBarkCount(prev => prev + 1);
    setLastBarkTime(thresholdData.time);
    setLastThresholdData(thresholdData);
    
    // Play the audio
    setPlayAudio(true);
    
    // Visual feedback
    document.body.classList.add('bark-detected');
    setTimeout(() => {
      document.body.classList.remove('bark-detected');
    }, 500);
  }, []);

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
      setUploadedAudio(audioUrl);
      setSelectedAudio(audioUrl);
    }
  };

  // Function to handle audio selection from dropdown
  const handleDefaultAudioChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPath = event.target.value;
    console.log('Selected audio:', selectedPath);
    setSelectedAudio(selectedPath);
  };

  // Function to test audio playback
  const handleTestAudio = () => {
    console.log('Testing audio playback');
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
            <label htmlFor="default-audio">Select Response Sound:</label>
            <select 
              id="default-audio" 
              value={selectedAudio}
              onChange={handleDefaultAudioChange}
            >
              {DEFAULT_AUDIO_OPTIONS.map((option, index) => (
                <option key={index} value={option.path}>
                  {option.name}
                </option>
              ))}
              {uploadedAudio && (
                <option value={uploadedAudio}>
                  Uploaded Audio
                </option>
              )}
            </select>
            <div className="button-group">
              <button 
                className="test-audio-button" 
                onClick={handleTestAudio}
              >
                Test Sound
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
            <label htmlFor="audio-upload">Or Upload Your Own Sound:</label>
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
            />
          </div>
          
          <div className="control-group">
            <p>
              <strong>Status:</strong> {isListening ? 'Listening for barks' : 'Not listening'}
            </p>
            {playAudio && <p className="playing-status">Playing response sound...</p>}
          </div>

          <div className="control-group">
            <label htmlFor="test-mode-toggle">
              <input
                id="test-mode-toggle"
                type="checkbox"
                checked={testMode}
                onChange={() => setTestMode(!testMode)}
              />
              Test Mode (Lower thresholds for easier testing)
            </label>
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
            <li>Select one of the default sounds or upload your own</li>
            <li>Test the sound using the "Test Sound" button</li>
            <li>Click "Start Listening" to begin detecting barks</li>
            <li>Adjust the sensitivity slider if needed</li>
            <li>When your dog barks, the app will play the selected sound</li>
            <li>Use "Simulate Bark" button to test the full detection-response cycle</li>
          </ol>
          <p><strong>Note:</strong> You must grant microphone permissions for this app to work.</p>
          <p><strong>Troubleshooting:</strong> If detection isn't working well, try enabling Test Mode for more sensitive detection.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
