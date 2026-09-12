"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  rating: number;
  review: string;
  created_at: string;
};

export default function HomePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadReviews() {
    const res = await fetch("/api/reviews", {
      cache: "no-store",
    });

    if (!res.ok) {
      return;
    }

    const data = await res.json();
    setReviews(data.reviews || []);
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          rating,
          review,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Recenzi se nepodařilo odeslat.");
      }

      setName("");
      setEmail("");
      setRating(5);
      setReview("");

      setMessage(
        "Děkujeme. Recenze byla odeslána a zveřejní se až po schválení Ateliérem Ivet."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Recenzi se nepodařilo odeslat."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="reviewsSection">
        <div className="header">
          <div className="eyebrow">ATELIÉR IVET</div>

          <h1>Recenze našich zákaznic</h1>

          <div className="goldLine" />

          <p>
            Vaše spokojenost je pro nás tou nejkrásnější odměnou.
            Podělte se s námi o svou zkušenost.
          </p>
        </div>

        <div className="formCard">
          <div className="formHeader">
            <div className="eyebrow">VAŠE ZKUŠENOST</div>

            <h2>Napište nám recenzi</h2>

            <div className="goldLine" />

            <p>
              Vaše recenze bude zveřejněna až po schválení Ateliérem Ivet.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Vaše hodnocení *</label>

              <div className="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= rating ? "star active" : "star"}
                    onClick={() => setRating(star)}
                    aria-label={`${star} hvězdiček`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="name">Vaše jméno *</label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Např. Jana K."
                required
              />
            </div>

            <div className="field">
              <label htmlFor="email">E-mail *</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                required
              />

              <small>E-mail nebude veřejně zobrazen.</small>
            </div>

            <div className="field">
              <label htmlFor="review">Vaše recenze *</label>

              <textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={6}
                placeholder="Napište nám, jak jste byla spokojena..."
                required
              />
            </div>

            <label className="checkbox">
              <input type="checkbox" required />

              <span>
                Souhlasím se zveřejněním svého jména a textu recenze na webových
                stránkách Ateliéru Ivet.
              </span>
            </label>

            <button
              type="submit"
              className="submitButton"
              disabled={loading}
            >
              {loading ? "ODESÍLÁM..." : "ODESLAT RECENZI"}
            </button>

            <div className="approvalInfo">
              ★ Recenze nebude zveřejněna automaticky. Nejprve ji zkontroluje
              Ateliér Ivet.
            </div>

            {message && <div className="message">{message}</div>}
          </form>
        </div>

        <div className="approvedHeader">
          <div className="eyebrow">ZKUŠENOSTI ZÁKAZNIC</div>

          <h2>Co o nás říkají</h2>

          <div className="goldLine" />
        </div>

        <div className="reviewsList">
          {reviews.length === 0 ? (
            <div className="noReviews">
              Zatím zde nejsou žádné schválené recenze.
            </div>
          ) : (
            reviews.map((item) => (
              <article className="reviewCard" key={item.id}>
                <div className="stars">
                  {"★".repeat(item.rating)}
                  {"☆".repeat(5 - item.rating)}
                </div>

                <p>„{item.review}“</p>

                <div className="reviewName">— {item.name}</div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
