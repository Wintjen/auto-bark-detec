import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';

interface BarkAIDetectorProps {
  onBarkDetected: (thresholdData: {
    volume: number,
    threshold: number,
    time: string
  }) => void;
  isListening: boolean;
  sensitivity: number;
}

const BarkAIDetector: React.FC<BarkAIDetectorProps> = ({ 
  onBarkDetected, 
  isListening,
  sensitivity = 0.7
}) => {
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  
  const recognizerRef = useRef<speechCommands.SpeechCommandRecognizer | null>(null);
  const callbackRef = useRef(onBarkDetected);
  
  // Update callback ref when the prop changes
  useEffect(() => {
    callbackRef.current = onBarkDetected;
  }, [onBarkDetected]);
  
  // Initialize the model on component mount
  useEffect(() => {
    async function loadModel() {
      try {
        // Load TensorFlow.js model
        await tf.ready();
        console.log('TensorFlow.js is ready');
        
        // Create the recognizer with default options
        recognizerRef.current = speechCommands.create('BROWSER_FFT');
        
        // Load the model
        await recognizerRef.current.ensureModelLoaded();
        
        // Get available labels
        const labels = recognizerRef.current.wordLabels();
        console.log('Available sound classes:', labels);
        
        setModelLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Failed to load model:', err);
        setError('Failed to load AI model. Please check your internet connection and try again.');
      }
    }
    
    loadModel();
    
    // Cleanup function
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stopListening();
      }
    };
  }, []);
  
  // Start/stop listening based on isListening prop
  useEffect(() => {
    if (!modelLoaded || !recognizerRef.current) return;
    
    if (isListening) {
      // Calculate probability threshold based on sensitivity
      const probabilityThreshold = 0.8 - (sensitivity * 0.3); // Range: 0.5 to 0.8
      
      // Start listening
      recognizerRef.current.listen(
        async (result) => {
          // Get the top prediction
          const scores = result.scores as Float32Array;
          // Find the index with the highest score
          let maxScore = 0;
          let maxScoreIndex = -1;
          
          for (let i = 0; i < scores.length; i++) {
            if (scores[i] > maxScore) {
              maxScore = scores[i];
              maxScoreIndex = i;
            }
          }
          
          const predictedLabel = recognizerRef.current?.wordLabels()[maxScoreIndex];
          
          // Update state with prediction
          setPrediction(predictedLabel || null);
          setConfidence(maxScore);
          
          // Check if it's a dog bark
          // Since the default model doesn't have "bark" as a class, we'll look for sounds
          // that might be similar to barks: "yes", "no", or "unknown"
          // In a real implementation, you'd train a custom model with dog bark samples
          if (
            (predictedLabel === 'yes' || predictedLabel === 'no' || predictedLabel === '_unknown_') && 
            maxScore > probabilityThreshold
          ) {
            console.log('Potential bark detected:', predictedLabel, maxScore);
            
            // Create threshold data
            const thresholdData = {
              volume: maxScore,
              threshold: probabilityThreshold,
              time: new Date().toLocaleTimeString()
            };
            
            // Call the callback
            callbackRef.current(thresholdData);
          }
        },
        {
          probabilityThreshold
        }
      );
      
      console.log('AI bark detection started');
    } else {
      // Stop listening
      recognizerRef.current.stopListening();
      console.log('AI bark detection stopped');
    }
  }, [isListening, modelLoaded, sensitivity]);
  
  return (
    <div className="bark-ai-detector">
      <div className="status">
        {error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="status-indicator">
              {!modelLoaded ? (
                'Loading AI model...'
              ) : isListening ? (
                'AI listening for barks...'
              ) : (
                'AI detector off'
              )}
            </div>
            {modelLoaded && isListening && (
              <div className="ai-debug-info">
                <p>Current prediction: {prediction || 'None'}</p>
                <p>Confidence: {(confidence * 100).toFixed(2)}%</p>
                <p>Threshold: {((0.8 - (sensitivity * 0.3)) * 100).toFixed(2)}%</p>
                <p className="ai-note">
                  Note: This is using a general-purpose sound classifier. 
                  For better results, a custom model trained specifically on dog barks would be needed.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BarkAIDetector; 