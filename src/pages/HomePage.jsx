import HeroSection from '../components/home/HeroSection.jsx';
import TrustBar from '../components/home/TrustBar.jsx';
import CategoryGrid from '../components/home/CategoryGrid.jsx';
import FeaturedProducts from '../components/home/FeaturedProducts.jsx';
import StoreCta from '../components/home/StoreCta.jsx';
import OrderTrackingCta from '../components/home/OrderTrackingCta.jsx';

export default function HomePage({ onAddToCart, navigate }) {
  return (
    <div className="home-page animate-fadeIn">
      <HeroSection navigate={navigate} />
      <TrustBar />
      <CategoryGrid navigate={navigate} />
      <FeaturedProducts onAddToCart={onAddToCart} navigate={navigate} />
      
      <section className="home-showcase-section" aria-label="Store Location and Tracking">
        <div className="container">
          <div className="home-showcase-grid">
            <StoreCta />
            <OrderTrackingCta navigate={navigate} />
          </div>
        </div>
      </section>
    </div>
  );
}
