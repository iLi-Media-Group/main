import React from 'react';

interface SecurityBlockProps {
  violations: string[];
  onClearViolations: () => void;
  isBlocked: boolean;
}

export const SecurityBlock: React.FC<SecurityBlockProps> = ({
  violations,
  onClearViolations,
  isBlocked,
}) => {
  if (!isBlocked && violations.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {isBlocked ? 'Access Blocked' : 'Security Warning'}
            </h3>
            <p className="text-sm text-gray-500">
              {isBlocked 
                ? 'Your access has been temporarily blocked due to security violations.'
                : 'Security violations detected. Please review your actions.'
              }
            </p>
          </div>
        </div>

        {violations.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Violations:</h4>
            <div className="max-h-32 overflow-y-auto">
              {violations.slice(-5).map((violation, index) => (
                <div key={index} className="text-xs text-gray-600 mb-1 p-2 bg-gray-50 rounded">
                  {violation}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          {!isBlocked && (
            <button
              onClick={onClearViolations}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Clear Violations
            </button>
          )}
          
          {isBlocked && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>
            If you believe this is an error, please contact support with your user ID and timestamp.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityBlock; 