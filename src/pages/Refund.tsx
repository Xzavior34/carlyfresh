import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Refund = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-6 pt-32 pb-20 lg:px-12">
        <h1 className="mb-8 font-display text-4xl font-bold text-foreground md:text-5xl">Refund Policy</h1>
        <div className="space-y-6 font-body text-base leading-relaxed text-muted-foreground">
          <p>
            We aim to ensure satisfaction and fair resolution for buyers, farmers, and sellers on our
            Fresh Food Marketplace Platform.
          </p>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Eligible Refund Situations</h2>
            <p>Refunds, credits, or replacements may be considered for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Missing items</li>
              <li>Incorrect items delivered</li>
              <li>Damaged goods on arrival</li>
              <li>Spoiled or clearly unusable products at delivery</li>
              <li>Duplicate charges</li>
              <li>Orders cancelled after payment without fulfillment</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Fresh Product Variation</h2>
            <p>
              Fresh produce naturally varies in shape, colour, size, or ripeness.
              Minor natural variation is not normally grounds for refund.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Time Limits for Claims</h2>
            <p>
              Because products are perishable, claims should be submitted promptly,
              preferably within 24 hours of delivery.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">How to Request a Refund</h2>
            <p>Provide:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Order number</li>
              <li>Description of issue</li>
              <li>Clear photos where relevant</li>
              <li>Preferred resolution (refund, replacement, store credit)</li>
            </ul>
            <p className="mt-3">Claims can be submitted through customer support channels on the Platform.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Review Process</h2>
            <p>
              We may review order records, delivery confirmation, seller information, photos,
              and prior claim history before deciding.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Possible Outcomes</h2>
            <p>Approved claims may result in:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Full refund</li>
              <li>Partial refund</li>
              <li>Replacement item</li>
              <li>Store credit</li>
              <li>Delivery fee refund</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Non-Refundable Situations</h2>
            <p>Refunds may be denied for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Late claims after reasonable inspection period</li>
              <li>Incorrect address provided by buyer</li>
              <li>Failed delivery due to buyer absence where applicable</li>
              <li>Improper storage after delivery</li>
              <li>Dissatisfaction based only on normal natural variation</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Processing Time</h2>
            <p>
              Approved refunds are typically processed within 5–10 business days,
              depending on payment provider timelines.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Fraud Prevention</h2>
            <p>
              Repeated abusive, false, or manipulated claims may lead to denied refunds or account suspension.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Final Note</h2>
            <p>
              We aim to balance fairness to buyers while protecting honest farmers and sellers.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Refund;
