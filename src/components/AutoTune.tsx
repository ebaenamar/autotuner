'use client';

import { useEffect, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';

const INTERVALS = {
  '3rd': 4,
  '5th': 7,
  '8th': 12
};

interface AudioState {
  pitch: number;
  clarity: number;
  note: string;
}

export default function AutoTune() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<keyof typeof INTERVALS>('3rd');
  const [audioState, setAudioState] = useState<AudioState>({ pitch: 0, clarity: 0, note: '-' });
  const [volume, setVolume] = useState(0.5);
  const [inputGain, setInputGain] = useState(0.3);
  const [effectMix, setEffectMix] = useState(0.7);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;

      // Create nodes
      sourceRef.current = ctx.createMediaStreamSource(stream);
      analyserRef.current = ctx.createAnalyser();
      oscillatorRef.current = ctx.createOscillator();
      gainNodeRef.current = ctx.createGain();
      dryGainRef.current = ctx.createGain();
      wetGainRef.current = ctx.createGain();

      // Set initial gains
      dryGainRef.current.gain.value = 1 - effectMix;
      wetGainRef.current.gain.value = effectMix;
      gainNodeRef.current.gain.value = volume;

      // Create pitch detector
      const detector = PitchDetector.forFloat32Array(2048);
      const inputBuffer = new Float32Array(detector.inputLength);
      
      analyserRef.current.fftSize = 2048;
      const processorNode = ctx.createScriptProcessor(2048, 1, 1);

      processorNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        inputBuffer.set(inputData);
        const [pitch, clarity] = detector.findPitch(inputBuffer, ctx.sampleRate);

        if (clarity > 0.8) {
          // Update audio state
          const note = frequencyToNote(pitch);
          setAudioState({ pitch, clarity, note });

          // Apply pitch correction
          const correctedFreq = correctPitch(pitch, INTERVALS[selectedInterval]);
          if (oscillatorRef.current) {
            oscillatorRef.current.frequency.setValueAtTime(correctedFreq, ctx.currentTime);
          }
        }
      };

      // Connect nodes
      sourceRef.current
        .connect(analyserRef.current)
        .connect(processorNode)
        .connect(dryGainRef.current)
        .connect(ctx.destination);

      oscillatorRef.current
        .connect(wetGainRef.current)
        .connect(gainNodeRef.current)
        .connect(ctx.destination);

      oscillatorRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (audioContextRef.current) {
      oscillatorRef.current?.stop();
      oscillatorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      dryGainRef.current?.disconnect();
      wetGainRef.current?.disconnect();
      gainNodeRef.current?.disconnect();
      audioContextRef.current.close();
      setIsRecording(false);
      setAudioState({ pitch: 0, clarity: 0, note: '-' });
    }
  };

  const frequencyToNote = (frequency: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const midiNumber = Math.round(12 * Math.log2(frequency / 440) + 69);
    const noteName = noteNames[midiNumber % 12];
    const octave = Math.floor(midiNumber / 12) - 1;
    return `${noteName}${octave}`;
  };

  const correctPitch = (frequency: number, interval: number): number => {
    const midiNumber = Math.round(12 * Math.log2(frequency / 440) + 69);
    const correctedMidi = Math.round(midiNumber / interval) * interval;
    return 440 * Math.pow(2, (correctedMidi - 69) / 12);
  };

  const updateEffectMix = (value: number) => {
    setEffectMix(value);
    if (dryGainRef.current && wetGainRef.current) {
      dryGainRef.current.gain.value = 1 - value;
      wetGainRef.current.gain.value = value;
    }
  };

  const updateVolume = (value: number) => {
    setVolume(value);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = value;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl">
      <div className="space-y-8">
        {/* Controls Section */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50'
                  : 'bg-green-500 hover:bg-green-600 shadow-green-500/50'
              } shadow-lg transform hover:scale-105`}
            >
              {isRecording ? 'Stop' : 'Start'}
            </button>
            
            <select
              value={selectedInterval}
              onChange={(e) => setSelectedInterval(e.target.value as keyof typeof INTERVALS)}
              className="px-6 py-3 rounded-lg bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none transition-all duration-300"
            >
              {Object.keys(INTERVALS).map((interval) => (
                <option key={interval} value={interval}>
                  {interval}
                </option>
              ))}
            </select>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Effect Mix</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={effectMix}
                onChange={(e) => updateEffectMix(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Output Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => updateVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Note Display */}
        <div className="text-center p-8 bg-gray-700 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Current Note</h2>
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {audioState.note}
          </div>
          {audioState.clarity > 0.8 && (
            <div className="mt-2 text-sm text-gray-400">
              Frequency: {Math.round(audioState.pitch)}Hz
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-400 text-center">
          <p>Adjust the Effect Mix slider to balance between your original voice and the autotuned effect.</p>
          <p>Use the Output Volume slider to control the overall volume.</p>
        </div>
      </div>
    </div>
  );
}
