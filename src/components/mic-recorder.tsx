"use client";

import React from 'react';
import Image from 'next/image';
import micImg from './image.png';

type MicRecorderProps = {
  onResult: (data: { text?: string; parsed?: any }) => void;
  targetForm?: 'onboarding' | 'expense';
  // optional custom image for the mic button
  imageSrc?: string;
  imageAlt?: string;
};

export function MicRecorder({ onResult, targetForm = 'onboarding', imageSrc, imageAlt }: MicRecorderProps) {
  const [recording, setRecording] = React.useState(false);
  const [transcript, setTranscript] = React.useState<string>('');
  const [processing, setProcessing] = React.useState(false);
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        setProcessing(true);
        setTranscript('Processing audio...');
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = bufferToBase64(arrayBuffer);

          // send to speech-to-text
          const { getApiUrl } = await import('@/lib/utils');
          const sttRes = await fetch(getApiUrl('api/speech-to-text'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64, mimeType: 'audio/webm' }),
          });

          if (!sttRes.ok) throw new Error('Speech recognition failed');

          const sttJson = await sttRes.json();
          const text = (sttJson?.text ?? '').trim();

          if (!text) {
            setTranscript('No speech detected. Try again.');
            setProcessing(false);
            return;
          }

          setTranscript(text);
          setTranscript('Parsing details...');

          // parse fields
          const parseRes = await fetch(getApiUrl('api/parse-fields'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetForm }),
          });

          if (!parseRes.ok) throw new Error('Failed to parse details');

          const parseJson = await parseRes.json();
          setTranscript(text); // Restore the actual text

          onResult({ text, parsed: parseJson?.parsed ?? null });
        } catch (err) {
          console.error('mic processing error', err);
          setTranscript('Error processing voice. Try again.');
        } finally {
          setProcessing(false);
        }
      };
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error('mic start error', err);
    }
  }

  function stop() {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
      setRecording(false);
      // stop all tracks
      (mediaRef.current as any).stream?.getTracks?.().forEach((t: any) => t.stop());
    }
  }

  function bufferToBase64(buf: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buf);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  return (
    <div className="flex items-center gap-2 max-w-full">
      <button
        type="button"
        onClick={() => (recording ? stop() : start())}
        aria-pressed={recording}
        className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full shadow-sm border transition-colors ${recording
          ? 'bg-destructive text-destructive-foreground border-destructive'
          : 'bg-background text-foreground hover:bg-accent'
          }`}
      >
        {/** Use provided imageSrc, otherwise fall back to bundled image.png. If not present show SVG. */}
        {(imageSrc || micImg) ? (
          // If imageSrc is provided as string, use regular img. If using imported static image, use next/image for optimization.
          typeof (imageSrc) === 'string' && imageSrc ? (
            <img src={imageSrc} alt={imageAlt || 'mic'} className="w-5 h-5 object-contain" />
          ) : (
            <div className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white p-1">
              <Image src={micImg} alt={imageAlt || 'mic'} width={32} height={32} className="object-contain" />
            </div>
          )
        ) : recording ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 5 5 0 0 0 4 4.9V19a1 1 0 1 0 2 0v-3.1A5 5 0 0 0 19 11z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 1v10" />
            <path d="M8 7a4 4 0 0 0 8 0" />
            <path d="M19 11a7 7 0 0 1-14 0" />
            <path d="M12 21v-4" />
            <path d="M8 21h8" />
          </svg>
        )}
      </button>

      {/* Transcript: allow truncation, take remaining space, vertically centered */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center h-10 text-xs text-muted-foreground min-w-0">
          <span className="truncate block">{recording ? 'Recording…' : transcript || 'Speak to log'}</span>
        </div>
      </div>
    </div>
  );
}

export default MicRecorder;
