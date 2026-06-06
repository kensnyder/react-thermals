import { GlobalRegistrator } from '@happy-dom/global-registrator';
import '@testing-library/jest-dom';
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const serverGlobals = [
  'AbortController',
  'AbortSignal',
  'atob',
  'Blob',
  'Buffer',
  'BuildMessage',
  'ByteLengthQueuingStrategy',
  'btoa',
  'CountQueuingStrategy',
  'crypto',
  'Crypto',
  'CryptoKey',
  'DOMException',
  'fetch',
  'File',
  'FormData',
  'Headers',
  'HTMLRewriter',
  'JSON',
  'performance',
  'prompt',
  'ReadableByteStreamController',
  'ReadableStream',
  'ReadableStreamDefaultController',
  'ReadableStreamDefaultReader',
  'reportError',
  'ResolveMessage',
  'Response',
  'Request',
  'SubtleCrypto',
  'TextDecoder',
  'TextEncoder',
  'TransformStream',
  'TransformStreamDefaultController',
  'URL',
  'URLSearchParams',
  'WebAssembly',
  'WritableStream',
  'WritableStreamDefaultController',
  'WritableStreamDefaultWriter',
];

// Step 1: Record Bun's original globals
const bunGlobals: Partial<typeof globalThis> = {};
serverGlobals.forEach(name => {
  if (name in globalThis) {
    bunGlobals[name] = globalThis[name];
  }
});

// Step 2: Register Happy DOM
GlobalRegistrator.register();

// Step 3: Restore Bun's globals
Object.entries(bunGlobals).forEach(([name, value]) => {
  globalThis[name] = value;
});
