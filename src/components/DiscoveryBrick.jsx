import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const DiscoveryBrick = ({ isBollywood = false }) => {
  const navigate = useNavigate();
  const genreSections = useSelector((state) => state.categories.genreSections);
  const status = useSelector((state) => state.categories.status);

  const genres = genreSections.filter((s) => !s.isStudio);

  if (status === 'loading') return null;
  if (!genres.length) return null;

  return (
    <div className="w-full py-10 md:py-14 bg-black border-t border-white/5 overflow-hidden">
      <div className="w-full px-4 md:px-16">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 md:gap-x-8 md:gap-y-5 text-center">
          {genres.map((genre, index) => (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              whileHover={{
                scale: 1.1,
                filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.3))',
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.03 }}
              onClick={() => {
                navigate(
                  `/movies?genreId=${genre.id}&genreName=${genre.name}${isBollywood ? '&lang=hi&pageType=bollywood' : ''}`
                );
              }}
              className="cursor-pointer transition-all duration-500 inline-block px-2 py-1 md:px-3 md:py-1.5"
            >
              <span
                className="
                  text-xs md:text-lg font-bold tracking-wider uppercase
                  text-white/60 hover:text-white
                  border border-white/10 hover:border-red-500/50
                  bg-white/[0.03] hover:bg-red-600/10
                  px-3 py-1.5 rounded-md
                  transition-all duration-300
                "
              >
                {genre.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryBrick;
