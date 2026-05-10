import { Link } from 'react-router-dom';

const AnimatedLogo = ({ size = 'md', className = '' }) => {
  const textSize = size === 'sm' ? 'text-sm md:text-base' : size === 'lg' ? 'text-xl md:text-2xl' : 'text-base md:text-lg';

  return (
    <Link to="/" aria-label="MoviesBox home" className={`inline-flex items-center select-none ${className}`}>
      <span className={`font-black uppercase tracking-tighter leading-none ${textSize}`}>
        <span className="text-white">Movies</span><span className="text-yellow-400">Box</span>
      </span>
    </Link>
  );
};

export default AnimatedLogo;
