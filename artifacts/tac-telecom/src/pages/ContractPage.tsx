import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronRight, ChevronLeft, MapPin, User,
  ClipboardList, MessageCircle, Calendar, Clock, UserPlus, X,
  Locate, Loader2, Navigation, Tv, Phone, Wifi, Plus, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WHATSAPP_NUMBER = "554836600800";
const API_BASE = "/api";

type ApiPlan = {
  id: number;
  tab: string;
  name: string;
  speed: string;
  price: string;
  priceCents: string;
  planKey: string;
  features: string[];
  isFeatured: boolean;
};

// Fallback internet plan labels (used if API fails to load)
const FALLBACK_PLANS: Record<string, string> = {
  "fibra400": "Fibra 400 Mega",
  "fibra600": "Fibra 600 Mega",
  "fibra800": "Fibra 800 Mega",
  "fibra1g": "Fibra 1 Giga",
};

const CITIES = [
  "Jaguaruna", "Tubarão", "Criciúma", "Laguna",
  "Imbituba", "Içara", "Sangão", "Pedras Grandes",
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const TIME_SLOTS = [
  { id: "manha", label: "Manhã", range: "8h às 12h" },
  { id: "tarde", label: "Tarde", range: "13h às 18h" },
];

const STEP_LABELS = ["Planos", "Seus Dados", "Endereço", "Agendamento", "Confirmar"];

type Step1Data = {
  nome: string; email: string; telefone: string; cpf: string;
  outroNome: string; outroTelefone: string; temOutro: boolean;
};
type Step2Data = {
  cep: string; rua: string; numero: string;
  complemento: string; bairro: string; estado: string; cidade: string;
};
type Step3Data = { data: string; turno: string };

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.2 } }),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCpf(val: string): string {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function cpfIsValid(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  const calc = (digits: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) sum += parseInt(digits[i]) * (factor - i);
    const rem = (sum * 10) % 11;
    return rem >= 10 ? 0 : rem;
  };
  return calc(d, 10) === parseInt(d[9]) && calc(d, 11) === parseInt(d[10]);
}

function formatPhone(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCep(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Calculates total price for qty units of a plan and formats as "R$ X,XX/mês" */
function calcPriceDisplay(plan: ApiPlan, qty: number): string {
  const totalCents = (parseInt(plan.price || "0") * 100 + parseInt(plan.priceCents || "0")) * qty;
  const reais = Math.floor(totalCents / 100);
  const cents = (totalCents % 100).toString().padStart(2, "0");
  return `R$ ${reais},${cents}/mês`;
}

/** Single plan price display */
function planPriceDisplay(plan: ApiPlan): string {
  return `R$ ${plan.price},${plan.priceCents}/mês`;
}

const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function getAvailableDays(count = 12): { iso: string; label: string; short: string; weekday: string }[] {
  const days = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (days.length < count) {
    const dow = d.getDay();
    if (dow !== 0) {
      const iso = d.toISOString().slice(0, 10);
      const label = `${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
      const short = String(d.getDate()).padStart(2, "0");
      const weekday = WEEKDAY_NAMES[dow];
      days.push({ iso, label, short, weekday });
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="p-6 md:p-8 border-b border-border/50 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function NavRow({ onBack, onNext, nextLabel = "Próximo", nextDisabled = false, nextTestId = "" }: {
  onBack: () => void; onNext: () => void;
  nextLabel?: string; nextDisabled?: boolean; nextTestId?: string;
}) {
  return (
    <div className="px-6 md:px-8 pb-6 md:pb-8 flex justify-between items-center">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </button>
      <Button disabled={nextDisabled} onClick={onNext} className="h-11 px-8" data-testid={nextTestId}>
        {nextLabel}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

/** Horizontal scrollable plan card row */
function PlanCardRow({ plans, selectedKey, onSelect }: {
  plans: ApiPlan[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  if (plans.length === 0) {
    return <p className="text-xs text-muted-foreground italic py-1">Nenhum plano disponível.</p>;
  }
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {plans.map(plan => {
        const selected = selectedKey === plan.planKey;
        return (
          <button
            key={plan.planKey}
            type="button"
            onClick={() => onSelect(plan.planKey)}
            className={`flex-none w-44 text-left px-3 py-3 rounded-xl border transition-all duration-150 ${
              selected
                ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(22,163,74,0.18)]"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className="text-sm font-semibold leading-tight">{plan.name}</p>
              {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />}
            </div>
            {plan.speed ? (
              <p className="text-xs text-muted-foreground mb-2">{plan.speed} Mbps</p>
            ) : null}
            <p className="text-base font-black text-primary leading-none">
              R$ {plan.price},{plan.priceCents}
            </p>
            <p className="text-xs text-muted-foreground">/mês {plan.tab !== "fibra" ? "por unid." : ""}</p>
          </button>
        );
      })}
    </div>
  );
}

/** Counter for points / lines */
function Counter({ value, min, max, onChange, label }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary/50 hover:bg-muted/40 disabled:opacity-40 transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-6 text-center font-black text-lg leading-none">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary/50 hover:bg-muted/40 disabled:opacity-40 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ContractPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planoKey = params.get("plano") ?? "fibra1g";

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [sent, setSent] = useState(false);

  // ── Plan selection state ─────────────────────────────────
  const [apiPlans, setApiPlans] = useState<ApiPlan[]>([]);

  // Internet (always required)
  const [selectedInternetKey, setSelectedInternetKey] = useState<string>(planoKey);

  // TV add-on (optional)
  const [tvEnabled, setTvEnabled] = useState(false);
  const [selectedTvKey, setSelectedTvKey] = useState<string | null>(null);
  const [tvPontos, setTvPontos] = useState(1);

  // Telefone add-on (optional, up to 2 lines)
  const [telefoneEnabled, setTelefoneEnabled] = useState(false);
  const [selectedTelefoneKey, setSelectedTelefoneKey] = useState<string | null>(null);
  const [telefoneLinhas, setTelefoneLinhas] = useState(1);

  useEffect(() => {
    fetch(`${API_BASE}/content/plans`)
      .then(r => r.json())
      .then((data: ApiPlan[]) => {
        setApiPlans(data);
        const fibraPlans = data.filter((p: ApiPlan) => p.tab === "fibra");
        // If current key is not a fibra plan, fall back to first fibra plan
        setSelectedInternetKey(prev => {
          const isValidFibra = fibraPlans.some((p: ApiPlan) => p.planKey === prev);
          if (!isValidFibra && fibraPlans.length > 0) return fibraPlans[0].planKey;
          return prev;
        });
        // Auto-select first plan for addons already enabled before load
        setSelectedTvKey(prev => {
          if (prev !== null) return prev;
          const tvPlans = data.filter((p: ApiPlan) => p.tab === "tv");
          return tvEnabled && tvPlans.length > 0 ? tvPlans[0].planKey : null;
        });
        setSelectedTelefoneKey(prev => {
          if (prev !== null) return prev;
          const telPlans = data.filter((p: ApiPlan) => p.tab === "telefone");
          return telefoneEnabled && telPlans.length > 0 ? telPlans[0].planKey : null;
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync internet key if URL param changes after mount — only accept fibra keys
  useEffect(() => {
    setSelectedInternetKey(prev => {
      // Will be validated against fibra plans on next plan load; for now accept as-is
      // and rely on the load effect to correct non-fibra keys once plans are available
      if (apiPlans.length === 0) return planoKey;
      const fibraPlans = apiPlans.filter(p => p.tab === "fibra");
      const isValidFibra = fibraPlans.some(p => p.planKey === planoKey);
      if (isValidFibra) return planoKey;
      return fibraPlans.length > 0 ? fibraPlans[0].planKey : prev;
    });
  }, [planoKey, apiPlans]);

  // Derived plan lists
  const internetPlans = apiPlans.filter(p => p.tab === "fibra");
  const tvPlans = apiPlans.filter(p => p.tab === "tv");
  const telefonePlans = apiPlans.filter(p => p.tab === "telefone");

  const selectedInternetPlan = apiPlans.find(p => p.planKey === selectedInternetKey);
  const selectedTvPlan = tvPlans.find(p => p.planKey === selectedTvKey);
  const selectedTelefonePlan = telefonePlans.find(p => p.planKey === selectedTelefoneKey);

  // Auto-select first TV plan when enabling TV
  const handleToggleTv = (enabled: boolean) => {
    setTvEnabled(enabled);
    if (enabled && !selectedTvKey && tvPlans.length > 0) {
      setSelectedTvKey(tvPlans[0].planKey);
    }
  };

  // Auto-select first telefone plan when enabling telefone
  const handleToggleTelefone = (enabled: boolean) => {
    setTelefoneEnabled(enabled);
    if (enabled && !selectedTelefoneKey && telefonePlans.length > 0) {
      setSelectedTelefoneKey(telefonePlans[0].planKey);
    }
  };

  // ── GPS ─────────────────────────────────────────────────
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocalização não suportada pelo seu navegador.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Não foi possível obter a localização. Verifique as permissões do navegador.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Form steps state ─────────────────────────────────────
  const [step1, setStep1] = useState<Step1Data>({
    nome: "", email: "", telefone: "", cpf: "",
    outroNome: "", outroTelefone: "", temOutro: false,
  });
  const [step2, setStep2] = useState<Step2Data>({
    cep: "", rua: "", numero: "", complemento: "", bairro: "", estado: "SC", cidade: "",
  });
  const [step3, setStep3] = useState<Step3Data>({ data: "", turno: "" });

  const availableDays = useMemo(() => getAvailableDays(12), []);

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const step1Valid = step1.nome.trim().length >= 2
    && step1.email.includes("@")
    && step1.telefone.replace(/\D/g, "").length >= 10
    && cpfIsValid(step1.cpf)
    && (!step1.temOutro || (step1.outroNome.trim().length >= 2 && step1.outroTelefone.replace(/\D/g, "").length >= 10));

  const step2Valid = step2.cep.replace(/\D/g, "").length === 8
    && step2.rua.trim().length >= 2
    && step2.numero.trim().length >= 1
    && step2.bairro.trim().length >= 2
    && step2.cidade.length > 0;

  const step3Valid = step3.data.length > 0 && step3.turno.length > 0;

  const selectedDay = availableDays.find(d => d.iso === step3.data);
  const selectedSlot = TIME_SLOTS.find(t => t.id === step3.turno);

  // ── WA confirm ───────────────────────────────────────────
  const handleConfirm = () => {
    // Plan name only — no prices in WA message
    const internetName = selectedInternetPlan?.name ?? (FALLBACK_PLANS[selectedInternetKey] ?? selectedInternetKey);

    const lines = [
      `Olá! Quero contratar a TAC Telecom.`,
      ``,
      `*Planos contratados:*`,
      `🌐 Internet: ${internetName}`,
    ];

    if (tvEnabled && selectedTvPlan) {
      lines.push(`📺 TV: ${selectedTvPlan.name} — ${tvPontos} ponto${tvPontos > 1 ? "s" : ""}`);
    }
    if (telefoneEnabled && selectedTelefonePlan) {
      lines.push(`📞 Telefone: ${selectedTelefonePlan.name} — ${telefoneLinhas} linha${telefoneLinhas > 1 ? "s" : ""}`);
    }

    lines.push(
      ``,
      `*Dados pessoais:*`,
      `Nome: ${step1.nome}`,
      `CPF: ${step1.cpf}`,
      `E-mail: ${step1.email}`,
      `Telefone: ${step1.telefone}`,
    );

    if (step1.temOutro && step1.outroNome) {
      lines.push(``, `*Outro contato para instalação:*`);
      lines.push(`Nome: ${step1.outroNome}`);
      lines.push(`Telefone: ${step1.outroTelefone}`);
    }

    lines.push(
      ``,
      `*Endereço de instalação:*`,
      `CEP: ${step2.cep}`,
      `Rua: ${step2.rua}, ${step2.numero}${step2.complemento ? ` — ${step2.complemento}` : ""}`,
      `Bairro: ${step2.bairro}`,
      `Cidade: ${step2.cidade} — ${step2.estado}`,
    );

    if (gpsCoords) {
      lines.push(`Localização precisa (GPS): https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`);
    }

    lines.push(
      ``,
      `*Data preferida para instalação:*`,
      `${selectedDay?.weekday}, ${selectedDay?.label} — ${selectedSlot?.label} (${selectedSlot?.range})`,
    );

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  // ── Success screen ────────────────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-md w-full bg-card border border-border rounded-2xl p-10 text-center shadow-xl"
        >
          <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-black mb-3">Pedido enviado!</h2>
          <p className="text-muted-foreground mb-2">
            Abrimos o WhatsApp com todas as suas informações preenchidas.
          </p>
          <p className="text-muted-foreground mb-8">
            Nossa equipe confirma a disponibilidade e agenda a instalação conforme sua preferência.
          </p>
          <Button className="w-full h-12" onClick={() => setLocation("/")}>
            Voltar ao início
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="text-2xl font-black tracking-tighter text-primary">
            TAC<span className="text-foreground">Telecom</span>
          </button>
          <div className="text-sm text-muted-foreground font-medium">Contratação online</div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                    i < step ? "bg-primary text-primary-foreground" :
                    i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap transition-colors ${i === step ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 mb-5 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>

              {/* ── STEP 0: Seleção de Planos ── */}
              {step === 0 && (
                <motion.div key="step0" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <SectionHeader
                    icon={<Wifi className="w-5 h-5" />}
                    title="Escolha seu Plano"
                    subtitle="Selecione o plano de internet e adicione TV ou telefone se quiser."
                  />

                  {/* Internet (obrigatório) */}
                  <div className="px-6 md:px-8 pt-5 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">Plano de Internet</span>
                      <span className="ml-auto text-xs text-primary font-semibold bg-primary/10 rounded-full px-2 py-0.5">Obrigatório</span>
                    </div>
                    <PlanCardRow plans={internetPlans} selectedKey={selectedInternetKey} onSelect={setSelectedInternetKey} />
                    {selectedInternetPlan && (
                      <p className="text-xs text-primary font-medium mt-2 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {selectedInternetPlan.name} — {planPriceDisplay(selectedInternetPlan)}
                      </p>
                    )}
                  </div>

                  {/* TV (opcional) */}
                  <div className={`px-6 md:px-8 py-4 border-b border-border/60 transition-colors ${tvEnabled ? "bg-primary/[0.03]" : ""}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${tvEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Tv className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">TAC TV</span>
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                      <button type="button" onClick={() => handleToggleTv(!tvEnabled)}
                        className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${tvEnabled ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}>
                        {tvEnabled ? <><Check className="w-3 h-3" /> Adicionado</> : <>+ Adicionar</>}
                      </button>
                    </div>
                    {tvEnabled && (
                      <div className="mt-3 space-y-3">
                        <PlanCardRow plans={tvPlans} selectedKey={selectedTvKey} onSelect={setSelectedTvKey} />
                        {selectedTvPlan && (
                          <>
                            <Counter value={tvPontos} min={1} max={10} onChange={setTvPontos} label="Pontos:" />
                            <p className="text-xs text-primary font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {selectedTvPlan.name} · {tvPontos} ponto{tvPontos > 1 ? "s" : ""} — {calcPriceDisplay(selectedTvPlan, tvPontos)}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Telefone (opcional) */}
                  <div className={`px-6 md:px-8 py-4 transition-colors ${telefoneEnabled ? "bg-primary/[0.03]" : ""}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${telefoneEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Phone className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold">Telefone Fixo</span>
                      <span className="text-xs text-muted-foreground">(opcional)</span>
                      <button type="button" onClick={() => handleToggleTelefone(!telefoneEnabled)}
                        className={`ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${telefoneEnabled ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}>
                        {telefoneEnabled ? <><Check className="w-3 h-3" /> Adicionado</> : <>+ Adicionar</>}
                      </button>
                    </div>
                    {telefoneEnabled && (
                      <div className="mt-3 space-y-3">
                        <PlanCardRow plans={telefonePlans} selectedKey={selectedTelefoneKey} onSelect={setSelectedTelefoneKey} />
                        {selectedTelefonePlan && (
                          <>
                            <Counter value={telefoneLinhas} min={1} max={2} onChange={setTelefoneLinhas} label="Linhas:" />
                            <p className="text-xs text-primary font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {selectedTelefonePlan.name} · {telefoneLinhas} linha{telefoneLinhas > 1 ? "s" : ""} — {calcPriceDisplay(selectedTelefonePlan, telefoneLinhas)}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <NavRow onBack={() => setLocation("/")} onNext={() => go(1)}
                    nextDisabled={!selectedInternetPlan} nextTestId="button-proximo-step0" />
                </motion.div>
              )}

              {/* ── STEP 1: Dados pessoais ── */}
              {step === 1 && (
                <motion.div key="step1" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <SectionHeader
                    icon={<User className="w-5 h-5" />}
                    title="Seus Dados de Contato"
                    subtitle="Para mantermos você informado sobre a instalação."
                  />
                  <div className="p-6 md:p-8 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input id="nome" data-testid="input-nome" placeholder="Seu nome completo"
                        value={step1.nome} onChange={e => setStep1(p => ({ ...p, nome: e.target.value }))} className="h-12" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        data-testid="input-cpf"
                        placeholder="000.000.000-00"
                        value={step1.cpf}
                        onChange={e => setStep1(p => ({ ...p, cpf: formatCpf(e.target.value) }))}
                        className={`h-12 ${step1.cpf.length > 0 && !cpfIsValid(step1.cpf) ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      {step1.cpf.length > 0 && !cpfIsValid(step1.cpf) && (
                        <p className="text-xs text-destructive">CPF inválido. Verifique e tente novamente.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" data-testid="input-email" placeholder="seu@email.com"
                          value={step1.email} onChange={e => setStep1(p => ({ ...p, email: e.target.value }))} className="h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" type="tel" data-testid="input-telefone" placeholder="(48) 9 0000-0000"
                          value={step1.telefone} onChange={e => setStep1(p => ({ ...p, telefone: formatPhone(e.target.value) }))} className="h-12" />
                      </div>
                    </div>

                    {/* Outro contato */}
                    <div className="pt-2">
                      {!step1.temOutro ? (
                        <button
                          type="button"
                          data-testid="button-adicionar-outro-contato"
                          onClick={() => setStep1(p => ({ ...p, temOutro: true }))}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          <UserPlus className="w-4 h-4" />
                          Adicionar outro contato para a instalação
                        </button>
                      ) : (
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <UserPlus className="w-4 h-4 text-primary" />
                              Outro contato para a instalação
                            </div>
                            <button
                              type="button"
                              data-testid="button-remover-outro-contato"
                              onClick={() => setStep1(p => ({ ...p, temOutro: false, outroNome: "", outroTelefone: "" }))}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Quem estará no local para receber o técnico, caso você não possa.
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="outro-nome">Nome</Label>
                              <Input id="outro-nome" data-testid="input-outro-nome" placeholder="Nome completo"
                                value={step1.outroNome} onChange={e => setStep1(p => ({ ...p, outroNome: e.target.value }))} className="h-11 bg-background" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="outro-telefone">Telefone</Label>
                              <Input id="outro-telefone" type="tel" data-testid="input-outro-telefone" placeholder="(48) 9 0000-0000"
                                value={step1.outroTelefone} onChange={e => setStep1(p => ({ ...p, outroTelefone: formatPhone(e.target.value) }))} className="h-11 bg-background" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <NavRow onBack={() => go(0)} onNext={() => go(2)}
                    nextDisabled={!step1Valid} nextTestId="button-proximo-step1" />
                </motion.div>
              )}

              {/* ── STEP 2: Endereço ── */}
              {step === 2 && (
                <motion.div key="step2" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <SectionHeader
                    icon={<MapPin className="w-5 h-5" />}
                    title="Endereço de Instalação"
                    subtitle="Onde você quer sua nova conexão ultrarrápida?"
                  />
                  <div className="p-6 md:p-8 space-y-5">
                    {/* GPS location button */}
                    <div>
                      {!gpsCoords ? (
                        <button
                          type="button"
                          data-testid="button-usar-localizacao"
                          onClick={handleGetLocation}
                          disabled={locating}
                          className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary/60 transition-all duration-150 text-sm font-medium disabled:opacity-60"
                        >
                          {locating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Obtendo localização...</>
                          ) : (
                            <><Locate className="w-4 h-4" />Usar minha localização atual (GPS)</>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                          <Navigation className="w-4 h-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary">Localização capturada</p>
                            <a
                              href={`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary underline"
                            >
                              {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)} — Ver no mapa
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGpsCoords(null)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid="button-remover-gps"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {locError && (
                        <p className="text-xs text-destructive mt-2 text-center">{locError}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input id="cep" data-testid="input-cep" placeholder="88000-000"
                          value={step2.cep} onChange={e => setStep2(p => ({ ...p, cep: formatCep(e.target.value) }))} className="h-12" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input id="numero" data-testid="input-numero" placeholder="Ex: 123"
                          value={step2.numero} onChange={e => setStep2(p => ({ ...p, numero: e.target.value }))} className="h-12" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rua">Rua</Label>
                      <Input id="rua" data-testid="input-rua" placeholder="Nome da rua ou avenida"
                        value={step2.rua} onChange={e => setStep2(p => ({ ...p, rua: e.target.value }))} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento (opcional)</Label>
                      <Input id="complemento" data-testid="input-complemento" placeholder="Apto, bloco, casa..."
                        value={step2.complemento} onChange={e => setStep2(p => ({ ...p, complemento: e.target.value }))} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input id="bairro" data-testid="input-bairro" placeholder="Nome do bairro"
                        value={step2.bairro} onChange={e => setStep2(p => ({ ...p, bairro: e.target.value }))} className="h-12" />
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      <div className="space-y-2 col-span-1">
                        <Label>Estado</Label>
                        <Select value={step2.estado} onValueChange={v => setStep2(p => ({ ...p, estado: v }))}>
                          <SelectTrigger className="h-12" data-testid="select-estado"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Cidade</Label>
                        <Select value={step2.cidade} onValueChange={v => setStep2(p => ({ ...p, cidade: v }))}>
                          <SelectTrigger className="h-12" data-testid="select-cidade"><SelectValue placeholder="Selecione a cidade" /></SelectTrigger>
                          <SelectContent>
                            {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <NavRow onBack={() => go(1)} onNext={() => go(3)}
                    nextDisabled={!step2Valid} nextTestId="button-proximo-step2" />
                </motion.div>
              )}

              {/* ── STEP 3: Agendamento ── */}
              {step === 3 && (
                <motion.div key="step3" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <SectionHeader
                    icon={<Calendar className="w-5 h-5" />}
                    title="Agendar Instalação"
                    subtitle="Escolha o melhor dia e horário para receber nosso técnico."
                  />
                  <div className="p-6 md:p-8 space-y-6">
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Data preferida</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {availableDays.map(day => (
                          <button
                            key={day.iso}
                            type="button"
                            data-testid={`button-dia-${day.iso}`}
                            onClick={() => setStep3(p => ({ ...p, data: day.iso }))}
                            className={`flex flex-col items-center py-3 px-2 rounded-xl border text-sm transition-all duration-150 ${
                              step3.data === day.iso
                                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(22,163,74,0.25)]"
                                : "bg-card border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            <span className="text-xs font-medium opacity-70 mb-0.5">{day.weekday}</span>
                            <span className="text-lg font-black leading-none">{day.short}</span>
                            <span className="text-xs opacity-70 mt-0.5">{MONTH_NAMES[new Date(day.iso + "T12:00:00").getMonth()]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold mb-3 block flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        Turno de preferência
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {TIME_SLOTS.map(slot => (
                          <button
                            key={slot.id}
                            type="button"
                            data-testid={`button-turno-${slot.id}`}
                            onClick={() => setStep3(p => ({ ...p, turno: slot.id }))}
                            className={`flex flex-col items-center py-4 rounded-xl border transition-all duration-150 ${
                              step3.turno === slot.id
                                ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(22,163,74,0.25)]"
                                : "bg-card border-border/60 text-foreground hover:border-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            <span className="text-base font-bold">{slot.label}</span>
                            <span className="text-xs opacity-70 mt-1">{slot.range}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Nossa equipe confirmará a data pelo WhatsApp. Instalação sujeita à disponibilidade de agenda.
                    </p>
                  </div>
                  <NavRow onBack={() => go(2)} onNext={() => go(4)}
                    nextDisabled={!step3Valid} nextTestId="button-proximo-step3" />
                </motion.div>
              )}

              {/* ── STEP 4: Confirmar ── */}
              {step === 4 && (
                <motion.div key="step4" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <SectionHeader
                    icon={<ClipboardList className="w-5 h-5" />}
                    title="Revise e Confirme"
                    subtitle="Verifique se todos os dados estão corretos antes de finalizar."
                  />
                  <div className="p-6 md:p-8 space-y-5">

                    {/* Planos */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Planos contratados</p>
                      <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-3.5 h-3.5 text-primary shrink-0" />
                          <p className="text-sm font-bold text-primary">
                            {selectedInternetPlan?.name ?? (FALLBACK_PLANS[selectedInternetKey] ?? selectedInternetKey)}
                            {selectedInternetPlan && (
                              <span className="font-normal text-primary/70"> — {planPriceDisplay(selectedInternetPlan)}</span>
                            )}
                          </p>
                        </div>
                        {tvEnabled && selectedTvPlan && (
                          <div className="flex items-center gap-2">
                            <Tv className="w-3.5 h-3.5 text-primary shrink-0" />
                            <p className="text-sm font-medium text-primary">
                              {selectedTvPlan.name} · {tvPontos} ponto{tvPontos > 1 ? "s" : ""}
                              <span className="font-normal text-primary/70"> — {calcPriceDisplay(selectedTvPlan, tvPontos)}</span>
                            </p>
                          </div>
                        )}
                        {telefoneEnabled && selectedTelefonePlan && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                            <p className="text-sm font-medium text-primary">
                              {selectedTelefonePlan.name} · {telefoneLinhas} linha{telefoneLinhas > 1 ? "s" : ""}
                              <span className="font-normal text-primary/70"> — {calcPriceDisplay(selectedTelefonePlan, telefoneLinhas)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dados pessoais */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Dados pessoais</p>
                      <div className="bg-muted/40 rounded-xl px-4 py-3 space-y-1.5">
                        <p className="text-sm"><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{step1.nome}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{step1.cpf}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{step1.email}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{step1.telefone}</span></p>
                      </div>
                    </div>

                    {/* Outro contato */}
                    {step1.temOutro && step1.outroNome && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Outro contato para instalação</p>
                        <div className="bg-muted/40 rounded-xl px-4 py-3 space-y-1.5">
                          <p className="text-sm"><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{step1.outroNome}</span></p>
                          <p className="text-sm"><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{step1.outroTelefone}</span></p>
                        </div>
                      </div>
                    )}

                    {/* Endereço */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Endereço de instalação</p>
                      <div className="bg-muted/40 rounded-xl px-4 py-3 space-y-1.5">
                        <p className="text-sm font-medium">{step2.rua}, {step2.numero}{step2.complemento ? ` — ${step2.complemento}` : ""}</p>
                        <p className="text-sm text-muted-foreground">{step2.bairro}, {step2.cidade} — {step2.estado}</p>
                        <p className="text-sm text-muted-foreground">CEP: {step2.cep}</p>
                        {gpsCoords && (
                          <a
                            href={`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                          >
                            <Navigation className="w-3 h-3" />
                            Localização GPS confirmada — Ver no mapa
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Agendamento */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Data e horário preferidos</p>
                      <div className="bg-muted/40 rounded-xl px-4 py-3 flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{selectedDay?.weekday}, {selectedDay?.label}</p>
                          <p className="text-sm text-muted-foreground">{selectedSlot?.label} — {selectedSlot?.range}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center pt-1">
                      Ao confirmar, o WhatsApp abrirá com seus dados preenchidos para nosso time finalizar a assinatura.
                    </p>
                  </div>

                  <div className="px-6 md:px-8 pb-6 md:pb-8 flex justify-between items-center">
                    <button
                      onClick={() => go(3)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-voltar-step4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <Button
                      onClick={handleConfirm}
                      className="h-11 px-8 bg-[#25D366] hover:bg-[#20bd5a] text-white"
                      data-testid="button-confirmar-assinatura"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Confirmar Assinatura
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Seus dados estão seguros conosco.
          </p>
        </div>
      </div>
    </div>
  );
}
