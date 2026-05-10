import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ErrorPage from '../pages/ErrorPage';

const Home = lazy(() => import('../pages/Home/Home'));
const Watch = lazy(() => import('../pages/Watch/Watch'));
const MovieDetails = lazy(() => import('../pages/MovieDetails/MovieDetails'));
const Search = lazy(() => import('../pages/Search/Search'));
const Movies = lazy(() => import('../pages/Movies/Movies'));
const Bollywood = lazy(() => import('../pages/Bollywood/Bollywood'));
const Animation = lazy(() => import('../pages/Animation/Animation'));
const DataExplorer = lazy(() => import('../pages/DataExplorer/DataExplorer'));
const Recommendations = lazy(() => import('../pages/Recommendations/Recommendations'));
const MyList = lazy(() => import('../pages/MyList/MyList'));
const Auth = lazy(() => import('../pages/Auth/Auth'));
const Admin = lazy(() => import('../pages/Admin/Admin'));
const Profile = lazy(() => import('../pages/Profile/Profile'));

const Loader = () => (
  <div className="h-screen w-full bg-black flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const wrap = (Component) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  { path: '/',                element: wrap(Bollywood),       errorElement: <ErrorPage /> },
  { path: '/watch/:imdbId',   element: wrap(Watch),           errorElement: <ErrorPage /> },
  { path: '/details/:id',     element: wrap(MovieDetails),    errorElement: <ErrorPage /> },
  { path: '/search',          element: wrap(Search),          errorElement: <ErrorPage /> },
  { path: '/movies',          element: wrap(Movies),          errorElement: <ErrorPage /> },
  { path: '/bollywood',       element: wrap(Bollywood),       errorElement: <ErrorPage /> },
  { path: '/animation',       element: wrap(Animation),       errorElement: <ErrorPage /> },
  { path: '/explorer',        element: wrap(DataExplorer),    errorElement: <ErrorPage /> },
  { path: '/recommendations', element: wrap(Recommendations), errorElement: <ErrorPage /> },
  { path: '/my-list',         element: wrap(MyList),          errorElement: <ErrorPage /> },
  { path: '/auth',            element: wrap(Auth),            errorElement: <ErrorPage /> },
  { path: '/admin',           element: wrap(Admin),           errorElement: <ErrorPage /> },
  { path: '/profile',         element: wrap(Profile),         errorElement: <ErrorPage /> },
  { path: '/trending',        element: wrap(Home),            errorElement: <ErrorPage /> },
  { path: '/hollywood',       element: wrap(Home),            errorElement: <ErrorPage /> },
  { path: '*',                element: <ErrorPage /> },
]);
