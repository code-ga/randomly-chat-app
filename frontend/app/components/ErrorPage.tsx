import React from "react";
import { Link } from "react-router"; // Assuming you're using react-router-dom

const ErrorPage: React.FC<{ error: string }> = ({ error }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800">
      <h1 className="text-9xl font-bold text-gray-100">404</h1>
      <p className="text-2xl font-semibold text-gray-100 mb-8">{error}</p>
      <p className="text-lg text-gray-500 mb-8">
        The page you are looking for does not work.
      </p>
      <Link
        to="/"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Go Home
      </Link>
    </div>
  );
};

export default ErrorPage;
