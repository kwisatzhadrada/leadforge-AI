import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { About } from "./components/About";
import { Services } from "./components/Services";
import { WhyChooseUs } from "./components/WhyChooseUs";
import { Atmosphere } from "./components/Atmosphere";
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
        <About />
        <Services />
        <WhyChooseUs />
        <Atmosphere />
        <Gallery />
        <Testimonials />
        <Location />
      </main>
      <Footer />
    </div>
  );
}
