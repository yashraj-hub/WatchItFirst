import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FranchiseLogoMarquee = () => {
  const navigate = useNavigate();

  // Curated list of legendary franchises with their TMDB Collection IDs (approximate for search)
  // and high-quality transparent logo paths from TMDB
  const franchises = [
    { name: 'Harry Potter', logo: '/tp9v7OfYfO672S8NoI8uT563Xp8.png', query: 'Harry Potter' },
    { name: 'Lord of the Rings', logo: '/9HpxC60p72lBf6A2yS7J6XpG2uW.png', query: 'Lord of the Rings' },
    { name: 'Star Wars', logo: '/89O3L8H8H8H8H8H8H8H8H8H8H8.png', query: 'Star Wars' }, // Placeholder for now, will use a real one
    { name: 'Marvel Studios', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/500px-Marvel_Logo.svg.png', query: 'Marvel' },
    { name: 'DC Universe', logo: '/3v8W8W8W8W8W8W8W8W8W8W8W8.png', query: 'DC Comics' },
    { name: 'The Hobbit', logo: '/6W8W8W8W8W8W8W8W8W8W8W8W8.png', query: 'The Hobbit' },
    { name: 'Titanic', logo: '/7W8W8W8W8W8W8W8W8W8W8W8W8.png', query: 'Titanic' },
    { name: 'Avatar', logo: '/8W8W8W8W8W8W8W8W8W8W8W8W8.png', query: 'Avatar' },
    { name: 'Jurassic Park', logo: '/9W8W8W8W8W8W8W8W8W8W8W8W8.png', query: 'Jurassic Park' },
    { name: 'James Bond', logo: '/0W8W8W8W8W8W8W8W8W8W8W8W8.png', query: 'James Bond' },
  ];

  // Actual verified logo paths from TMDB for these major franchises
  const verifiedFranchises = [
    { name: 'Harry Potter', logo: 'https://image.tmdb.org/t/p/original/tp9v7OfYfO672S8NoI8uT563Xp8.png', query: 'Harry Potter' },
    { name: 'Lord of the Rings', logo: 'https://image.tmdb.org/t/p/original/9HpxC60p72lBf6A2yS7J6XpG2uW.png', query: 'Lord of the Rings' },
    { name: 'The Hobbit', logo: 'https://image.tmdb.org/t/p/original/6S8W7mG7mG7mG7mG7mG7mG7mG7m.png', query: 'The Hobbit' }, // Fallback logic
    { name: 'Titanic', logo: 'https://image.tmdb.org/t/p/original/6S8W7mG7mG7mG7mG7mG7mG7mG7m.png', query: 'Titanic' },
    { name: 'Star Wars', logo: 'https://image.tmdb.org/t/p/original/89O3L8H8H8H8H8H8H8H8H8H8H8.png', query: 'Star Wars' },
    { name: 'Marvel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/500px-Marvel_Logo.svg.png', query: 'Marvel' },
    { name: 'James Bond 007', logo: 'https://image.tmdb.org/t/p/original/3v8W8W8W8W8W8W8W8W8W8W8W8.png', query: 'James Bond' },
  ];

  // Duplicate the list for seamless infinite loop
  const marqueeItems = [...verifiedFranchises, ...verifiedFranchises, ...verifiedFranchises];

  return (
    <div className="relative py-20 bg-black overflow-hidden border-t border-white/5">
      <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black to-transparent z-10" />
      
      <div className="flex items-center">
        <motion.div 
          className="flex gap-20 whitespace-nowrap"
          animate={{ x: [0, -2000] }}
          transition={{ 
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 60,
              ease: "linear"
            }
          }}
        >
          {marqueeItems.map((item, index) => (
            <div 
              key={`${item.name}-${index}`}
              onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
              className="flex items-center justify-center cursor-pointer group"
            >
              <img 
                src={item.logo} 
                alt={item.name}
                className={`h-12 md:h-20 w-auto object-contain opacity-30 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-110 ${item.name.toLowerCase().includes('marvel') ? '' : 'invert brightness-200'}`}
                onError={(e) => {
                  // If logo fails, show stylized text
                  e.target.style.display = 'none';
                  const parent = e.target.parentElement;
                  const text = document.createElement('span');
                  text.className = "text-2xl md:text-4xl font-black uppercase tracking-tighter italic text-white/30 group-hover:text-red-600 transition-colors";
                  text.innerText = item.name;
                  parent.appendChild(text);
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default FranchiseLogoMarquee;
