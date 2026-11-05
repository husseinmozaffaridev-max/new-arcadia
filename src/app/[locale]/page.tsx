"use client";

import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/modules/shared/ui/components/common/theme-toggle";
import { Button } from "@/modules/shared/ui/components/ui/button";
import { cn } from "@/modules/shared/ui/libs/cn";
import { ArrowRight, GitMerge, Layers, Shield, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations();
  const tLayers = useTranslations("layers");
  const tFeatures = useTranslations("features");

  const LAYERS = [
    {
      code: "OA" as const,
      container: "bg-blue-50 border-blue-200/30 hover:border-blue-300/50",
      badge: "bg-blue-500 text-white",
      text: "text-blue-800",
    },
    {
      code: "SA" as const,
      container: "bg-amber-50 border-amber-200/30 hover:border-amber-300/50",
      badge: "bg-amber-500 text-white",
      text: "text-amber-800",
    },
    {
      code: "LA" as const,
      container:
        "bg-emerald-50 border-emerald-200/30 hover:border-emerald-300/50",
      badge: "bg-emerald-600 text-white",
      text: "text-emerald-800",
    },
    {
      code: "PA" as const,
      container: "bg-purple-50 border-purple-200/30 hover:border-purple-300/50",
      badge: "bg-purple-600 text-white",
      text: "text-purple-800",
    },
  ];

  const FEATURES = [
    {
      icon: <Layers className="h-5 w-5" />,
      title: tFeatures("arcadiaLayers.title"),
      desc: tFeatures("arcadiaLayers.desc"),
    },
    {
      icon: <GitMerge className="h-5 w-5" />,
      title: tFeatures("traceability.title"),
      desc: tFeatures("traceability.desc"),
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: tFeatures("validation.title"),
      desc: tFeatures("validation.desc"),
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: tFeatures("collaboration.title"),
      desc: tFeatures("collaboration.desc"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl supports-backdrop-filter:bg-background/40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 border border-border/50 transition-colors group-hover:bg-foreground/10">
              <span className="text-sm font-bold text-foreground">A</span>
            </div>
            <span className="font-semibold text-base tracking-tight">
              Arcadia
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              asChild
            >
              <Link href="#features">{t("home.featuresTitle")}</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              asChild
            >
              <Link href="#layers">{t("home.layersTitle")}</Link>
            </Button>
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="w-px h-5 bg-border/60 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              asChild
            >
              <Link href="/auth/login">{t("common.signIn")}</Link>
            </Button>
            <Button size="sm" className="h-8 px-3.5" asChild>
              <Link href="/auth/register">{t("common.getStarted")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="mx-auto max-w-3xl flex flex-col items-center gap-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t("home.heroBadge")}
          </div>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            {t("home.heroTitle")}
            <br />
            <span className="text-muted-foreground">
              {t("home.heroTitleHighlight")}
            </span>
          </h1>

          <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
            {t("home.heroDescription")}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="h-11 px-6 gap-2" asChild>
              <Link href="/auth/register">
                {t("common.getStarted")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-6" asChild>
              <Link href="/auth/login">{t("common.signIn")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Arcadia Layers */}
      <section
        id="layers"
        className="border-y border-border/40 bg-muted/30 px-6 py-20"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {t("home.layersTitle")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("home.layersDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LAYERS.map((layer) => (
              <div
                key={layer.code}
                className={cn(
                  "group relative rounded-xl border p-5 transition-all hover:shadow-sm",
                  layer.container,
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      layer.badge,
                    )}
                  >
                    {layer.code}
                  </span>
                </div>
                <p className={cn("font-semibold text-sm mb-1", layer.text)}>
                  {tLayers(`${layer.code}.name`)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tLayers(`${layer.code}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              {t("home.featuresTitle")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("home.featuresDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 rounded-xl border border-border/60 bg-card p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{f.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-xl text-center flex flex-col items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5 border border-border/50">
            <span className="text-2xl font-bold text-foreground">A</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            {t("home.ctaDescription")}
          </p>
          <Button size="lg" className="h-11 px-8 gap-2" asChild>
            <Link href="/auth/register">
              {t("common.createAccount")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("home.footerLeft")}</span>
          <span>{t("home.footerRight")}</span>
        </div>
      </footer>
    </div>
  );
}
