'use client';

import { useState } from 'react';

export default function SentryTestPage() {
  const [errorType, setErrorType] = useState('');

  const throwError = (type: string) => {
    setErrorType(type);
    
    switch(type) {
      case 'runtime':
        throw new Error('Test runtime error from Sentry integration');
      case 'async':
        setTimeout(() => {
          throw new Error('Test async error from Sentry integration');
        }, 100);
        break;
      case 'promise':
        Promise.reject(new Error('Test promise rejection from Sentry integration'));
        break;
      case 'reference':
        // @ts-ignore
        nonExistentFunction();
        break;
      case 'type':
        const obj: any = null;
        console.log(obj.property);
        break;
      default:
        console.log('Select an error type');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Sentry Error Testing</h1>
      
      <div className="space-y-4">
        <p className="text-gray-600">Click a button to trigger different error types:</p>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => throwError('runtime')}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Throw Runtime Error
          </button>
          
          <button
            onClick={() => throwError('async')}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Throw Async Error
          </button>
          
          <button
            onClick={() => throwError('promise')}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Reject Promise
          </button>
          
          <button
            onClick={() => throwError('reference')}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Reference Error
          </button>
          
          <button
            onClick={() => throwError('type')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Type Error
          </button>
        </div>
        
        {errorType && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p>Last triggered error: <strong>{errorType}</strong></p>
          </div>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="text-xl font-semibold mb-2">Sentry Integration Status</h2>
        <p className="text-sm text-gray-600">
          Errors thrown on this page will be automatically captured by Sentry.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Codegen will analyze these errors and create automatic fixes via Pull Requests.
        </p>
      </div>
    </div>
  );
}