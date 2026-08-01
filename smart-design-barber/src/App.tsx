import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Heritage } from "./components/Heritage";
import { Services } from "./components/Services";
import { Amenities } from "./components/Amenities";
import { Experience } from "./components/Experience";
import { Gallery } from "./components/Gallery";
import { Testimonials } from "./components/Testimonials";
import { Location } from "./components/Location";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div id="top">
      <Nav />
      <main>
        <Hero />
        <Heritage />
        <Services />
        <Amenities />
        <Experience />
        <Gallery />
        <Testimonials />
        <Location />
      </main>
      <Footer />
    </div>
  );
}
