'use client';

import { useEffect, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';
import * as Tone from 'tone';

const INTERVALS = {
  '3rd': 4, // 4 semitones
  '5th': 7, // 7 semitones
  '8th': 12 // 12 semitones (octave)
};

export default function AutoTune() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<keyof typeof INTERVALS>('3rd');
  const [currentNote, setCurrentNote] = useState<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      const detector = PitchDetector.forFloat32Array(4096);
      const input = new Float32Array(detector.inputLength);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        input.set(inputData);
        const [pitch, clarity] = detector.findPitch(input, audioContextRef.current!.sampleRate);

        if (clarity > 0.8) {
          // Convert frequency to note
          const note = frequencyToNote(pitch);
          setCurrentNote(note);
          
          // Apply pitch correction based on selected interval
          const correctedFreq = correctPitch(pitch, INTERVALS[selectedInterval]);
          applyPitchCorrection(correctedFreq, e.outputBuffer.getChannelData(0));
        }
      };

      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      setIsRecording(false);
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

  const applyPitchCorrection = (targetFreq: number, outputBuffer: Float32Array) => {
    // Simple pitch shifting using resampling
    const pitchRatio = targetFreq / (audioContextRef.current?.sampleRate || 44100);
    for (let i = 0; i < outputBuffer.length; i++) {
      const index = Math.floor(i * pitchRatio);
      if (index < outputBuffer.length) {
        outputBuffer[i] = outputBuffer[index];
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center space-x-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRecording ? 'Stop' : 'Start'}
        </button>
        <select
          value={selectedInterval}
          onChange={(e) => setSelectedInterval(e.target.value as keyof typeof INTERVALS)}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white"
        >
          {Object.keys(INTERVALS).map((interval) => (
            <option key={interval} value={interval}>
              {interval}
            </option>
          ))}
        </select>
      </div>
      
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Current Note</h2>
        <div className="text-4xl font-bold">{currentNote || '-'}</div>
      </div>
    </div>
  );
}
