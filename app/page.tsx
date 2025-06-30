import Header from "components/Header";
import Hero from "components/Hero";
import PayToZap from "components/PayToZap";
import Footer from "components/Footer";

const starsCount = 40;
const animationDuration = 8;


const stars = (
  <div className="hidden dark:block">
    {
      Array.from({ length: starsCount }).map((_, index) => (
        <div
          key={index}
          className="traveling-star"
          style={{
            animationDuration: `${animationDuration * (0.5 + Math.random() * 1)}s`,
            animationDelay: `${Math.random() * 10 - 5}s`,
            animationName: `space-travel-${index % 3 + 1}`,
            "--travel-x": `${Math.round(Math.random() * 100 - 50)}vw`,
            "--travel-y": `${Math.round(Math.random() * 100 - 50)}vh`,
          } as React.CSSProperties}
        ></div>
      ))
    }
  </div>
);

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main className="mb-16 flex-grow-1 dark:space-travel-container">
        {stars}
        <div className="space-content">
          <Hero />
          <PayToZap />
        </div>
      </main>
      <Footer />
    </div>
  );
}
