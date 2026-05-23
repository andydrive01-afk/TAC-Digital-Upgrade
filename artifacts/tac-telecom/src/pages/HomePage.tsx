import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Zap, Headphones, Radio, Wifi, MessageCircle, Phone, Star,
  ChevronLeft, ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WHATSAPP_LINK = "https://wa.me/554836600800";

// ── Static fallbacks (used while loading or on API error) ────────────────────
const STATIC_CITIES = [
  "Jaguaruna", "Tubarão", "Criciúma", "Laguna", "Imbituba", "Içara", "Sangão", "Pedras Grandes",
];

const STATIC_REVIEWS = [
  { authorName: "Carlos Mendes", authorPhoto: "", rating: 5, text: "Melhor internet que já tive em Jaguaruna. O pessoal instalou no mesmo dia que pedi e o ping nos jogos é muito baixo.", relativeTime: "" },
  { authorName: "Ana Paula Santos", authorPhoto: "", rating: 5, text: "Suporte maravilhoso! Uma vez deu problema na minha rua e o técnico estava aqui em menos de uma hora. Vale cada centavo.", relativeTime: "" },
  { authorName: "Ricardo Oliveira", authorPhoto: "", rating: 5, text: "Trabalho em home office em Tubarão e precisava de estabilidade. O plano de 1 Giga da TAC nunca me deixou na mão.", relativeTime: "" },
];

// ── API types ────────────────────────────────────────────────────────────────
type Hero = {
  id: number; badge: string; title: string; titleHighlight: string;
  subtitle: string; imageUrl: string; ctaPrimary: string; ctaPrimaryHref: string;
  ctaSecondary: string; ctaSecondaryHref: string; order: number; active: boolean;
};
type Plan = {
  id: number; tab: string; name: string; speed: string; price: string;
  priceCents: string; badge: string; isFeatured: boolean; icons: string[];
  features: string[]; planKey: string; order: number; active: boolean;
};
type City = { id: number; name: string; state: string; active: boolean; order: number };
type GoogleReview = { authorName: string; authorPhoto: string; rating: number; text: string; relativeTime: string };
type GoogleReviewsData = { configured: boolean; rating?: number; totalRatings?: number; reviews?: GoogleReview[]; writeReviewUrl?: string };

// ── Plan Card ────────────────────────────────────────────────────────────────
function SpeedBadge({ speed, tab }: { speed: string; tab: string }) {
  if (tab === "tv") return <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4"><span className="text-primary font-black text-xs leading-tight text-center">TAC<br/>TV</span></div>;
  const label = speed === "1000" ? "1\nGiga" : `${speed}\nMega`;
  return (
    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
      <span className="text-primary font-black text-sm leading-tight text-center whitespace-pre-line">{label}</span>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.isFeatured;
  return (
    <Card className={`h-full flex flex-col relative overflow-hidden transition-colors ${
      featured ? "bg-card border-primary shadow-[0_0_30px_rgba(22,163,74,0.15)]" : "bg-card border-border/50 hover:border-primary/50"
    }`}>
      {featured && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-emerald-400" />}
      <CardHeader>
        {plan.badge && <Badge className={`w-fit mb-3 ${featured ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`} variant={featured ? "default" : "secondary"}>{plan.badge}</Badge>}
        {plan.tab === "tv" && <CardDescription className="text-base font-semibold text-foreground">{plan.name.replace(/TAC TV\s*/i, "TAC TV · ")}</CardDescription>}
        <SpeedBadge speed={plan.speed} tab={plan.tab} />
        <CardTitle className="text-4xl font-black">
          R$ {plan.price}<span className="text-2xl text-muted-foreground">,{plan.priceCents}</span>
          <span className="text-sm font-normal text-muted-foreground block mt-1">/mês</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0" />
              <span className={`text-sm ${featured && i === 0 ? "font-semibold text-primary" : ""}`}>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className={`w-full ${featured ? "text-base h-12" : ""}`} asChild data-testid={`button-contratar-${plan.planKey}`}>
          <Link href={`/contratar?plano=${plan.planKey}`}>Contratar este plano</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Hero Carousel ─────────────────────────────────────────────────────────────
const STATIC_HERO: Hero = {
  id: 0, badge: "Até 1 Giga de Velocidade", title: "Internet fibra óptica de", titleHighlight: "verdade",
  subtitle: "em Jaguaruna e região", imageUrl: "", ctaPrimary: "Ver Planos", ctaPrimaryHref: "/#planos",
  ctaSecondary: "Consultar Cobertura", ctaSecondaryHref: "/#cobertura", order: 0, active: true,
};

function HeroCarousel({ heroes }: { heroes: Hero[] }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const data = heroes.length > 0 ? heroes : [STATIC_HERO];

  const go = useCallback((next: number, d: number) => {
    setDir(d);
    setIdx((next + data.length) % data.length);
  }, [data.length]);

  useEffect(() => {
    if (data.length <= 1) return;
    timerRef.current = setTimeout(() => go(idx + 1, 1), 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, data.length, go]);

  const hero = data[idx]!;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60, transition: { duration: 0.3 } }),
  };

  return (
    <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
      {hero.imageUrl && (
        <img src={hero.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 z-0 pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-background z-0" style={{ opacity: hero.imageUrl ? 0.7 : 1 }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={hero.id} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center">
            {hero.badge && (
              <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 text-primary bg-primary/5 text-sm">
                <Zap className="w-4 h-4 mr-2" />
                {hero.badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.1] mb-6">
              {hero.title}{" "}
              {hero.titleHighlight && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">{hero.titleHighlight}</span>
              )}
              {hero.subtitle && <span className="block">{hero.subtitle}</span>}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
              Streaming sem travar. Ping baixo. Wi-Fi 6. Instalação em 24h.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" asChild>
                <a href={hero.ctaPrimaryHref}>{hero.ctaPrimary}</a>
              </Button>
              {hero.ctaSecondary && (
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8" asChild>
                  <a href={hero.ctaSecondaryHref}>{hero.ctaSecondary}</a>
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel controls */}
        {data.length > 1 && (
          <div className="flex items-center gap-4 mt-10">
            <button onClick={() => go(idx - 1, -1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {data.map((_, i) => (
                <button key={i} onClick={() => go(i, i > idx ? 1 : -1)} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-primary w-6" : "bg-border hover:bg-muted-foreground"}`} />
              ))}
            </div>
            <button onClick={() => go(idx + 1, 1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState<"fibra" | "tv">("fibra");

  // API data states
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cities, setCities] = useState<string[]>(STATIC_CITIES);
  const [reviewsData, setReviewsData] = useState<GoogleReviewsData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [coverageSubmitted, setCoverageSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/content/heroes")
      .then(r => r.ok ? r.json() : [])
      .then((data: Hero[]) => setHeroes(data))
      .catch(() => {});

    fetch("/api/content/plans")
      .then(r => r.ok ? r.json() : [])
      .then((data: Plan[]) => setPlans(data))
      .catch(() => {});

    fetch("/api/content/cities")
      .then(r => r.ok ? r.json() : [])
      .then((data: City[]) => { if (data.length > 0) setCities(data.map(c => c.name)); })
      .catch(() => {});

    fetch("/api/google-reviews")
      .then(r => r.ok ? r.json() : null)
      .then((data: GoogleReviewsData | null) => setReviewsData(data))
      .catch(() => setReviewsData(null))
      .finally(() => setReviewsLoading(false));
  }, []);

  const fibraPlans = plans.filter(p => p.tab === "fibra");
  const tvPlans = plans.filter(p => p.tab === "tv");
  const visiblePlans = planTab === "fibra" ? fibraPlans : tvPlans;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const handleCoverageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCoverageSubmitted(true);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* WhatsApp Floating Button */}
      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
        aria-label="Fale conosco no WhatsApp" data-testid="link-whatsapp-floating">
        <MessageCircle className="w-8 h-8" />
      </a>

      {/* Nav */}
      <header className="sticky top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-2xl font-black tracking-tighter text-primary">TAC<span className="text-foreground">Telecom</span></span>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">Planos</a>
            <a href="#cobertura" className="text-muted-foreground hover:text-primary transition-colors">Cobertura</a>
            <a href="#contato" className="text-muted-foreground hover:text-primary transition-colors">Contato</a>
          </nav>
          <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary">
            <Phone className="w-4 h-4" />
            <span>(48) 3660-0800</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Carousel */}
        <HeroCarousel heroes={heroes} />

        {/* Stats */}
        <section className="border-y border-border bg-card/50">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50 text-center">
              <div><p className="text-3xl font-black">15.000+</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Clientes</p></div>
              <div><p className="text-3xl font-black">99.8%</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Uptime</p></div>
              <div><p className="text-3xl font-black">+10</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Anos no Mercado</p></div>
              <div><p className="text-3xl font-black">{cities.length}</p><p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Cidades Atendidas</p></div>
            </div>
          </div>
        </section>

        {/* City Selector */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Internet fibra em qual cidade?</h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {cities.map(city => (
                <button key={city} onClick={() => setSelectedCity(city)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border ${selectedCity === city ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(22,163,74,0.3)]" : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"}`}
                  data-testid={`button-city-${city.toLowerCase().replace(/\s+/g, "-")}`}>
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="planos" className="py-24 bg-card/30 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Planos Fibra Óptica</h2>
              {selectedCity && <p className="text-xl text-primary font-medium">Disponível em {selectedCity} — instalação express</p>}
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex bg-card border border-border rounded-full p-1 gap-1">
                {([["fibra", "🌐 Fibra Óptica"], ["tv", "📺 TAC TV"]] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setPlanTab(id)}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${planTab === id ? "bg-primary text-primary-foreground shadow-[0_0_12px_rgba(22,163,74,0.3)]" : "text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Cards */}
            {visiblePlans.length > 0 ? (
              <motion.div
                key={planTab}
                className={`grid gap-6 max-w-7xl mx-auto ${planTab === "fibra" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3 max-w-5xl"}`}
                variants={containerVariants} initial="hidden" animate="visible"
              >
                {visiblePlans.map(plan => (
                  <motion.div key={plan.id} variants={itemVariants} className={plan.isFeatured ? "lg:-mt-4 lg:mb-4 z-10" : ""}>
                    <PlanCard plan={plan} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              // Loading skeleton
              <div className={`grid gap-6 max-w-7xl mx-auto ${planTab === "fibra" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3 max-w-5xl"}`}>
                {[1, 2, 3, 4].slice(0, planTab === "fibra" ? 4 : 3).map(i => (
                  <Card key={i} className="animate-pulse h-72"><CardContent className="p-6"><div className="space-y-3"><div className="h-16 w-16 rounded-full bg-muted" /><div className="h-8 bg-muted rounded w-2/3" /><div className="h-4 bg-muted rounded" /><div className="h-4 bg-muted rounded w-4/5" /></div></CardContent></Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Why TAC */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Por que a TAC é diferente?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                { icon: <Zap className="w-8 h-8" />, title: "Instalação em 24h", desc: "Sem enrolação. Pediu hoje, a equipe tá na sua porta amanhã." },
                { icon: <Headphones className="w-8 h-8" />, title: "Suporte local", desc: "Fala com gente daqui. Atendimento humano, direto e rápido." },
                { icon: <Radio className="w-8 h-8" />, title: "Fibra até sua casa", desc: "A verdadeira fibra óptica, de ponta a ponta, sem gargalos." },
                { icon: <Wifi className="w-8 h-8" />, title: "Wi-Fi 6 incluso", desc: "Roteadores de última geração em todos os planos para cobrir toda a casa." },
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">O que nossos clientes dizem</h2>
              {reviewsData?.configured && reviewsData.rating && (
                <div className="flex items-center justify-center gap-3">
                  <div className="flex gap-1 text-primary">
                    {[1,2,3,4,5].map(i => <Star key={i} className={`w-6 h-6 ${i <= Math.round(reviewsData.rating!) ? "fill-current" : "opacity-30"}`} />)}
                  </div>
                  <span className="text-2xl font-black">{reviewsData.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">no Google · {reviewsData.totalRatings?.toLocaleString("pt-BR")} avaliações</span>
                </div>
              )}
              {(!reviewsData?.configured || !reviewsData.rating) && !reviewsLoading && (
                <p className="text-muted-foreground">4.9 estrelas no Google · +850 avaliações</p>
              )}
            </div>

            {reviewsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-card border border-border/50 rounded-xl p-6 animate-pulse">
                    <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(j => <div key={j} className="w-5 h-5 rounded bg-muted" />)}</div>
                    <div className="space-y-2 mb-6"><div className="h-3 bg-muted rounded w-full" /><div className="h-3 bg-muted rounded w-5/6" /></div>
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {!reviewsLoading && (
              <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12"
                variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}>
                {(reviewsData?.configured && reviewsData.reviews?.length ? reviewsData.reviews.slice(0, 3) : STATIC_REVIEWS).map((review, idx) => (
                  <motion.div key={idx} variants={itemVariants}>
                    <Card className="h-full bg-card border-border/50 hover:border-primary/30 transition-colors">
                      <CardContent className="pt-6 flex flex-col h-full">
                        <div className="flex gap-1 mb-4 text-primary">
                          {[1,2,3,4,5].map(i => <Star key={i} className={`w-5 h-5 ${i <= review.rating ? "fill-current" : "opacity-20"}`} />)}
                        </div>
                        <p className="text-muted-foreground mb-6 flex-1 text-sm leading-relaxed">"{review.text}"</p>
                        <div className="flex items-center gap-3">
                          {review.authorPhoto ? (
                            <img src={review.authorPhoto} alt={review.authorName} className="w-9 h-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{review.authorName.charAt(0)}</div>
                          )}
                          <div>
                            <p className="font-bold text-foreground text-sm">{review.authorName}</p>
                            {review.relativeTime && <p className="text-xs text-muted-foreground">{review.relativeTime}</p>}
                          </div>
                          <div className="ml-auto">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-40" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="flex justify-center mt-4">
              <a href={reviewsData?.writeReviewUrl ?? "https://share.google/ZQ5207XOUWQl8LwTa"} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-gray-800 font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-shadow text-sm">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Avaliar a TAC Telecom no Google
              </a>
            </div>
          </div>
        </section>

        {/* Coverage Form */}
        <section id="cobertura" className="py-24 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 z-0" />
          <div className="container relative z-10 mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">Consultar cobertura na sua rua</h2>
              <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-primary/80">
                <span>Internet fibra em Jaguaruna</span>
                <span className="hidden sm:inline">•</span>
                <span>Fibra óptica em Tubarão</span>
                <span className="hidden sm:inline">•</span>
                <span>Internet gamer em Criciúma</span>
              </div>
            </div>

            <Card className="bg-card border-border/50 p-6 md:p-8">
              {!coverageSubmitted ? (
                <form onSubmit={handleCoverageSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="street">Rua e Bairro</Label>
                      <Input id="street" placeholder="Ex: Av. Principal, Centro" required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Select required>
                        <SelectTrigger className="h-12"><SelectValue placeholder="Selecione sua cidade" /></SelectTrigger>
                        <SelectContent>
                          {cities.map(city => <SelectItem key={city} value={city.toLowerCase()}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-14 text-lg">Consultar</Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8" /></div>
                  <h3 className="text-2xl font-bold mb-2">Quase lá!</h3>
                  <p className="text-muted-foreground mb-8">Para agilizar seu atendimento e confirmar a disponibilidade exata, fale com a gente no WhatsApp.</p>
                  <Button size="lg" className="h-14 px-8 text-lg" asChild>
                    <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer"><MessageCircle className="w-5 h-5 mr-2" />Fale no WhatsApp para agilizar</a>
                  </Button>
                </div>
              )}
            </Card>

            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">Cidades com cobertura TAC Telecom</p>
              <div className="flex flex-wrap justify-center gap-2">
                {cities.map(city => <Badge key={city} variant="outline" className="bg-background text-muted-foreground">{city}</Badge>)}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contato" className="bg-card border-t border-border pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <span className="text-2xl font-black tracking-tighter text-primary mb-6 block">TAC<span className="text-foreground">Telecom</span></span>
              <div className="space-y-4">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit">
                  <MessageCircle className="w-5 h-5" /><span>(48) 3660-0800</span>
                </a>
                <a href="mailto:atendimento@tactelecom.com.br" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <span>atendimento@tactelecom.com.br</span>
                </a>
              </div>
            </div>
            <div className="md:text-right">
              <h4 className="font-bold text-foreground mb-6">Links Rápidos</h4>
              <nav className="flex flex-col gap-3">
                <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors inline-block md:ml-auto">Planos de Internet</a>
                <a href="#cobertura" className="text-muted-foreground hover:text-primary transition-colors inline-block md:ml-auto">Consultar Cobertura</a>
                <a href="#contato" className="text-muted-foreground hover:text-primary transition-colors inline-block md:ml-auto">Contato / Suporte</a>
              </nav>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 TAC Telecom. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
