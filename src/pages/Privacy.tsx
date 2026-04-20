import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-6 pt-32 pb-20 lg:px-12">
        <h1 className="mb-8 font-display text-4xl font-bold text-foreground md:text-5xl">Privacy Policy</h1>
        <div className="space-y-6 font-body text-base leading-relaxed text-muted-foreground">
          <p>
            Welcome to CarlyFresh. We respect your privacy and are committed to protecting your personal data.
            This Privacy Policy explains how we collect, use, store, and share information when you use our website,
            mobile services, marketplace tools, and related services.
          </p>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Information We Collect</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Name, email address, phone number</li>
              <li>Delivery and billing address</li>
              <li>Account login details</li>
              <li>Payment transaction details (processed securely through third-party providers)</li>
              <li>Order history and preferences</li>
              <li>Device, browser, IP address, cookies, and usage analytics</li>
              <li>Communications with customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">How We Use Your Information</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Create and manage your account</li>
              <li>Process orders, payments, and deliveries</li>
              <li>Connect buyers with farmers, sellers, and logistics partners</li>
              <li>Provide customer support</li>
              <li>Improve platform performance and user experience</li>
              <li>Send service notifications, promotions, and updates</li>
              <li>Detect fraud, misuse, or security risks</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Sharing of Information</h2>
            <p>We may share relevant data with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Sellers and farmers to fulfill your order</li>
              <li>Delivery and logistics partners</li>
              <li>Payment processors</li>
              <li>Technology service providers</li>
              <li>Authorities where legally required</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Cookies & Analytics</h2>
            <p>
              We may use cookies and analytics tools to improve browsing experience, remember preferences,
              measure traffic, and personalize content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Data Security</h2>
            <p>
              We use commercially reasonable security measures such as encrypted payment processing,
              access controls, and secure hosting.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Your Rights</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account data</li>
              <li>Withdraw marketing consent</li>
              <li>Request a copy of stored data</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Retention</h2>
            <p>
              We retain information as necessary for business, tax, fraud prevention, dispute resolution,
              and legal purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Third-Party Links</h2>
            <p>
              Our Platform may contain links to external websites. We are not responsible for their privacy practices.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Updates</h2>
            <p>
              We may revise this policy from time to time. Continued use of the Platform means acceptance of updates.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-semibold text-foreground">Contact</h2>
            <p>
              For privacy requests or questions, please contact our support team through the Platform contact page.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
