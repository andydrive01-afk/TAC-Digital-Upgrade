import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, ChevronLeft, MapPin, User, ClipboardList, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WHATSAPP_NUMBER = "554836600800";

const PLANS: Record<string, string> = {
  "500": "Plano 500 Mega — R$ 89,90/mês",
  "800": "Plano 800 Mega — R$ 109,90/mês",
  "1giga": "Plano 1 Giga — R$ 129,90/mês",
  "1gigatv": "Plano 1 Giga + TAC TV — R$ 159,90/mês",
};

const CITIES = [
  "Jaguaruna", "Tubarão", "Criciúma", "Laguna",
  "Imbituba", "Içara", "Sangão", "Pedras Grandes",
];

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

type Step1Data = { nome: string; email: string; telefone: string };
type Step2Data = { cep: string; rua: string; numero: string; complemento: string; bairro: string; estado: string; cidade: string };

const STEP_LABELS = ["Seus Dados", "Endereço", "Confirmar"];

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40, transition: { duration: 0.2 } }),
};

function formatPhone(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function ContractPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planoKey = params.get("plano") ?? "1giga";
  const planoLabel = PLANS[planoKey] ?? PLANS["1giga"];

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [sent, setSent] = useState(false);

  const [step1, setStep1] = useState<Step1Data>({ nome: "", email: "", telefone: "" });
  const [step2, setStep2] = useState<Step2Data>({ cep: "", rua: "", numero: "", complemento: "", bairro: "", estado: "SC", cidade: "" });

  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleConfirm = () => {
    const msg = [
      `Olá! Quero contratar a TAC Telecom.`,
      ``,
      `*Plano escolhido:* ${planoLabel}`,
      ``,
      `*Dados pessoais:*`,
      `Nome: ${step1.nome}`,
      `E-mail: ${step1.email}`,
      `Telefone: ${step1.telefone}`,
      ``,
      `*Endereço de instalação:*`,
      `CEP: ${step2.cep}`,
      `Rua: ${step2.rua}, ${step2.numero}${step2.complemento ? ` — ${step2.complemento}` : ""}`,
      `Bairro: ${step2.bairro}`,
      `Cidade: ${step2.cidade} — ${step2.estado}`,
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  const step1Valid = step1.nome.trim().length >= 2 && step1.email.includes("@") && step1.telefone.replace(/\D/g, "").length >= 10;
  const step2Valid = step2.cep.replace(/\D/g, "").length === 8 && step2.rua.trim().length >= 2 && step2.numero.trim().length >= 1 && step2.bairro.trim().length >= 2 && step2.cidade.length > 0;

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
          <p className="text-muted-foreground mb-8">
            Abrimos o WhatsApp com todas as suas informações preenchidas. Nossa equipe vai confirmar a disponibilidade e agendar a instalação em breve.
          </p>
          <Button className="w-full h-12" onClick={() => setLocation("/")}>
            Voltar ao início
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="text-2xl font-black tracking-tighter text-primary">
            TAC<span className="text-foreground">Telecom</span>
          </button>
          <div className="text-sm text-muted-foreground font-medium">
            Contratação online
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Plan pill */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold">
              <Check className="w-4 h-4" />
              {planoLabel}
            </span>
          </div>

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
                  <div className={`w-16 h-0.5 mx-1 mb-5 transition-colors duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              {/* STEP 0 — Personal data */}
              {step === 0 && (
                <motion.div key="step0" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <div className="p-6 md:p-8 border-b border-border/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Seus Dados de Contato</h2>
                      <p className="text-sm text-muted-foreground">Para mantermos você informado sobre a instalação.</p>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        data-testid="input-nome"
                        placeholder="Seu nome completo"
                        value={step1.nome}
                        onChange={e => setStep1(p => ({ ...p, nome: e.target.value }))}
                        className="h-12"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          data-testid="input-email"
                          placeholder="seu@email.com"
                          value={step1.email}
                          onChange={e => setStep1(p => ({ ...p, email: e.target.value }))}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          type="tel"
                          data-testid="input-telefone"
                          placeholder="(48) 9 0000-0000"
                          value={step1.telefone}
                          onChange={e => setStep1(p => ({ ...p, telefone: formatPhone(e.target.value) }))}
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-6 md:px-8 pb-6 md:pb-8 flex justify-between items-center">
                    <button
                      onClick={() => setLocation("/")}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-voltar-inicio"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <Button
                      disabled={!step1Valid}
                      onClick={() => go(1)}
                      className="h-11 px-8"
                      data-testid="button-proximo-step1"
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 1 — Address */}
              {step === 1 && (
                <motion.div key="step1" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <div className="p-6 md:p-8 border-b border-border/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Endereço de Instalação</h2>
                      <p className="text-sm text-muted-foreground">Onde você quer sua nova conexão ultrarrápida?</p>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          data-testid="input-cep"
                          placeholder="88000-000"
                          value={step2.cep}
                          onChange={e => setStep2(p => ({ ...p, cep: formatCep(e.target.value) }))}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          data-testid="input-numero"
                          placeholder="Ex: 123"
                          value={step2.numero}
                          onChange={e => setStep2(p => ({ ...p, numero: e.target.value }))}
                          className="h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rua">Rua</Label>
                      <Input
                        id="rua"
                        data-testid="input-rua"
                        placeholder="Nome da rua ou avenida"
                        value={step2.rua}
                        onChange={e => setStep2(p => ({ ...p, rua: e.target.value }))}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento (opcional)</Label>
                      <Input
                        id="complemento"
                        data-testid="input-complemento"
                        placeholder="Apto, bloco, casa..."
                        value={step2.complemento}
                        onChange={e => setStep2(p => ({ ...p, complemento: e.target.value }))}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        data-testid="input-bairro"
                        placeholder="Nome do bairro"
                        value={step2.bairro}
                        onChange={e => setStep2(p => ({ ...p, bairro: e.target.value }))}
                        className="h-12"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-5">
                      <div className="space-y-2 col-span-1">
                        <Label>Estado</Label>
                        <Select value={step2.estado} onValueChange={v => setStep2(p => ({ ...p, estado: v }))}>
                          <SelectTrigger className="h-12" data-testid="select-estado">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_BR.map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Cidade</Label>
                        <Select value={step2.cidade} onValueChange={v => setStep2(p => ({ ...p, cidade: v }))}>
                          <SelectTrigger className="h-12" data-testid="select-cidade">
                            <SelectValue placeholder="Selecione a cidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {CITIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 md:px-8 pb-6 md:pb-8 flex justify-between items-center">
                    <button
                      onClick={() => go(0)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-voltar-step2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Voltar
                    </button>
                    <Button
                      disabled={!step2Valid}
                      onClick={() => go(2)}
                      className="h-11 px-8"
                      data-testid="button-proximo-step2"
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Review */}
              {step === 2 && (
                <motion.div key="step2" custom={dir} variants={stepVariants} initial="enter" animate="center" exit="exit">
                  <div className="p-6 md:p-8 border-b border-border/50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Revise e Confirme</h2>
                      <p className="text-sm text-muted-foreground">Verifique se todos os dados estão corretos antes de finalizar.</p>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 space-y-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Plano selecionado</p>
                      <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                        <p className="font-bold text-primary">{planoLabel}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Dados pessoais</p>
                      <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-1.5">
                        <p className="text-sm"><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{step1.nome}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{step1.email}</span></p>
                        <p className="text-sm"><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{step1.telefone}</span></p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Endereço de instalação</p>
                      <div className="bg-muted/50 rounded-xl px-4 py-3 space-y-1.5">
                        <p className="text-sm font-medium">{step2.rua}, {step2.numero}{step2.complemento ? ` — ${step2.complemento}` : ""}</p>
                        <p className="text-sm text-muted-foreground">{step2.bairro}, {step2.cidade} — {step2.estado}</p>
                        <p className="text-sm text-muted-foreground">CEP: {step2.cep}</p>
                      </div>
                    </div>

                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">
                        Ao confirmar, vamos abrir o WhatsApp com seus dados preenchidos para nosso time finalizar a assinatura.
                      </p>
                    </div>
                  </div>
                  <div className="px-6 md:px-8 pb-6 md:pb-8 flex justify-between items-center">
                    <button
                      onClick={() => go(1)}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-voltar-step3"
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
            Seus dados estao seguros conosco.
          </p>
        </div>
      </div>
    </div>
  );
}
