import { useState } from 'react';

export default function Contacts() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // В прототипе — без серверной формы: открываем почтовый клиент с готовым письмом.
    const subject = encodeURIComponent(`Aethra: обращение от ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}, ${form.email}`);
    window.location.href = `mailto:hello@aethra.shop?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-[11px] uppercase tracking-[0.4em] text-sand">Контакты</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Напишите нам</h1>

      <div className="mt-12 grid gap-14 md:grid-cols-2">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Имя</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Сообщение</label>
            <textarea className="input min-h-32" required value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
          </div>
          <button type="submit" className="btn-primary">Отправить</button>
          {sent && <p className="text-xs text-sand">Почтовый клиент открыт — письмо уйдёт на hello@aethra.shop.</p>}
        </form>

        <address className="space-y-8 text-sm not-italic leading-relaxed text-neutral-600">
          <div>
            <p className="label">Шоурум</p>
            <p>Москва, Кузнецкий мост 12<br />пн–сб, 11:00–20:00</p>
          </div>
          <div>
            <p className="label">Связь</p>
            <p>hello@aethra.shop<br />+7 495 000-00-00</p>
          </div>
          <div>
            <p className="label">Возвраты и доставка</p>
            <p>По вопросам заказов пишите в личный кабинет — продавец отвечает в переписке заказа.</p>
          </div>
        </address>
      </div>
    </div>
  );
}
