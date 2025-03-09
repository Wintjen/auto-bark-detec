# Dog Bark Detector

A React web application that detects dog barks and plays a sound in response. This can be useful for training your dog or alerting you when your dog barks.

## Features

- Real-time dog bark detection using audio analysis
- Customizable sensitivity to adjust for different environments
- Option to upload your own response sound
- Visual feedback with volume meter
- Simple and intuitive user interface

## How It Works

The application uses your device's microphone to listen for sounds. It analyzes the audio in real-time using the Meyda audio processing library to detect characteristics typical of dog barks:

1. Volume (amplitude)
2. Spectral flatness (how tonal vs. noisy the sound is)
3. Spectral centroid (the "brightness" or frequency distribution)

When a bark is detected, the app plays your selected audio response.

## Getting Started

### Prerequisites

- Node.js and npm installed on your computer
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Microphone access

### Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/dog-bark-detector.git
   cd dog-bark-detector
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Adding a Response Sound

You can add a default response sound by placing an MP3 file named `response.mp3` in the `public/audio/` directory.

Alternatively, you can upload any audio file through the app's interface.

## Usage

1. Grant microphone permissions when prompted
2. (Optional) Upload a custom response sound
3. Click "Start Listening" to begin bark detection
4. Adjust the sensitivity slider if needed:
   - Higher sensitivity: Detects more sounds as barks (may have false positives)
   - Lower sensitivity: More selective about what counts as a bark
5. When your dog barks, the app will play the response sound

## Privacy

This application processes all audio locally in your browser. No audio data is sent to any server or stored permanently.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Create React App](https://github.com/facebook/create-react-app)
- [Meyda](https://github.com/meyda/meyda) - Audio feature extraction library
