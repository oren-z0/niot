import Header from "components/Header";
import Hero from "components/Hero";
import PayToZap from "components/PayToZap";
import Footer from "components/Footer";

export default function Page() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      <Header />
      <main>
        <Hero />
        <PayToZap />
      </main>
      <Footer />
    </div>
  );
}
