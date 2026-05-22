import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  Headphones,
  Radio,
  Wifi,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WHATSAPP_LINK = "https://wa.me/5548999990000";

const CITIES = [
  "Jaguaruna",
  "Tubarão",
  "Criciúma",
  "Laguna",
  "Imbituba",
  "Içara",
  "Sangão",
  "Pedras Grandes",
];

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [coverageSubmitted, setCoverageSubmitted] = useState(false);

  const handleCoverageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCoverageSubmitted(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* WhatsApp Floating Button */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
        aria-label="Fale conosco no WhatsApp"
        data-testid="link-whatsapp-floating"
      >
        <MessageCircle className="w-8 h-8" />
      </a>

      {/* Nav */}
      <header className="sticky top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-primary">
              TAC<span className="text-foreground">Telecom</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#planos" className="text-muted-foreground hover:text-primary transition-colors">Planos</a>
            <a href="#cobertura" className="text-muted-foreground hover:text-primary transition-colors">Cobertura</a>
            <a href="#contato" className="text-muted-foreground hover:text-primary transition-colors">Contato</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary">
              <Phone className="w-4 h-4" />
              <span>(48) 9 9999-0000</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
          <div className="absolute inset-0 bg-background z-0"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>

          <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 text-primary bg-primary/5 text-sm">
              <Zap className="w-4 h-4 mr-2" />
              Até 1 Giga de Velocidade
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-[1.1] mb-6">
              Internet fibra óptica de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">verdade</span> em Jaguaruna e região
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
              Streaming sem travar. Ping baixo. Wi-Fi 6. Instalação em 24h.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8" asChild>
                <a href="#planos">Ver Planos</a>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8" asChild>
                <a href="#cobertura">Consultar Cobertura</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-card/50">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50 text-center">
              <div>
                <p className="text-3xl font-black text-foreground">15.000+</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Clientes</p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">99.8%</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Uptime</p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">+10</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Anos no Mercado</p>
              </div>
              <div>
                <p className="text-3xl font-black text-foreground">8</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mt-1">Cidades Atendidas</p>
              </div>
            </div>
          </div>
        </section>

        {/* City Selector */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Internet fibra em qual cidade?</h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border ${
                    selectedCity === city 
                      ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(22,163,74,0.3)]' 
                      : 'bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  data-testid={`button-city-${city.toLowerCase()}`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section id="planos" className="py-24 bg-card/30 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Escolha seu plano</h2>
              {selectedCity && (
                <p className="text-xl text-primary font-medium">
                  Disponível em {selectedCity} — instalação express
                </p>
              )}
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Plan 1 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full flex flex-col bg-card border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-4">Plano 500 Mega</Badge>
                    <CardTitle className="text-4xl font-black">
                      R$ 89<span className="text-2xl text-muted-foreground">,90</span>
                      <span className="text-sm font-normal text-muted-foreground block mt-1">/mês</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Streaming HD sem travar</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Wi-Fi incluso</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Suporte 24h</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Instalação em 24h</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">Contratar via WhatsApp</a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Plan 2 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full flex flex-col bg-card border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-4">Plano 800 Mega</Badge>
                    <CardTitle className="text-4xl font-black">
                      R$ 109<span className="text-2xl text-muted-foreground">,90</span>
                      <span className="text-sm font-normal text-muted-foreground block mt-1">/mês</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Streaming 4K</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Wi-Fi 6</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Suporte 24h</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Instalação prioritária</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">Contratar via WhatsApp</a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Plan 3 - Most Popular */}
              <motion.div variants={itemVariants} className="lg:-mt-4 lg:mb-4 z-10">
                <Card className="h-full flex flex-col bg-card border-primary shadow-[0_0_30px_rgba(22,163,74,0.15)] relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-emerald-400"></div>
                  <CardHeader>
                    <Badge className="w-fit mb-4 bg-primary text-primary-foreground hover:bg-primary">MAIS CONTRATADO</Badge>
                    <CardTitle className="text-4xl font-black">
                      R$ 129<span className="text-2xl text-muted-foreground">,90</span>
                      <span className="text-sm font-normal text-muted-foreground block mt-1">/mês</span>
                    </CardTitle>
                    <CardDescription className="text-base font-semibold text-foreground mt-2">Plano 1 Giga</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">Streaming 4K+</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">Wi-Fi 6 AX</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">Upload alto para home office</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">Gaming sem lag</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full text-base h-12" asChild>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">Contratar via WhatsApp</a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Plan 4 */}
              <motion.div variants={itemVariants}>
                <Card className="h-full flex flex-col bg-card border-border/50 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-4">Plano 1 Giga + TAC TV</Badge>
                    <CardTitle className="text-4xl font-black">
                      R$ 159<span className="text-2xl text-muted-foreground">,90</span>
                      <span className="text-sm font-normal text-muted-foreground block mt-1">/mês</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">Tudo do 1 Giga</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-semibold text-primary">180 canais ao vivo</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm">TAC TV incluída</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" asChild>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">Contratar via WhatsApp</a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* Why TAC */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">Por que a TAC é diferente?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Instalação em 24h</h3>
                <p className="text-muted-foreground text-sm">Sem enrolação. Pediu hoje, a equipe tá na sua porta amanhã.</p>
              </div>

              <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Headphones className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Suporte local</h3>
                <p className="text-muted-foreground text-sm">Fala com gente daqui. Atendimento humano, direto e rápido.</p>
              </div>

              <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Radio className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Fibra até sua casa</h3>
                <p className="text-muted-foreground text-sm">A verdadeira fibra óptica, de ponta a ponta, sem gargalos.</p>
              </div>

              <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Wifi className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Wi-Fi 6 incluso</h3>
                <p className="text-muted-foreground text-sm">Roteadores de última geração em todos os planos para cobrir toda a casa.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-24 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">O que nossos clientes dizem</h2>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              <motion.div variants={itemVariants}>
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4 text-primary">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <p className="text-muted-foreground mb-6">"Melhor internet que já tive em Jaguaruna. O pessoal instalou no mesmo dia que pedi e o ping nos jogos é muito baixo."</p>
                    <p className="font-bold text-foreground">Carlos Mendes</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4 text-primary">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <p className="text-muted-foreground mb-6">"Suporte maravilhoso! Uma vez deu problema na minha rua e o técnico estava aqui em menos de uma hora. Vale cada centavo."</p>
                    <p className="font-bold text-foreground">Ana Paula Santos</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="bg-card border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4 text-primary">
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                    <p className="text-muted-foreground mb-6">"Trabalho em home office em Tubarão e precisava de estabilidade. O plano de 1 Giga da TAC nunca me deixou na mão."</p>
                    <p className="font-bold text-foreground">Ricardo Oliveira</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <div className="text-center">
              <p className="text-lg font-medium text-foreground">4.9 estrelas no Google <span className="text-muted-foreground font-normal mx-2">|</span> +850 avaliações</p>
            </div>
          </div>
        </section>

        {/* Coverage Form */}
        <section id="cobertura" className="py-24 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 z-0"></div>
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
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Selecione sua cidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIES.map(city => (
                            <SelectItem key={city} value={city.toLowerCase()}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" size="lg" className="w-full h-14 text-lg">Consultar</Button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Quase lá!</h3>
                  <p className="text-muted-foreground mb-8">Para agilizar seu atendimento e confirmar a disponibilidade exata, fale com a gente no WhatsApp.</p>
                  <Button size="lg" className="h-14 px-8 text-lg" asChild>
                    <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Fale no WhatsApp para agilizar
                    </a>
                  </Button>
                </div>
              )}
            </Card>

            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">Cidades com cobertura TAC Telecom</p>
              <div className="flex flex-wrap justify-center gap-2">
                {CITIES.map((city) => (
                  <Badge key={city} variant="outline" className="bg-background text-muted-foreground">{city}</Badge>
                ))}
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
              <span className="text-2xl font-black tracking-tighter text-primary mb-6 block">
                TAC<span className="text-foreground">Telecom</span>
              </span>
              <div className="space-y-4">
                <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit">
                  <MessageCircle className="w-5 h-5" />
                  <span>(48) 9 9999-0000</span>
                </a>
                <a href="mailto:atendimento@tactelecom.com.br" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
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
