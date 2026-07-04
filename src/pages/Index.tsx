import { useState } from 'react';
import Icon from '@/components/ui/icon';

type Tab = 'feed' | 'create' | 'favorites' | 'chats' | 'profile';

interface Listing {
  id: number;
  title: string;
  price: string;
  category: string;
  location: string;
  time: string;
  image: string;
  fav: boolean;
}

const CATEGORIES = ['Все', 'Транспорт', 'Недвижимость', 'Электроника', 'Работа', 'Услуги', 'Хобби'];

const LISTINGS: Listing[] = [
  { id: 1, title: 'Велосипед шоссейный, отличное состояние', price: '18 500 ₽', category: 'Транспорт', location: 'Москва, Хамовники', time: '5 мин назад', image: 'https://cdn.poehali.dev/projects/a4ca0aed-5427-488c-88f8-60e12a6d90ef/files/39a6cdfb-3244-448c-95b5-d54e43263631.jpg', fav: false },
  { id: 2, title: 'Уютная студия в аренду, всё включено', price: '45 000 ₽', category: 'Недвижимость', location: 'Санкт-Петербург', time: '20 мин назад', image: 'https://cdn.poehali.dev/projects/a4ca0aed-5427-488c-88f8-60e12a6d90ef/files/5bdc60f2-1931-4d00-b67a-a34827563390.jpg', fav: true },
];

const CHATS = [
  { id: 1, name: 'Алексей П.', text: 'Здравствуйте, велосипед ещё продаётся?', time: '12:40', unread: 2, letter: 'А' },
  { id: 2, name: 'Мария К.', text: 'Можно посмотреть квартиру завтра?', time: '11:05', unread: 0, letter: 'М' },
  { id: 3, name: 'Игорь С.', text: 'Спасибо, договорились!', time: 'Вчера', unread: 0, letter: 'И' },
];

const NOTIFICATIONS = [
  { icon: 'MessageCircle', color: 'text-primary', text: 'Новый отклик на «Велосипед шоссейный»', time: '3 мин назад' },
  { icon: 'Heart', color: 'text-rose-500', text: 'Ваше объявление добавили в избранное', time: '1 ч назад' },
  { icon: 'Bell', color: 'text-amber-500', text: '5 новых объявлений в «Транспорт»', time: '2 ч назад' },
];

const Index = () => {
  const [tab, setTab] = useState<Tab>('feed');
  const [activeCat, setActiveCat] = useState('Все');
  const [favs, setFavs] = useState<number[]>([2]);

  const toggleFav = (id: number) =>
    setFavs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const filtered = LISTINGS.filter(
    (l) => activeCat === 'Все' || l.category === activeCat
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex justify-center">
      <div className="w-full max-w-md bg-background relative flex flex-col min-h-screen shadow-xl">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-primary text-primary-foreground px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Icon name="Send" size={18} />
              </div>
              <h1 className="text-lg font-700 tracking-tight">Барахолка</h1>
            </div>
            <button className="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Icon name="Bell" size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-400" />
            </button>
          </div>
        </header>

        <main className="flex-1 pb-24">
          {tab === 'feed' && (
            <FeedView
              activeCat={activeCat}
              setActiveCat={setActiveCat}
              listings={filtered}
              favs={favs}
              toggleFav={toggleFav}
            />
          )}
          {tab === 'create' && <CreateView />}
          {tab === 'favorites' && (
            <FavoritesView
              listings={LISTINGS.filter((l) => favs.includes(l.id))}
              favs={favs}
              toggleFav={toggleFav}
            />
          )}
          {tab === 'chats' && <ChatsView />}
          {tab === 'profile' && <ProfileView />}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-2 py-2 flex items-center justify-around z-20">
          {([
            { id: 'feed', icon: 'Search', label: 'Лента' },
            { id: 'favorites', icon: 'Heart', label: 'Избранное' },
            { id: 'create', icon: 'Plus', label: 'Подать' },
            { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
            { id: 'profile', icon: 'User', label: 'Профиль' },
          ] as const).map((item) => {
            const active = tab === item.id;
            const isCreate = item.id === 'create';
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex flex-col items-center gap-0.5 w-16 group"
              >
                {isCreate ? (
                  <div className="w-11 h-11 -mt-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                    <Icon name="Plus" size={24} />
                  </div>
                ) : (
                  <Icon
                    name={item.icon}
                    size={22}
                    className={active ? 'text-primary' : 'text-muted-foreground'}
                  />
                )}
                <span
                  className={`text-[10px] ${active ? 'text-primary font-600' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

interface FeedProps {
  activeCat: string;
  setActiveCat: (c: string) => void;
  listings: Listing[];
  favs: number[];
  toggleFav: (id: number) => void;
}

const FeedView = ({ activeCat, setActiveCat, listings, favs, toggleFav }: FeedProps) => (
  <div className="animate-fade-in">
    <div className="px-4 pt-4">
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3">
        <Icon name="Search" size={18} className="text-muted-foreground" />
        <input
          placeholder="Поиск объявлений..."
          className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Icon name="SlidersHorizontal" size={18} className="text-primary" />
      </div>
    </div>

    <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => setActiveCat(c)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm transition-colors ${
            activeCat === c
              ? 'bg-primary text-primary-foreground font-500'
              : 'bg-card border border-border text-muted-foreground'
          }`}
        >
          {c}
        </button>
      ))}
    </div>

    <div className="px-4 space-y-3">
      {listings.map((l: Listing) => (
        <ListingCard key={l.id} l={l} fav={favs.includes(l.id)} toggleFav={toggleFav} />
      ))}
      {listings.length === 0 && (
        <div className="text-center text-muted-foreground py-16 text-sm">
          Нет объявлений в этой категории
        </div>
      )}
    </div>
  </div>
);

const ListingCard = ({ l, fav, toggleFav }: { l: Listing; fav: boolean; toggleFav: (id: number) => void }) => (
  <div className="bg-card rounded-2xl overflow-hidden border border-border animate-scale-in">
    <div className="relative">
      <img src={l.image} alt={l.title} className="w-full h-44 object-cover" />
      <button
        onClick={() => toggleFav(l.id)}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
      >
        <Icon
          name="Heart"
          size={18}
          className={fav ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'}
        />
      </button>
      <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
        {l.category}
      </span>
    </div>
    <div className="p-3.5">
      <div className="text-lg font-700 text-foreground">{l.price}</div>
      <div className="text-sm text-foreground mt-0.5 line-clamp-1">{l.title}</div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <Icon name="MapPin" size={13} />
        <span className="truncate">{l.location}</span>
        <span>·</span>
        <span className="shrink-0">{l.time}</span>
      </div>
    </div>
  </div>
);

const CreateView = () => (
  <div className="px-4 py-4 animate-fade-in space-y-4">
    <h2 className="text-xl font-700">Новое объявление</h2>

    <div className="grid grid-cols-3 gap-2">
      <button className="aspect-square rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
        <Icon name="Camera" size={22} />
        <span className="text-[10px]">Фото</span>
      </button>
      <div className="aspect-square rounded-2xl bg-muted" />
      <div className="aspect-square rounded-2xl bg-muted" />
    </div>

    <Field label="Название">
      <input className="field-input" placeholder="Например, iPhone 14 Pro" />
    </Field>
    <Field label="Категория">
      <div className="field-input flex items-center justify-between text-muted-foreground">
        Выберите категорию
        <Icon name="ChevronDown" size={18} />
      </div>
    </Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Цена, ₽">
        <input className="field-input" placeholder="0" />
      </Field>
      <Field label="Город">
        <input className="field-input" placeholder="Москва" />
      </Field>
    </div>
    <Field label="Описание">
      <textarea className="field-input min-h-24 resize-none" placeholder="Расскажите о товаре..." />
    </Field>

    <button className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-600 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
      <Icon name="Check" size={18} />
      Опубликовать
    </button>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-500 text-foreground">{label}</label>
    {children}
  </div>
);

interface FavProps {
  listings: Listing[];
  favs: number[];
  toggleFav: (id: number) => void;
}

const FavoritesView = ({ listings, favs, toggleFav }: FavProps) => (
  <div className="px-4 py-4 animate-fade-in space-y-3">
    <h2 className="text-xl font-700 mb-1">Избранное</h2>
    {listings.length === 0 ? (
      <div className="text-center text-muted-foreground py-16">
        <Icon name="Heart" size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Пока нет сохранённых объявлений</p>
      </div>
    ) : (
      listings.map((l: Listing) => (
        <ListingCard key={l.id} l={l} fav={favs.includes(l.id)} toggleFav={toggleFav} />
      ))
    )}
  </div>
);

const ChatsView = () => (
  <div className="animate-fade-in">
    <div className="px-4 py-4">
      <h2 className="text-xl font-700">Уведомления</h2>
    </div>
    <div className="px-4 space-y-2">
      {NOTIFICATIONS.map((n, i) => (
        <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
            <Icon name={n.icon} size={18} className={n.color} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-1">{n.text}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="px-4 pt-6 pb-2">
      <h2 className="text-xl font-700">Сообщения</h2>
    </div>
    <div className="px-4 space-y-1">
      {CHATS.map((c) => (
        <button key={c.id} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-600 shrink-0">
            {c.letter}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <span className="font-600 text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">{c.time}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm text-muted-foreground truncate pr-2">{c.text}</p>
              {c.unread > 0 && (
                <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {c.unread}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

const ProfileView = () => (
  <div className="animate-fade-in">
    <div className="bg-primary text-primary-foreground px-4 pt-2 pb-8 rounded-b-3xl">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-700">
          Д
        </div>
        <div>
          <h2 className="text-lg font-700">Дмитрий Волков</h2>
          <div className="flex items-center gap-1 mt-1">
            <Icon name="Star" size={15} className="fill-amber-300 text-amber-300" />
            <span className="text-sm font-500">4.9</span>
            <span className="text-sm text-white/70">· 24 отзыва</span>
          </div>
        </div>
      </div>
    </div>

    <div className="px-4 -mt-5">
      <div className="grid grid-cols-3 gap-3 bg-card border border-border rounded-2xl p-4">
        {[
          { n: '12', l: 'Активных' },
          { n: '38', l: 'Продано' },
          { n: '156', l: 'Просмотров' },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-xl font-700 text-primary">{s.n}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="px-4 mt-4 space-y-1">
      {[
        { icon: 'Package', label: 'Мои объявления' },
        { icon: 'Bell', label: 'Уведомления по интересам' },
        { icon: 'Star', label: 'Отзывы обо мне' },
        { icon: 'Settings', label: 'Настройки' },
        { icon: 'CircleHelp', label: 'Помощь' },
      ].map((item) => (
        <button key={item.label} className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-muted transition-colors">
          <Icon name={item.icon} size={20} className="text-muted-foreground" />
          <span className="text-sm font-500 flex-1 text-left">{item.label}</span>
          <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
        </button>
      ))}
    </div>
  </div>
);

export default Index;