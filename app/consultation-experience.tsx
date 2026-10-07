"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Hand, RotateCcw, Shell, Sparkles } from "lucide-react";
import { createHiddenGrid, DOMAINS, SIGNS, TOTAL_SHELLS, type ShellFace } from "./consultation-data";

type Stage = "prepare" | "mode" | "digital" | "physical" | "general" | "domain" | "personalized";

const STEP_LABELS: Record<Stage, string> = {
  prepare: "Préparation", mode: "Mode de lancer", digital: "Lancer numérique", physical: "Lancer physique",
  general: "Interprétation générale", domain: "Domaine", personalized: "Lecture personnalisée",
};

const GENERAL_TEXT: Record<string, string> = {
  "eji-ogbe": "La voie est ouverte. La lumière revient, la chance se lève et la situation consultée reçoit une bonne lumière.",
  opira: "La consultation demande un arrêt immédiat. La situation doit être protégée et présentée sans délai à un praticien.",
};

export function ConsultationExperience() {
  const [stage, setStage] = useState<Stage>("prepare");
  const [grid, setGrid] = useState(() => createHiddenGrid());
  const [choices, setChoices] = useState<ShellFace[]>([]);
  const [revealed, setRevealed] = useState<{ label: number; face: ShellFace } | null>(null);
  const [seconds, setSeconds] = useState(3);
  const [physicalOpen, setPhysicalOpen] = useState(8);
  const [selectedDomain, setSelectedDomain] = useState("");

  const openCount = choices.filter((choice) => choice === "open").length;
  const sign = SIGNS[openCount];
  const progress = Math.round((choices.length / TOTAL_SHELLS) * 100);

  useEffect(() => {
    if (stage !== "digital" || revealed) return;
    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setGrid(createHiddenGrid());
          return 3;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage, revealed]);

  const interpretation = useMemo(
    () => GENERAL_TEXT[sign?.slug] ?? `La consultation donne le signe ${sign?.name}. Son interprétation générale complète sera présentée ici avant le choix du domaine.`,
    [sign],
  );

  function reset() {
    setStage("prepare"); setGrid(createHiddenGrid()); setChoices([]); setRevealed(null); setSeconds(3); setPhysicalOpen(8); setSelectedDomain("");
  }

  function beginDigital() {
    setChoices([]); setGrid(createHiddenGrid()); setSeconds(3); setStage("digital");
  }

  function chooseTile(label: number, face: ShellFace) {
    if (revealed) return;
    setRevealed({ label, face });
    window.setTimeout(() => {
      const next = [...choices, face];
      setChoices(next); setRevealed(null); setGrid(createHiddenGrid()); setSeconds(3);
      if (next.length === TOTAL_SHELLS) setStage("general");
    }, 850);
  }

  function submitPhysical() {
    setChoices([
      ...Array<ShellFace>(physicalOpen).fill("open"),
      ...Array<ShellFace>(TOTAL_SHELLS - physicalOpen).fill("closed"),
    ]);
    setStage("general");
  }

  return (
    <main className="ifawa-app">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <section className="experience-shell">
        <header className="topbar">
          <button className="brand" type="button" onClick={reset} aria-label="Revenir au début">
            <span className="brand-mark"><Shell size={21} strokeWidth={1.7} /></span>
            <span><strong>IfâWa</strong><small>Consultation des seize cauris</small></span>
          </button>
          <div className="step-indicator"><span>{STEP_LABELS[stage]}</span><i /></div>
        </header>

        <div className="content-frame">
          {stage === "prepare" && (
            <section className="stage stage-centered enter-stage">
              <p className="eyebrow">Avant de commencer</p>
              <h1>Placez votre préoccupation au centre de votre pensée.</h1>
              <p className="lead">Choisissez un endroit calme. Vous pouvez écrire votre préoccupation sur un papier ou la garder clairement dans votre esprit.</p>
              <div className="preparation-options">
                <article><span>01</span><div><strong>Sur un papier</strong><p>Écrivez votre préoccupation sans la saisir dans l’application.</p></div></article>
                <article><span>02</span><div><strong>Dans votre esprit</strong><p>Concentrez-vous uniquement sur ce qui vous conduit à consulter.</p></div></article>
              </div>
              <button className="primary-button" type="button" onClick={() => setStage("mode")}>Je suis prêt</button>
            </section>
          )}

          {stage === "mode" && (
            <section className="stage enter-stage">
              <button className="back-button" type="button" onClick={() => setStage("prepare")}><ChevronLeft size={18} /> Retour</button>
              <p className="eyebrow">Le lancer</p><h1>Comment souhaitez-vous accomplir le lancer&nbsp;?</h1>
              <p className="lead narrow">Les deux modes suivent la même pratique et conduisent au même comptage des seize cauris.</p>
              <div className="mode-grid">
                <button type="button" className="mode-card featured" onClick={beginDigital}>
                  <span className="mode-icon"><Sparkles size={25} /></span>
                  <span><small>Sans cauris physiques</small><strong>Lancer dans l’application</strong><p>Choisissez successivement 16 cases numérotées. Chaque choix révèle une face ouverte ou fermée.</p></span><i>Choisir</i>
                </button>
                <button type="button" className="mode-card" onClick={() => setStage("physical")}>
                  <span className="mode-icon"><Hand size={25} /></span>
                  <span><small>Avec vos propres cauris</small><strong>Lancer physique assisté</strong><p>Lancez les 16 cauris devant vous, puis indiquez simplement le nombre de faces ouvertes.</p></span><i>Choisir</i>
                </button>
              </div>
            </section>
          )}

          {stage === "digital" && (
            <section className="stage draw-stage enter-stage">
              <div className="stage-heading"><div><p className="eyebrow">Choix {Math.min(choices.length + 1, 16)} sur 16</p><h1>Choisissez le nombre qui vous attire.</h1></div><div className="timer" aria-label={`Nouvelle disposition dans ${seconds} secondes`}><span>{seconds}</span><small>secondes</small></div></div>
              <div className="progress-track" aria-label={`${progress}% du lancer accompli`}><span style={{ width: `${progress}%` }} /></div>
              <div className="number-board" aria-live="polite">
                {grid.map((tile) => {
                  const isRevealed = revealed?.label === tile.label;
                  return <button key={tile.id} type="button" className={`number-tile ${isRevealed ? "revealed" : ""}`} onClick={() => chooseTile(tile.label, tile.face)} disabled={Boolean(revealed)} aria-label={`Choisir le nombre ${tile.label}`}><span className="tile-front">{tile.label}</span><span className="tile-back"><CauriFace face={tile.face} /><small>{tile.face === "open" ? "Ouvert" : "Fermé"}</small></span></button>;
                })}
              </div>
              <div className="draw-footer"><span>{openCount} ouverts</span><span>{choices.length - openCount} fermés</span><button type="button" onClick={beginDigital}><RotateCcw size={15} /> Recommencer</button></div>
            </section>
          )}

          {stage === "physical" && (
            <section className="stage stage-centered enter-stage">
              <button className="back-button align-left" type="button" onClick={() => setStage("mode")}><ChevronLeft size={18} /> Retour</button>
              <p className="eyebrow">Lancer physique</p><h1>Lancez vos seize cauris.</h1>
              <p className="lead">Après leur chute, comptez les faces ouvertes. Le nombre de faces fermées sera calculé automatiquement.</p>
              <div className="physical-counter"><button type="button" onClick={() => setPhysicalOpen(Math.max(0, physicalOpen - 1))} aria-label="Retirer une face ouverte">−</button><div><span>{physicalOpen}</span><small>cauris ouverts</small></div><button type="button" onClick={() => setPhysicalOpen(Math.min(16, physicalOpen + 1))} aria-label="Ajouter une face ouverte">+</button></div>
              <p className="closed-count">{16 - physicalOpen} cauris fermés · Total 16</p>
              <button className="primary-button" type="button" onClick={submitPhysical}>Valider ce lancer</button>
            </section>
          )}

          {stage === "general" && sign && (
            <section className="stage reading-stage enter-stage">
              <p className="eyebrow">Interprétation générale</p>
              <div className="sign-reveal"><span>{String(sign.opened).padStart(2, "0")}</span><div><small>Le signe obtenu est</small><h1>{sign.name}</h1></div></div>
              <article className={`reading-card ${sign.slug === "opira" ? "urgent" : ""}`}><p>{interpretation}</p>{sign.slug === "opira" && <strong>La suite de cette consultation doit être conduite avec un praticien.</strong>}</article>
              {sign.slug === "opira" ? <button className="primary-button" type="button">Contacter un praticien</button> : <button className="primary-button" type="button" onClick={() => setStage("domain")}>Choisir le domaine concerné</button>}
            </section>
          )}

          {stage === "domain" && (
            <section className="stage enter-stage">
              <p className="eyebrow">Personnaliser la consultation</p><h1>Quel domaine concerne votre préoccupation&nbsp;?</h1>
              <p className="lead narrow">Le domaine permet à l’application de retrouver le vers associé au signe obtenu.</p>
              <div className="domain-grid">{DOMAINS.map((domain, index) => <button key={domain} type="button" className={selectedDomain === domain ? "selected" : ""} onClick={() => setSelectedDomain(domain)}><span>{String(index + 1).padStart(2, "0")}</span>{domain}{selectedDomain === domain && <Check size={17} />}</button>)}</div>
              <button className="primary-button sticky-action" type="button" disabled={!selectedDomain} onClick={() => setStage("personalized")}>Afficher ma lecture</button>
            </section>
          )}

          {stage === "personalized" && sign && (
            <section className="stage reading-stage enter-stage">
              <p className="eyebrow">Lecture personnalisée</p><h1>{sign.name}</h1><p className="domain-label">{selectedDomain}</p>
              <article className="reading-card"><p>Le vers associé à ce signe et à ce domaine sera affiché ici depuis le référentiel validé de l’application.</p><div className="reserved-note"><span>Orientation traditionnelle</span><p>Lorsqu’une démarche rituelle est indiquée, l’application la signale sans en dévoiler l’exécution et propose de contacter un praticien.</p></div></article>
              <div className="result-actions"><button className="primary-button" type="button">Consultation complémentaire</button><button className="secondary-button" type="button" onClick={reset}>Terminer</button></div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function CauriFace({ face }: { face: ShellFace }) {
  return <span className={`cauri-face ${face}`} aria-hidden="true"><i /></span>;
}
