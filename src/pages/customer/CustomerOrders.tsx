import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BuyerDashboard from "@/pages/dashboard/BuyerDashboard";

export default function CustomerOrders() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-24">
        <div className="container mx-auto px-6 lg:px-12">
          <BuyerDashboard />
        </div>
      </section>
      <Footer />
    </div>
  );
}
