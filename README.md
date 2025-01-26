# Real-Time AutoTune Web App

A web-based autotune application that processes your voice in real-time and adjusts the pitch to the nearest note within a selected interval (3rd, 5th, or octave).

## Features

- Real-time pitch detection
- Interval-based pitch correction (3rd, 5th, 8th)
- Live audio visualization
- Modern, responsive UI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Click the "Start" button to begin recording
2. Select your desired interval (3rd, 5th, or 8th)
3. Sing into your microphone
4. The app will display your current note and automatically tune your voice

## Technologies Used

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Web Audio API
- Pitchy (pitch detection)
- Tone.js (audio processing)

## Deployment

This app is configured for deployment on Vercel. Simply push to your repository and connect it to Vercel for automatic deployments.
