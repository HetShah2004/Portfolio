# Image prompts

Palette to hold across every image, so the site reads as one system:

| Token | Dark | Light |
|---|---|---|
| Ground | `#050506` near-black | `#f2f1ed` cool paper |
| Accent | `#c9f24d` lime | `#0e6e62` deep teal |
| Text    | `#f0f2ec` | `#131614` |

Two rules that matter more than any individual prompt:

1. **Three colours only.** Ground, accent, and one neutral. The moment a
   fourth hue appears the image stops matching the site and starts looking
   like stock art.
2. **Never generate a product screenshot.** See the Projects section.

---

## Hero

The hero currently has no image: it runs a canvas visual that assembles a
system from scattered points as you scroll. Only reach for a still if you
want to replace that.

### If you want a still instead of the canvas

> Abstract technical diagram on a near-black background, hex #050506. Thin
> 1px lime-green wireframe lines, hex #c9f24d, connecting small circular
> nodes arranged in four horizontal tiers of five, three, four and six
> nodes. The upper tier is loose and scattered, the lower tiers are precise
> and aligned, so the composition reads as chaos resolving into structure
> from top to bottom. Generous empty space. No text, no labels, no icons,
> no glow, no gradients beyond a single very soft lime radial in the upper
> right at under ten percent opacity. Flat, editorial, engineered.
> Aspect ratio 4:5.

### Ambient background texture (optional, sits behind the hero)

> Extremely sparse field of short thin diagonal strokes, lime-green hex
> #c9f24d at very low opacity, scattered evenly on a near-black hex #050506
> ground. Reads as a faint technical grid, almost invisible, no focal
> point, no text, no objects. Seamless. Aspect ratio 16:9.

---

## Projects

**Use real screenshots of the real products.** A generated picture of a UI
that does not exist is a fabricated work sample. A recruiter who opens
AuraSafe or ProtoMind and finds the interface does not match the portfolio
has caught you misrepresenting your work, and that costs far more than a
plain screenshot ever would.

So:

- **AuraSafe, Cryptic, Email Assistant** already use real captures. Keep them.
- **AI Resume Analyzer** has no image yet and shows a hatched empty panel.
  Fix that with a real capture, at roughly 1200x750, saved to
  `projects/resume-analyzer.png`. It appears automatically, no code change.

### Where generated imagery is legitimate here

An **abstract cover** for a project with nothing screenshot-worthy, clearly
not pretending to be a UI:

> Abstract representation of document parsing, on a near-black hex #050506
> ground. A single sheet of paper rendered as a thin lime-green hex #c9f24d
> outline, with horizontal lines of varying length suggesting text, and a
> thin scanning line crossing it. Beside it a small circular progress ring,
> also lime outline. Flat vector, hairline strokes, no fill, no text, no
> glow, wide empty margins. Aspect ratio 16:10.

A **device frame** to sit a real screenshot inside:

> Empty modern smartphone mockup, straight-on front view, perfectly
> centred, matte near-black hex #050506 body, thin bezel, blank screen,
> plain near-black background, soft even studio lighting, no reflections,
> no branding, no text, no hands. Aspect ratio 4:5.

---

## What to avoid

These are what make generated imagery read as filler:

- Blue and purple gradients, the default "AI" look. This site has one
  accent and it is not purple.
- Glowing neon, lens flare, bloom.
- Circuit-board and glowing-brain metaphors.
- Robot hands, humanoid androids, floating holograms.
- Any text or numbers in the image. Generated text is nearly always
  malformed, and here it would sit next to real typography and lose.
- 3D-rendered glass blobs and chrome spheres.

## Prompt suffix worth appending to any of the above

> Flat, minimal, editorial. Three colours only. No text, no watermark, no
> logo, no glow, no lens flare. Generous negative space.

## Where to run these

Gemini (`gemini.google.com`) or the Gemini API with an image model. The
prompts are plain text and work in most image tools, though wording that
suppresses text and glow matters most in whichever one you use.

Once you have files, drop them in `projects/` and tell me the filenames and
I will wire them in.
