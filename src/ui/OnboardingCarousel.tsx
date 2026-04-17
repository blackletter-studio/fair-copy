import { useState, type ReactElement } from "react";
import { Button, Text, tokens } from "@fluentui/react-components";

export interface OnboardingCarouselProps {
  onDismiss: () => void;
}

interface Slide {
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    title: "Welcome to Fair Copy.",
    body: "Clean Word documents to legal-profession standards in one click.",
  },
  {
    title: "Three presets, one button.",
    body: "Pick a preset. Click Clean. Done.",
  },
  {
    title: "Find it again in your ribbon.",
    body: "The Black Letter tab lives permanently in your Word ribbon — open it any time.",
  },
];

/**
 * First-run 3-slide tour. Dismissed either by clicking "Skip" on slides 0-1
 * or "Got it" on slide 2. Caller is responsible for persisting the
 * "first-run-seen" setting when `onDismiss` fires.
 */
export function OnboardingCarousel({ onDismiss }: OnboardingCarouselProps): ReactElement {
  const [slide, setSlide] = useState(0);
  const isLast = slide === SLIDES.length - 1;
  // eslint-disable-next-line security/detect-object-injection -- slide is bounded 0..SLIDES.length-1 by state updates below
  const current = SLIDES[slide] ?? SLIDES[0]!;

  return (
    <section
      aria-label="Onboarding"
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 320,
      }}
    >
      <div style={{ flex: 1 }}>
        <Text
          as="h1"
          size={600}
          weight="semibold"
          style={{
            display: "block",
            marginBottom: 12,
            fontFamily: "Fraunces, Georgia, serif",
          }}
        >
          {current.title}
        </Text>
        <Text as="p" size={300} style={{ color: tokens.colorNeutralForeground2 }}>
          {current.body}
        </Text>
      </div>

      {/* dot indicators */}
      <div
        style={{ display: "flex", gap: 6, justifyContent: "center" }}
        aria-label={`Slide ${slide + 1} of ${SLIDES.length}`}
      >
        {SLIDES.map((_, i) => (
          <span
            key={i}
            data-testid="onboarding-dot"
            data-active={i === slide ? "true" : "false"}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor:
                i === slide ? tokens.colorBrandBackground : tokens.colorNeutralStroke2,
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {!isLast && (
          <Button appearance="subtle" onClick={onDismiss}>
            Skip
          </Button>
        )}
        <div style={{ marginLeft: "auto" }}>
          {isLast ? (
            <Button appearance="primary" onClick={onDismiss}>
              Got it
            </Button>
          ) : (
            <Button appearance="primary" onClick={() => setSlide(slide + 1)}>
              Next
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
