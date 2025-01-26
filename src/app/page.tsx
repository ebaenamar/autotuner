'use client';

import { useEffect, useState } from 'react';
import AutoTune from '../components/AutoTune';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Real-Time AutoTune</h1>
        <AutoTune />
      </div>
    </main>
  );
}
