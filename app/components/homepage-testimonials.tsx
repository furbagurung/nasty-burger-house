import Link from "next/link";

const testimonials = [
  {
    quote:
      "The burger is stacked, juicy and properly messy — exactly the kind of feed you order when you are seriously hungry.",
    name: "Sample customer A",
    initial: "A",
    detail: "Burger order preview",
    avatarTone: "red",
  },
  {
    quote:
      "The Beast Box is made for sharing. Burgers, fries and sides all in one hit without overthinking the order.",
    name: "Sample customer J",
    initial: "J",
    detail: "Beast Box preview",
    avatarTone: "gold",
  },
  {
    quote:
      "Quick pickup, big portions and the burger still tastes fresh off the grill when you open the bag.",
    name: "Sample customer S",
    initial: "S",
    detail: "Pickup order preview",
    avatarTone: "dark",
  },
];

export default function HomepageTestimonials() {
  return (
    <section className="home-testimonials" aria-labelledby="home-testimonials-title">
      <div className="home-testimonials__heading">
        <div>
          <p className="home-testimonials__eyebrow">The Nasty crowd</p>
          <h2 id="home-testimonials-title">What people are saying.</h2>
          <p>
            Review-style previews for the homepage. Published customer reviews can replace these sample cards as they come in.
          </p>
        </div>
        <Link className="home-testimonials__cta" href="/reviews">
          Leave a verified review
        </Link>
      </div>

      <div className="home-testimonials__grid" aria-label="Sample testimonial cards">
        {testimonials.map((testimonial) => (
          <article className="home-testimonial-card" key={testimonial.name}>
            <div className="home-testimonial-card__profile">
              <span
                className={`home-testimonial-card__avatar home-testimonial-card__avatar--${testimonial.avatarTone}`}
                aria-hidden="true"
              >
                {testimonial.initial}
              </span>
              <div className="home-testimonial-card__profile-copy">
                <strong>{testimonial.name}</strong>
                <span>{testimonial.detail}</span>
              </div>
              <span className="home-testimonial-card__sample">Sample</span>
            </div>

            <div className="home-testimonial-card__rating-row">
              <strong>5.0</strong>
              <span className="home-testimonial-card__stars" aria-label="Five star sample rating">
                ★★★★★
              </span>
              <span className="home-testimonial-card__review-source">Review preview</span>
            </div>

            <blockquote>“{testimonial.quote}”</blockquote>

            <div className="home-testimonial-card__meta">
              <span>Sample content for layout preview</span>
              <span aria-hidden="true">·</span>
              <span>Not a published Google review</span>
            </div>
          </article>
        ))}
      </div>

    </section>
  );
}
