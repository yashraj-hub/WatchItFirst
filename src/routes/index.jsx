import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home/Home';
import Watch from '../pages/Watch/Watch';
import MovieDetails from '../pages/MovieDetails/MovieDetails';
import Search from '../pages/Search/Search';
import Movies from '../pages/Movies/Movies';
import Bollywood from '../pages/Bollywood/Bollywood';
import Animation from '../pages/Animation/Animation';
import DataExplorer from '../pages/DataExplorer/DataExplorer';
import ErrorPage from '../pages/ErrorPage';

import Recommendations from '../pages/Recommendations/Recommendations';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/watch/:imdbId',
    element: <Watch />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/details/:id',
    element: <MovieDetails />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/search',
    element: <Search />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/movies',
    element: <Movies />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/bollywood',
    element: <Bollywood />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/animation',
    element: <Animation />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/explorer',
    element: <DataExplorer />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/recommendations',
    element: <Recommendations />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/trending',
    element: <Home />, // Placeholder
    errorElement: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
]);
