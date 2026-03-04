import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";

const reviews = [
  { id: "r1", name: "Mabel", text: "CarlyFresh gives so fast. It is amazing.", rating: 5 },
  { id: "r2", name: "Uduak", text: "I like that the packaging maintains the freshness, and it comes all cleaned.", rating: 5 },
  { id: "r3", name: "Oluch", text: "The customer service explains well, that's what I find cool and my supply is now steady.", rating: 5 },
];

const ReviewCarousel = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="bg-secondary py-24 lg:py-32">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-accent">
            Testimonials
          </span>
          <h2 className="font-display text-4xl font-bold text-foreground md:text-5xl">
            What Our Customers Say
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative rounded-3xl bg-card p-8 shadow-md"
            >
              <Quote size={32} className="mb-4 text-primary/20" />
              <p className="mb-6 font-body text-sm leading-relaxed text-foreground/80">
                "{review.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                  {review.name[0]}
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">{review.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <Star key={idx} size={12} className="fill-accent text-accent" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewCarousel;
