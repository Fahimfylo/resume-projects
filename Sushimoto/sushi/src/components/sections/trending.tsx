const trendingSushis = [
  "Make Sushi", "Nigiri Sushi", "Oshizushi",
  "Temaki Sushi", "Uramaki Sushi", "Inari Sushi",
];

const trendingDrinks = [
  "Oruncha", "Ofukucha", "Sakura Tea",
  "Kombu-cha", "Aojiru", "Mugicha",
];

export function Trending() {
  return (
    <section className="trending" id="food">
      <section className="trending-sushi">
        <div className="trending__content" data-aos="fade-right">
          <p className="sushi__subtitle">What&apos;s Trending / トレンド</p>

          <h3 className="sushi__title">Japanese Sushi</h3>

          <p className="sushi__description">Feel the taste of the most delicious Sushi here.</p>

          <ul className="trending__list flex-between">
            {trendingSushis.map((item) => (
              <li key={item}>
                <div className="trending__icon flex-center">
                  <img src="/assets/check.svg" alt="check" />
                </div>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="trending__image flex-center">
          <img src="/assets/sushi-5.png" alt="sushi-5" data-aos="fade-left" />

          <div className="trending__arrow trending__arrow-left">
            <img src="/assets/arrow-vertical.svg" alt="arrow vertical" />
          </div>

          <div className="trending__arrow trending__arrow-bottom">
            <img src="/assets/arrow-horizontal.svg" alt="arrow horizontal" />
          </div>
        </div>
      </section>

      <div className="trending__discover" data-aos="zoom-in">
        <p>Discover</p>
      </div>

      <section className="trending-drinks">
        <div className="trending__image flex-center">
          <img src="/assets/sushi-4.png" alt="sushi-4" data-aos="fade-right" />

          <div className="trending__arrow trending__arrow-top">
            <img src="/assets/arrow-horizontal.svg" alt="arrow horizontal" />
          </div>

          <div className="trending__arrow trending__arrow-right">
            <img src="/assets/arrow-vertical.svg" alt="arrow vertical" />
          </div>
        </div>

        <div className="trending__content" data-aos="fade-left">
          <p className="sushi__subtitle">What&apos;s Trending / トレンド</p>

          <h3 className="sushi__title">Japanese Drinks</h3>

          <p className="sushi__description">Feel the taste of the most delicious Japense drinks here.</p>

          <ul className="trending__list flex-between">
            {trendingDrinks.map((item) => (
              <li key={item}>
                <div className="trending__icon flex-center">
                  <img src="/assets/check.svg" alt="check" />
                </div>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}
