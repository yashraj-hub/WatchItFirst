import { useNavigate } from 'react-router-dom';

const franchises = [
  { name: 'Marvel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/500px-Marvel_Logo.svg.png', query: 'Marvel', invert: false },
  { name: 'Harry Potter', logo: 'https://image.tmdb.org/t/p/original/tp9v7OfYfO672S8NoI8uT563Xp8.png', query: 'Harry Potter', invert: true },
  { name: 'Lord of the Rings', logo: 'https://image.tmdb.org/t/p/original/9HpxC60p72lBf6A2yS7J6XpG2uW.png', query: 'Lord of the Rings', invert: true },
  { name: 'Star Wars', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Star_Wars_Logo.svg/500px-Star_Wars_Logo.svg.png', query: 'Star Wars', invert: true },
  { name: 'DC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/DC_Comics_logo.svg/500px-DC_Comics_logo.svg.png', query: 'DC Comics', invert: true },
  { name: 'Jurassic Park', logo: 'https://image.tmdb.org/t/p/original/oKtRLlNEQyFgWTNHWXSFBFp5dpO.png', query: 'Jurassic Park', invert: true },
  { name: 'James Bond', logo: 'https://image.tmdb.org/t/p/original/bH7gBiMFKBfXKFpBLbJBkDsplgv.png', query: 'James Bond', invert: true },
  { name: 'Fast & Furious', logo: 'https://image.tmdb.org/t/p/original/6WxhEvFsauuACfv8HyoVX6mZKFR.png', query: 'Fast Furious', invert: true },
  { name: 'Mission Impossible', logo: 'https://image.tmdb.org/t/p/original/AkJmSQeC6bDCRMHABpkwGnNAkFt.png', query: 'Mission Impossible', invert: true },
  { name: 'The Dark Knight', logo: 'https://image.tmdb.org/t/p/original/8Y43POKjjKDGI9MH89NW0NAzzp8.png', query: 'The Dark Knight', invert: true },
];

// Duplicate for seamless loop
const items = [...franchises, ...franchises];

const FranchiseLogoMarquee = () => {
  const navigate = useNavigate();

  return (
    <div className="relative py-16 bg-black overflow-hidden border-t border-white/5">
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee 40s linear infinite;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <div className="marquee-track">
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
            className="flex items-center justify-center cursor-pointer group mx-12"
          >
            <img
              src={item.logo}
              alt={item.name}
              className="h-10 md:h-16 w-auto object-contain opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
              style={item.invert ? { filter: 'invert(1) brightness(2)' } : {}}
              onError={(e) => {
                e.target.style.display = 'none';
                const span = document.createElement('span');
                span.className = 'text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-white/30 group-hover:text-red-600 transition-colors';
                span.innerText = item.name;
                e.target.parentElement.appendChild(span);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FranchiseLogoMarquee;
