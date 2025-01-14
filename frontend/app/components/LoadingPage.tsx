import React from "react";

const LoadingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="w-24 h-24 border-4 border-t-blue-500 border-b-transparent rounded-full animate-spin"></div>
      <p className="mt-8 text-lg text-gray-500">Loading...</p>
    </div>
  );
};

export default LoadingPage;
