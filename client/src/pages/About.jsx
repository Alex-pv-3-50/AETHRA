export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-[11px] uppercase tracking-[0.4em] text-sand">О бренде</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Aethra</h1>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-neutral-700">
        <section>
          <h2 className="label !text-sand">Философия</h2>
          <p>
            Aethra — спортивная одежда для тех, кто тренируется ради тишины в голове, а не ради
            логотипа на груди. Мы убираем всё лишнее: кричащую графику, ненужные швы, сезонный шум.
            Остаются крой, ткань и свет. Название происходит от греческой богини ясного неба —
            состояние, к которому мы стремимся в движении.
          </p>
        </section>

        <section>
          <h2 className="label !text-sand">Материалы</h2>
          <p>
            Органический хлопок GOTS, переработанный полиэстер из флотского океанического пластика
            и двухсторонний интерлок с вентиляционными зонами. Каждая партия ткани проходит тест на
            усадку и истирание; окрашивание — реактивное, с замкнутым циклом воды.
          </p>
        </section>

        <section>
          <h2 className="label !text-sand">Производство</h2>
          <p>
            Малые партии на сертифицированных фабриках в Португалии и Сербии. Мы шьём заранее
            известный объём — без перепроизводства и складов-«могильников». Упаковка — переработанный
            картон, ноль полиэтилена. Остатки ткани идут в аксессуары линейки Aethra Pieces.
          </p>
        </section>

        <blockquote className="border-l-2 border-sand pl-6 text-lg italic text-graphite">
          «Художник — это не тот, кто рисует, а тот, кто убирает лишнее.»
          <footer className="mt-2 text-xs not-italic uppercase tracking-widest2 text-neutral-500">
            принцип студии Aethra
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
