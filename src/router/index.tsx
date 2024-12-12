import React from 'react';
import { createBrowserRouter, createHashRouter } from 'react-router-dom';
import SignUpHistory from '../components/SignUpHistory';

const router = createHashRouter([
  {
    path: '/',
    children: [
      {
        path: 'signup-history',
        element: <SignUpHistory />,
      }
    ]
  }
]);

export default router; 