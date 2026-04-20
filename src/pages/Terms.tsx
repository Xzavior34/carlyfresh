import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-6 pt-32 pb-20 lg:px-12">
        <h1 className="mb-8 font-display text-4xl font-bold text-foreground md:text-5xl">Terms and Conditions</h1>
        <div className="space-y-6 font-body text-base leading-relaxed text-muted-foreground">
          <p>
            These Terms and Conditions ("Terms") govern use of CarlyFresh Platform ("Platform").
            By using the Platform, you agree to these Terms.
          </p>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Platform Nature</h2>
            <p>
              The Platform connects buyers with farmers, sellers, suppliers, and logistics partners.
              We may facilitate listings, payments, communications, and deliveries.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">User Accounts</h2>
            <p>
              Users must provide accurate information and keep login credentials secure.
              You are responsible for activity under your account.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Orders & Availability</h2>
            <p>
              All orders are subject to product availability, seller acceptance, weather conditions,
              logistics constraints, and operational limitations. Items may occasionally be substituted,
              adjusted, delayed, or cancelled.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Pricing</h2>
            <p>
              Prices displayed may change without notice due to seasonality, supply conditions, or seller updates.
              Final pricing is shown at checkout.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Product Quality</h2>
            <p>
              Fresh food products naturally vary in size, colour, ripeness, and appearance.
              Reasonable variation does not automatically mean defect.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Seller Responsibilities</h2>
            <p>
              Sellers and farmers must provide accurate listings, lawful products, fair weights, and reasonable quality standards.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Buyer Responsibilities</h2>
            <p>
              Buyers must provide correct delivery details, be available to receive deliveries where required,
              inspect goods promptly, and store products properly after delivery.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Delivery</h2>
            <p>
              Estimated delivery times are not guaranteed. Delays may result from traffic, weather,
              supply shortages, or unforeseen events.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Payments</h2>
            <p>
              Payments may be processed through approved third-party providers.
              Failed or reversed payments may result in order cancellation or account restrictions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Prohibited Use</h2>
            <p>Users may not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Commit fraud or abuse promotions</li>
              <li>Misuse the Platform</li>
              <li>Post false information</li>
              <li>Interfere with systems or security</li>
              <li>Resell unlawfully sourced goods</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Liability Limitation</h2>
            <p>
              To the extent permitted by law, the Platform is not liable for indirect losses, lost profits,
              or delays caused by third-party sellers or logistics providers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Suspension & Termination</h2>
            <p>
              We may suspend accounts for fraud, abuse, repeated disputes, policy breaches, or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Changes</h2>
            <p>
              We may update these Terms at any time. Continued use means acceptance of revised Terms.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
