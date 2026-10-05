/**
 * Генерация минималистичного SVG-плейсхолдера товара (data-URI),
 * чтобы прототип не зависел от внешних картинок.
 */
function svgPlaceholder(bg, fg, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
  <rect width="600" height="750" fill="${bg}"/>
  <g stroke="${fg}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M210 240 L260 210 Q300 230 340 210 L390 240 L420 300 L380 320 L380 520 L220 520 L220 320 L180 300 Z"/>
  </g>
  <text x="300" y="640" font-family="Helvetica,Arial,sans-serif" font-size="34" letter-spacing="6"
        fill="${fg}" text-anchor="middle">${label}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export const CATALOG = [
  {
    name: 'Футболка Aethra Core',
    description: 'Базовая футболка из плотного органического хлопка. Свободный крой, без логотипов.',
    price: 2490, category: 'tshirts', sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['black', 'white', 'gray', 'blue'], stock: 40,
    img: ['#2b2b2b', '#e8e3da', 'TSHIRT'],
  },
  {
    name: 'Футболка Run Lightweight',
    description: 'Ультралёгкое беговое полотно с вентиляционными зонами.',
    price: 2990, category: 'tshirts', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['white', 'red', 'blue'], stock: 35,
    img: ['#f2efe9', '#3c3c3c', 'RUN'],
  },
  {
    name: 'Шорты Train 7"',
    description: 'Тренировочные шорты с длиной шага 7 дюймов и внутренними шортами.',
    price: 3290, category: 'shorts', sizes: ['S', 'M', 'L', 'XL'], colors: ['black', 'gray', 'red'], stock: 25,
    img: ['#3a3f4a', '#d9d2c4', 'SHORTS'],
  },
  {
    name: 'Шорты Trail Stretch',
    description: 'Эластичная ткань для бега по пересечённой местности, водоотталкивающая пропитка.',
    price: 3890, category: 'shorts', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['gray', 'blue', 'black'], stock: 18,
    img: ['#cfc6b8', '#33322e', 'TRAIL'],
  },
  {
    name: 'Леггинсы Sculpt High',
    description: 'Высокая посадка, матовая компрессия 4-way stretch. Карман на поясе.',
    price: 4190, category: 'leggings', sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['black', 'blue', 'red', 'gray'], stock: 30,
    img: ['#26262a', '#e8e3da', 'SCULPT'],
  },
  {
    name: 'Леггинсы Soft Move',
    description: 'Мягкий трикотаж для йоги и пилатеса. Не просвечивают.',
    price: 3690, category: 'leggings', sizes: ['XS', 'S', 'M', 'L'], colors: ['white', 'gray', 'black'], stock: 22,
    img: ['#e9e4db', '#40403c', 'SOFT'],
  },
  {
    name: 'Куртка Wind Shell',
    description: 'Лёгкая ветровка с упаковкой в собственный карман. WR-мембрана 10K.',
    price: 7490, category: 'jackets', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['black', 'blue', 'red'], stock: 12,
    img: ['#33465c', '#e6e1d7', 'SHELL'],
  },
  {
    name: 'Худи Aethra Heavy',
    description: 'Худи из футера 400 г/м². Минималистичный крой, без принтов.',
    price: 5990, category: 'jackets', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['gray', 'black', 'white'], stock: 16,
    img: ['#8d8b86', '#26251f', 'HOODIE'],
  },
  {
    name: 'Носки Grip Sock (3 пары)',
    description: 'Носки с антискользящей зоной стопы и поддержкой свода.',
    price: 1190, category: 'accessories', sizes: ['S', 'M', 'L'], colors: ['black', 'white', 'gray', 'red'], stock: 60,
    img: ['#ded8cc', '#37372f', 'SOCKS'],
  },
  {
    name: 'Сумка Duffel 30L',
    description: 'Спортивная сумка из переработанного нейлона, отделение для обуви.',
    price: 4590, category: 'accessories', sizes: [], colors: ['black', 'gray'], stock: 14,
    img: ['#2e2c28', '#cbbfa8', 'DUFFEL'],
  },
  {
    name: 'Шапка Beanie Knit',
    description: 'Двойная вязка из мериноса. Унисекс.',
    price: 1490, category: 'accessories', sizes: [], colors: ['black', 'blue', 'red', 'white'], stock: 45,
    img: ['#b9b3a7', '#2f2e2a', 'BEANIE'],
  },
];

export function buildProducts() {
  return CATALOG.map(({ img, ...p }) => ({
    ...p,
    images: [svgPlaceholder(img[0], img[1], img[2])],
  }));
}
