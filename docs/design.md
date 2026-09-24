# Design reference

Source: https://www.comicsense.store/
Page: Comicsense – The OG Anime Merchandise Store in India

Measured from 381 rendered elements at 1920 x 963px. This is a sample of the current document and state, not the original design source.

## Color palette

Only observed CSS colors are listed. Usage labels describe where a color was found. Hex is an sRGB preview; retain the original CSS value for its color space and transparency.

Usage | Original CSS value | sRGB hex | Observed root properties | Occurrences
--- | --- | --- | --- | ---
Text | rgb(19, 19, 19) |  |  | 156
Text | rgb(0, 0, 0) |  |  | 122
Text | rgb(77, 93, 109) |  |  | 65
Text | rgb(255, 36, 170) |  |  | 29
Text | rgb(255, 255, 255) |  |  | 6
Text | rgb(0, 122, 255) |  |  | 2
Text | rgb(17, 17, 17) |  |  | 1
Surface | rgb(255, 255, 255) |  |  | 38
Surface | rgb(251, 249, 255) |  |  | 1
Surface | rgb(220, 223, 227) |  |  | 1
Border | rgba(0, 0, 0, 0.05) |  |  | 24

## Typography

Role | Family | Size | Weight | Line height | Tracking | Text transform
--- | --- | --- | --- | --- | --- | ---
Section heading | Dosis, sans-serif | 14px | 400 | 14px | normal | none
Body | Dosis, sans-serif | 14px | 400 | 21px | normal | none
Small text | Dosis, sans-serif | 13px | 400 | 21.45px | normal | none
Button | Dosis, sans-serif | 16px | 400 | 26.4px | normal | none

## Spacing

Value | Occurrences
--- | ---
3px | 6
5px | 48
10px | 53
14px | 13
15px | 76
15.25px | 1
19px | 6
20px | 50
24px | 4

## Layout gaps

Value | Occurrences
--- | ---
8px | 2
14px | 2
15px | 50

## Corner radii

Value | Occurrences
--- | ---
3px | 160
8px | 108
100% | 52

## Shadows

Value | Occurrences
--- | ---
rgba(0, 0, 0, 0.12) 0px 2px 3px 0px | 27

## Motion durations

Value | Occurrences
--- | ---
0.12s | 70
0.18s | 2

## Motion easing

Value | Occurrences
--- | ---
cubic-bezier(0.455, 0.03, 0.515, 0.955) | 70
ease | 2

### Accessible keyframe names

- gl-fadeIn
- gl-fadeOut
- gl-spin
- gl-zoomIn
- gl-zoomOut
- spin
- shake
- fall
- passing-through
- pulse
- slide-in
- gl-bouncedelay

## Component recipes

Computed styles for the captured state. Selectors identify sampled elements; text and placeholders come from the page. Form values are excluded. These style specimens do not reconstruct child markup or uncaptured interaction states.

### Button 1

```css
button {
  align-items: center;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-radius: 0px;
  border-top-color: rgba(0, 0, 0, 0);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(0, 0, 0);
  display: flex;
  font-family: Dosis, sans-serif;
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: center;
  letter-spacing: normal;
  line-height: 26.4px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

### Button 2

```css
button {
  align-items: center;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-radius: 0px;
  border-top-color: rgb(0, 122, 255);
  border-top-style: none;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(0, 122, 255);
  display: flex;
  font-family: Dosis, sans-serif;
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: center;
  letter-spacing: normal;
  line-height: 28px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

### Button 3

```css
button {
  align-items: center;
  background-color: rgb(255, 255, 255);
  background-image: none;
  border-radius: 100%;
  border-top-color: rgb(19, 19, 19);
  border-top-style: none;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(19, 19, 19);
  display: flex;
  font-family: Dosis, sans-serif;
  font-size: 15px;
  font-weight: 500;
  gap: normal;
  justify-content: center;
  letter-spacing: normal;
  line-height: 24.75px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

### Card 1

```css
card {
  align-items: normal;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-radius: 0px;
  border-top-color: rgb(19, 19, 19);
  border-top-style: none;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(19, 19, 19);
  display: block;
  font-family: Dosis, sans-serif;
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 26.4px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

### Card 2

```css
card {
  align-items: normal;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-radius: 0px;
  border-top-color: rgb(19, 19, 19);
  border-top-style: none;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(19, 19, 19);
  display: flex;
  font-family: Dosis, sans-serif;
  font-size: 16px;
  font-weight: 400;
  gap: 15px;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 26.4px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

### Card 3

```css
card {
  align-items: center;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-radius: 0px;
  border-top-color: rgba(0, 0, 0, 0.05);
  border-top-style: solid;
  border-top-width: 1px;
  box-shadow: none;
  color: rgb(19, 19, 19);
  display: flex;
  font-family: Dosis, sans-serif;
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 26.4px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

## Layout measurements

Element | Width | Display | Columns | Gap | Padding (T R B L)
--- | --- | --- | --- | --- | ---
main | 1920px | block | none | normal | 0px 0px 0px 0px
article | 1920px | block | none | normal | 0px 0px 0px 0px
footer | 1920px | block | none | normal | 0px 0px 0px 0px

## Responsive conditions

- `(width &lt;= 999.98px)`
- `(width &lt;= 689.98px)`
- `(width &gt;= 690px) and (width &lt;= 999.98px)`
- `(width &gt;= 1000px)`
- `(hover: hover)`
- `(width &lt;= 479.98px)`
- `(hover: hover) and (prefers-reduced-motion: no-preference)`
- `(width &gt;= 690px)`
- `(width &gt;= 480px)`
- `(any-hover: hover)`
- `(any-hover: none)`
- `(prefers-reduced-motion: reduce)`
- `(max-width: 999.98px)`
- `(max-width: 689.98px)`
- `screen and (prefers-reduced-motion: reduce)`
- `(min-resolution: 192dpi)`
- `screen and (max-width: 600px)`
- `not (prefers-reduced-motion)`
- `(min-width: 960px)`
- `(min-width: 1000px)`

## CSS custom properties

Names and values read from the root element; no new token names or ramps were generated.

Property | Value
--- | ---
--wp--preset--gradient--mole-hall | linear-gradient(340deg, #616161 0%, #9bc5c3 100%)
--wp--preset--color--palette-color-6 | #dcdfe3
--theme-form-field-border-initial-color | #c8c9cc
--theme-font-family | Dosis, Sans-Serif
--wp-admin-theme-color-darker-20 | #005a87
--wp--preset--font-size--large | clamp(22px, 1.375rem + ((1vw - 3.2px) * 0.625), 30px)
--wp--preset--shadow--outlined | 6px 6px 0px -3px rgb(255, 255, 255), 6px 6px rgb(0, 0, 0)
--wp--preset--gradient--purple-division | linear-gradient(to top, #7028e4 0%, #e5b2ca 100%)
--wp--preset--gradient--light-green-cyan-to-vivid-green-cyan | linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)
--wp--preset--gradient--deep-blue | linear-gradient(to right, #6a11cb 0%, #2575fc 100%)
--theme-palette-color-7 | #ffffff
--wp--preset--gradient--blush-light-purple | linear-gradient(135deg,rgb(255,206,236) 0%,rgb(152,150,240) 100%)
--wp--preset--color--vivid-purple | #9b51e0
--wp--preset--gradient--young-passion | linear-gradient(to right, #ff8177 0%, #ff867a 0%, #ff8c7f 21%, #f99185 52%, #cf556c 78%, #b12a5b 100%)
--wp-bound-block-color | #7a00df
--theme-button-padding | 5px 20px
--wp--preset--gradient--fabled-sunset | linear-gradient(135deg, #231557 0%, #44107A 29%, #FF1361 67%, #FFF800 100%)
--wp--preset--gradient--electric-grass | linear-gradient(135deg,rgb(202,248,128) 0%,rgb(113,206,126) 100%)
--theme-button-text-initial-color | #131313
--wp--preset--gradient--blush-bordeaux | linear-gradient(135deg,rgb(254,205,165) 0%,rgb(254,45,45) 50%,rgb(107,0,62) 100%)
--wp--preset--gradient--cold-evening | linear-gradient(to top, #0c3483 0%, #a2b6df 100%, #6b8cce 100%, #a2b6df 100%)
--wp--preset--shadow--deep | 12px 12px 50px rgba(0, 0, 0, 0.4)
--wp--preset--gradient--plum-bath | linear-gradient(to top, #cc208e 0%, #6713d2 100%)
--wp--preset--gradient--teen-party | linear-gradient(135deg, #FF057C 0%, #8D0B93 50%, #321575 100%)
--theme-text-color | #131313
--theme-form-selection-field-initial-color | #c8c9cc
--wp--preset--gradient--wild-apple | linear-gradient(to top, #d299c2 0%, #fef9d7 100%)
--false | ""
--theme-palette-color-6 | #dcdfe3
--theme-normal-container-max-width | 1350px
--wp--preset--gradient--juicy-peach | linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)
--wp--preset--gradient--new-retrowave | linear-gradient(to top, #3b41c5 0%, #a981bb 49%, #ffc8a9 100%)
--wp--preset--font-family--bungee | Bungee
--theme-button-background-hover-color | #5e3fde
--wp--preset--gradient--angel-care | linear-gradient(135deg, #FFE29F 0%, #FFA99F 48%, #FF719A 100%)
--theme-selection-text-color | #131313
--wp-admin-theme-color-darker-20--rgb | 0,90,135
--wp--preset--gradient--juicy-cake | linear-gradient(to top, #e14fad 0%, #f9d423 100%)
--wp-admin-theme-color--rgb | 0,124,186
--wp--preset--spacing--40 | 1rem
--wp--preset--gradient--everlasting-sky | linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)
--theme-selection-background-color | rgba(190, 62, 222, 0.31)
--wp--preset--color--luminous-vivid-orange | #ff6900
--wp--preset--gradient--true-sunset | linear-gradient(to right, #fa709a 0%, #fee140 100%)
--wp--preset--gradient--strong-bliss | linear-gradient(to right, #f78ca0 0%, #f9748f 19%, #fd868c 60%, #fe9a8b 100%)
--wp--preset--color--palette-color-1 | #ff24aa
--swiper-theme-color | #007aff
--theme-palette-color-4 | #131313
--wp--preset--gradient--vivid-cyan-blue-to-vivid-purple | linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)
--theme-container-edge-spacing | 90vw
--theme-transition | all 0.12s cubic-bezier(0.455, 0.03, 0.515, 0.955)
--theme-container-width-base | calc(90vw - 0px * 2)
--theme-content-vertical-spacing | 20px
--vacb-accent-contrast | #fff
--wp--preset--font-size--xx-large | clamp(45px, 2.813rem + ((1vw - 3.2px) * 2.734), 80px)
--theme-button-font-weight | 500
--vacb-transition | 180ms ease
--wp-admin-theme-color-darker-10--rgb | 0,107,160.5
--wp--preset--color--vivid-cyan-blue | #0693e3
--wp--preset--shadow--natural | 6px 6px 9px rgba(0, 0, 0, 0.2)

## Capture coverage

- 0 stylesheet(s) could not be inspected. Computed styles are still measured.
- Sampling excludes hidden elements and Sitepeel tools. Offscreen rendered elements may be included. Counts refer to the sample, not the entire website.
- Colors are CSS values, not a screenshot pixel palette. Images, compositing and gradients can affect their visible appearance.
- Hover, focus, active states, other viewport sizes, iframe documents and shadow trees need separate captures.
- No inferred brand personality, invented colors, placeholder copy or unobserved code is presented as a page measurement.
