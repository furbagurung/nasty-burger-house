import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & Support | Nasty Burger House",
  description:
    "Get help with Nasty Burger House pickup orders, Drip Points, menu questions and feedback.",
};

const faqs = [
  {
    question: "How do I place a pickup order?",
    answer:
      "Open the menu, choose your items, customise them, add them to your cart and continue to checkout. Pickup is the available ordering option on the website right now.",
  },
  {
    question: "Can I change an item after adding it to my cart?",
    answer:
      "Yes. Open your cart and choose Edit on the item you want to change. You can update available extras, removals, drink choices and quantity before checkout.",
  },
  {
    question: "How do Drip Points work?",
    answer:
      "Drip Points is the Nasty Burger House rewards program. Join through the Drip Points option on the website to access available rewards and member offers.",
  },
  {
    question: "Where can I ask about ingredients or allergens?",
    answer:
      "Please contact Nasty Burger House before ordering if you have an allergy, intolerance or ingredient question. Menu descriptions are a guide and should not be treated as medical or allergen advice.",
  },
  {
    question: "How can I share feedback about my order?",
    answer:
      "Send us a message through one of our official social channels and include enough order detail for us to understand what happened.",
  },
];

export default function HelpSupportPage() {
  return (
    <main className="help-support-page">
      <section className="help-support-hero">
        <p className="help-support-eyebrow">Help &amp; Support</p>
        <h1>How can we help?</h1>
        <p>
          Need help with an order, Drip Points, menu information or feedback?
          Start here and we&apos;ll point you in the right direction.
        </p>
      </section>

      <section className="help-support-section" aria-labelledby="get-in-touch-title">
        <div className="help-support-section__heading">
          <p className="help-support-eyebrow">Get in touch</p>
          <h2 id="get-in-touch-title">Talk to Nasty Burger House</h2>
          <p>
            For the fastest help, message us through an official Nasty Burger
            House social channel. For order issues, include your name, order
            time and a short description of the problem.
          </p>
        </div>

        <div className="help-support-contact-grid">
          <a
            href="https://www.instagram.com/nastyburgerhouse/"
            target="_blank"
            rel="noreferrer"
          >
            <span>Instagram</span>
            <strong>@nastyburgerhouse</strong>
            <small>Message us →</small>
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61590139712227"
            target="_blank"
            rel="noreferrer"
          >
            <span>Facebook</span>
            <strong>Nasty Burger House</strong>
            <small>Open Facebook →</small>
          </a>
          <a
            href="https://www.tiktok.com/@nastyburgerhouse"
            target="_blank"
            rel="noreferrer"
          >
            <span>TikTok</span>
            <strong>@nastyburgerhouse</strong>
            <small>Open TikTok →</small>
          </a>
        </div>
      </section>

      <section className="help-support-section help-support-topics" aria-labelledby="support-topics-title">
        <div className="help-support-section__heading">
          <p className="help-support-eyebrow">Quick help</p>
          <h2 id="support-topics-title">What do you need help with?</h2>
        </div>

        <div className="help-support-topic-grid">
          <article>
            <span>01</span>
            <h3>Pickup orders</h3>
            <p>Ordering, cart changes, checkout and collection questions.</p>
            <Link href="/menu/burgers">Browse the menu</Link>
          </article>
          <article>
            <span>02</span>
            <h3>Drip Points</h3>
            <p>Help with joining, rewards and your loyalty experience.</p>
            <Link href="/?loyalty=1">Open Drip Points</Link>
          </article>
          <article>
            <span>03</span>
            <h3>Menu &amp; allergens</h3>
            <p>Ingredient, dietary and menu information before you order.</p>
            <Link href="/menu/burgers">View menu</Link>
          </article>
          <article>
            <span>04</span>
            <h3>Feedback</h3>
            <p>Tell us about your Nasty Burger House experience.</p>
            <a
              href="https://www.instagram.com/nastyburgerhouse/"
              target="_blank"
              rel="noreferrer"
            >
              Send feedback
            </a>
          </article>
        </div>
      </section>

      <section className="help-support-section help-support-faq" aria-labelledby="faq-title">
        <div className="help-support-section__heading">
          <p className="help-support-eyebrow">Got questions?</p>
          <h2 id="faq-title">Frequently asked questions</h2>
        </div>

        <div className="help-support-faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
