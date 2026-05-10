import MainLayout from '../../layouts/MainLayout';
import ProductionHouseExplorer from '../../components/ProductionHouseExplorer';
import { useSEO } from '../../hooks/useSEO';

const ProductionHouses = () => {
  useSEO({
    title: 'Production Houses',
    description: 'Browse Hollywood, Bollywood and animation production houses, then jump straight into the movies they produce.',
    url: '/production-houses',
  });

  return (
    <MainLayout>
      <ProductionHouseExplorer />
    </MainLayout>
  );
};

export default ProductionHouses;
