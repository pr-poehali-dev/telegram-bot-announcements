import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';

const API_URL = 'https://functions.poehali.dev/97938461-ad8b-48a6-b71e-e94ff0a72f1b';
const CHAT_API_URL = 'https://functions.poehali.dev/b21ecf3f-7d0b-4ea0-a89e-b5b5c60d2fdf';

type Tab = 'feed' | 'create' | 'favorites' | 'chats' | 'profile';

interface Listing {
  id: number;
  title: string;
  description?: string;
  price: number;
  category: string;
  location: string;
  image_url?: string;
  author_name?: string;
  created_at?: string;
}

interface ChatSummary {
  id: number;
  listing_id: number;
  seller_name: string;
  listing_title?: string;
  image_url?: string;
  last_text?: string;
  last_time?: string;
  unread: number;
}

interface ChatMessage {
  id: number;
  chat_id: number;
  sender: string;
  text: string;
  created_at: string;
}

const CATEGORIES = ['Все', 'Транспорт', 'Недвижимость', 'Электроника', 'Работа', 'Услуги', 'Хобби'];
const FORM_CATEGORIES = CATEGORIES.filter((c) => c !== 'Все');

const NOTIFICATIONS = [
  { icon: 'MessageCircle', color: 'text-primary', text: 'Новый отклик на «Велосипед шоссейный»', time: '3 мин назад' },
  { icon: 'Heart', color: 'text-rose-500', text: 'Ваше объявление добавили в избранное', time: '1 ч назад' },
  { icon: 'Bell', color: 'text-amber-500', text: '5 новых объявлений в «Транспорт»', time: '2 ч назад' },
];

const formatPrice = (p: number) => (p > 0 ? `${p.toLocaleString('ru-RU')} ₽` : 'Бесплатно');

const timeAgo = (iso?: string) => {
  if (!iso) return 'только что';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
};

const Index = () => {
  const [tab, setTab] = useState<Tab>('feed');
  const [activeCat, setActiveCat] = useState('Все');
  const [search, setSearch] = useState('');
  const [favs, setFavs] = useState<number[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [chatsRefreshKey, setChatsRefreshKey] = useState(0);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeCat !== 'Все') params.set('category', activeCat);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`${API_URL}?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch {
      toast({ title: 'Не удалось загрузить объявления', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [activeCat, search]);

  useEffect(() => {
    const t = setTimeout(loadListings, 300);
    return () => clearTimeout(t);
  }, [loadListings]);

  const toggleFav = (id: number) =>
    setFavs((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex justify-center">
      <div className="w-full max-w-md bg-background relative flex flex-col min-h-screen shadow-xl">
        <header className="sticky top-0 z-20 bg-primary text-primary-foreground px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Icon name="Send" size={18} />
              </div>
              <h1 className="text-lg font-700 tracking-tight">Барахолка</h1>
            </div>
            <button
              onClick={() => setTab('chats')}
              className="relative w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
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
              search={search}
              setSearch={setSearch}
              listings={listings}
              loading={loading}
              favs={favs}
              toggleFav={toggleFav}
              onOpen={setSelected}
            />
          )}
          {tab === 'create' && (
            <CreateView
              onCreated={() => {
                setTab('feed');
                setActiveCat('Все');
                setSearch('');
                loadListings();
              }}
            />
          )}
          {tab === 'favorites' && (
            <FavoritesView
              listings={listings.filter((l) => favs.includes(l.id))}
              favs={favs}
              toggleFav={toggleFav}
              onOpen={setSelected}
            />
          )}
          {tab === 'chats' && (
            <ChatsView
              refreshKey={chatsRefreshKey}
              openChatId={openChatId}
              onOpenChat={setOpenChatId}
              onCloseChat={() => setOpenChatId(null)}
            />
          )}
          {tab === 'profile' && <ProfileView count={listings.length} />}
        </main>

        {selected && (
          <ListingDetail
            listing={selected}
            fav={favs.includes(selected.id)}
            toggleFav={toggleFav}
            onClose={() => setSelected(null)}
            onChat={async () => {
              try {
                const res = await fetch(CHAT_API_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'open',
                    listing_id: selected.id,
                    seller_name: selected.author_name || 'Продавец',
                  }),
                });
                const data = await res.json();
                setSelected(null);
                setTab('chats');
                setChatsRefreshKey((k) => k + 1);
                setOpenChatId(data.chat_id);
              } catch {
                toast({ title: 'Не удалось открыть чат', variant: 'destructive' });
              }
            }}
          />
        )}

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
                <span className={`text-[10px] ${active ? 'text-primary font-600' : 'text-muted-foreground'}`}>
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
  search: string;
  setSearch: (s: string) => void;
  listings: Listing[];
  loading: boolean;
  favs: number[];
  toggleFav: (id: number) => void;
  onOpen: (l: Listing) => void;
}

const FeedView = ({ activeCat, setActiveCat, search, setSearch, listings, loading, favs, toggleFav, onOpen }: FeedProps) => (
  <div className="animate-fade-in">
    <div className="px-4 pt-4">
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3">
        <Icon name="Search" size={18} className="text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск объявлений..."
          className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => setSearch('')}>
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        )}
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
      {loading ? (
        [1, 2].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="h-44 bg-muted animate-pulse" />
            <div className="p-3.5 space-y-2">
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))
      ) : listings.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 text-sm">
          <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
          Ничего не найдено
        </div>
      ) : (
        listings.map((l) => (
          <ListingCard key={l.id} l={l} fav={favs.includes(l.id)} toggleFav={toggleFav} onOpen={onOpen} />
        ))
      )}
    </div>
  </div>
);

const ListingCard = ({
  l,
  fav,
  toggleFav,
  onOpen,
}: {
  l: Listing;
  fav: boolean;
  toggleFav: (id: number) => void;
  onOpen: (l: Listing) => void;
}) => (
  <div
    onClick={() => onOpen(l)}
    className="bg-card rounded-2xl overflow-hidden border border-border animate-scale-in cursor-pointer hover:shadow-md transition-shadow"
  >
    <div className="relative">
      {l.image_url ? (
        <img src={l.image_url} alt={l.title} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-muted flex items-center justify-center">
          <Icon name="Image" size={32} className="text-muted-foreground" />
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFav(l.id);
        }}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
      >
        <Icon name="Heart" size={18} className={fav ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'} />
      </button>
      <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
        {l.category}
      </span>
    </div>
    <div className="p-3.5">
      <div className="text-lg font-700 text-foreground">{formatPrice(l.price)}</div>
      <div className="text-sm text-foreground mt-0.5 line-clamp-1">{l.title}</div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
        <Icon name="MapPin" size={13} />
        <span className="truncate">{l.location || 'Не указано'}</span>
        <span>·</span>
        <span className="shrink-0">{timeAgo(l.created_at)}</span>
      </div>
    </div>
  </div>
);

const ListingDetail = ({
  listing,
  fav,
  toggleFav,
  onClose,
  onChat,
}: {
  listing: Listing;
  fav: boolean;
  toggleFav: (id: number) => void;
  onClose: () => void;
  onChat: () => void;
}) => (
  <div className="fixed inset-0 z-30 flex justify-center">
    <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
    <div className="relative w-full max-w-md bg-background rounded-t-3xl mt-auto max-h-[92vh] overflow-y-auto animate-scale-in">
      <div className="relative">
        {listing.image_url ? (
          <img src={listing.image_url} alt={listing.title} className="w-full h-72 object-cover" />
        ) : (
          <div className="w-full h-72 bg-muted flex items-center justify-center">
            <Icon name="Image" size={40} className="text-muted-foreground" />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
        >
          <Icon name="X" size={18} />
        </button>
        <button
          onClick={() => toggleFav(listing.id)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center"
        >
          <Icon name="Heart" size={18} className={fav ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground'} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <span className="inline-block bg-accent text-accent-foreground text-xs px-2.5 py-1 rounded-lg mb-2">
            {listing.category}
          </span>
          <div className="text-2xl font-700">{formatPrice(listing.price)}</div>
          <h2 className="text-lg font-600 mt-1">{listing.title}</h2>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
            <Icon name="MapPin" size={14} />
            <span>{listing.location || 'Не указано'}</span>
            <span>·</span>
            <span>{timeAgo(listing.created_at)}</span>
          </div>
        </div>

        {listing.description && (
          <div>
            <h3 className="text-sm font-600 mb-1">Описание</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{listing.description}</p>
          </div>
        )}

        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-600 shrink-0">
            {(listing.author_name || 'А')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-600 text-sm truncate">{listing.author_name || 'Аноним'}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon name="Star" size={12} className="fill-amber-400 text-amber-400" />
              <span>4.9 · 24 отзыва</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border p-4 flex gap-3">
        <button
          onClick={onChat}
          className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3.5 font-600 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Icon name="MessageCircle" size={18} />
          Написать продавцу
        </button>
        <button className="w-14 rounded-2xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
          <Icon name="Phone" size={18} />
        </button>
      </div>
    </div>
  </div>
);

const CreateView = ({ onCreated }: { onCreated: () => void }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: 'Введите название объявления', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: parseInt(price) || 0,
          category: category || 'Услуги',
          location: location.trim(),
          image_url: image,
          author_name: 'Дмитрий Волков',
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Объявление опубликовано!' });
      onCreated();
    } catch {
      toast({ title: 'Не удалось опубликовать', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-4 animate-fade-in space-y-4">
      <h2 className="text-xl font-700">Новое объявление</h2>

      <div className="grid grid-cols-3 gap-2">
        <label className="aspect-square rounded-2xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer overflow-hidden">
          {image ? (
            <img src={image} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Icon name="Camera" size={22} />
              <span className="text-[10px]">Фото</span>
            </>
          )}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
        <div className="aspect-square rounded-2xl bg-muted" />
        <div className="aspect-square rounded-2xl bg-muted" />
      </div>

      <Field label="Название">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" placeholder="Например, iPhone 14 Pro" />
      </Field>
      <Field label="Категория">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="field-input appearance-none">
          <option value="">Выберите категорию</option>
          {FORM_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Цена, ₽">
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" className="field-input" placeholder="0" />
        </Field>
        <Field label="Город">
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="field-input" placeholder="Москва" />
        </Field>
      </div>
      <Field label="Описание">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="field-input min-h-24 resize-none" placeholder="Расскажите о товаре..." />
      </Field>

      <button
        onClick={submit}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-600 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        <Icon name={saving ? 'Loader' : 'Check'} size={18} className={saving ? 'animate-spin' : ''} />
        {saving ? 'Публикуем...' : 'Опубликовать'}
      </button>
    </div>
  );
};

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
  onOpen: (l: Listing) => void;
}

const FavoritesView = ({ listings, favs, toggleFav, onOpen }: FavProps) => (
  <div className="px-4 py-4 animate-fade-in space-y-3">
    <h2 className="text-xl font-700 mb-1">Избранное</h2>
    {listings.length === 0 ? (
      <div className="text-center text-muted-foreground py-16">
        <Icon name="Heart" size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Пока нет сохранённых объявлений</p>
      </div>
    ) : (
      listings.map((l) => (
        <ListingCard key={l.id} l={l} fav={favs.includes(l.id)} toggleFav={toggleFav} onOpen={onOpen} />
      ))
    )}
  </div>
);

interface ChatsViewProps {
  refreshKey: number;
  openChatId: number | null;
  onOpenChat: (id: number) => void;
  onCloseChat: () => void;
}

const ChatsView = ({ refreshKey, openChatId, onOpenChat, onCloseChat }: ChatsViewProps) => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch(CHAT_API_URL);
      const data = await res.json();
      setChats(data.chats || []);
    } catch {
      toast({ title: 'Не удалось загрузить чаты', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats, refreshKey]);

  const activeChat = chats.find((c) => c.id === openChatId);

  if (openChatId && activeChat) {
    return (
      <ChatWindow
        chat={activeChat}
        onBack={() => {
          onCloseChat();
          loadChats();
        }}
      />
    );
  }

  return (
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
        {loading ? (
          [1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-3 w-40 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : chats.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 text-sm">
            <Icon name="MessageCircle" size={36} className="mx-auto mb-2 opacity-40" />
            Пока нет диалогов
          </div>
        ) : (
          chats.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpenChat(c.id)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-600 shrink-0 overflow-hidden">
                {c.image_url ? (
                  <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (c.seller_name || 'П')[0]
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-600 text-sm truncate">{c.seller_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(c.last_time)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-muted-foreground truncate pr-2">
                    {c.last_text || c.listing_title || 'Новый диалог'}
                  </p>
                  {c.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const ChatWindow = ({ chat, onBack }: { chat: ChatSummary; onBack: () => void }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`${CHAT_API_URL}?chat_id=${chat.id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast({ title: 'Не удалось загрузить сообщения', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [chat.id]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 4000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    const value = text.trim();
    setText('');
    setSending(true);
    try {
      await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', chat_id: chat.id, sender: 'buyer', text: value }),
      });
      await loadMessages();
    } catch {
      toast({ title: 'Не удалось отправить сообщение', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack}>
          <Icon name="ArrowLeft" size={20} className="text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-600 shrink-0 overflow-hidden">
          {chat.image_url ? (
            <img src={chat.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (chat.seller_name || 'П')[0]
          )}
        </div>
        <div className="min-w-0">
          <div className="font-600 text-sm truncate">{chat.seller_name}</div>
          {chat.listing_title && (
            <div className="text-xs text-muted-foreground truncate">{chat.listing_title}</div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-10">Загрузка...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-10">
            Начните диалог с продавцом
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                  m.sender === 'buyer'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Сообщение..."
          className="flex-1 bg-card border border-border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity shrink-0"
        >
          <Icon name="Send" size={16} />
        </button>
      </div>
    </div>
  );
};

const ProfileView = ({ count }: { count: number }) => (
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
          { n: String(count), l: 'Активных' },
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