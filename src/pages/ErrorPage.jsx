import { useRouteError } from 'react-router-dom';

const ErrorPage = () => {
  const error = useRouteError();
  const status = error?.status || error?.statusCode || 404;
  const message =
    error?.statusText ||
    error?.message ||
    'Not Found';

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="text-center">
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none">
          {status}
        </h1>
        <p className="mt-4 text-lg md:text-3xl font-bold uppercase tracking-[0.3em]">
          {message}
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;
