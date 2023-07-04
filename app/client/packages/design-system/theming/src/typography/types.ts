import type { fontMetrics } from "./typography";

// we use "as const" here because we need to iterate by variants of typography
export const TypographyVariant = {
  footnote: "footnote",
  body: "body",
  caption: "caption",
  subtitle: "subtitle",
  title: "title",
  heading: "heading",
} as const;

// we use "as const" here because we need to iterate by types of typography
export const TypographyType = {
  default: "default",
  neutral: "neutral",
  positive: "positive",
  negative: "negative",
  warn: "warn",
} as const;

export type FontFamily = keyof typeof fontMetrics;

export type TypographyVariantMetric = {
  capHeight: number;
  lineGap: number;
  fontFamily?: FontFamily;
};

export type Typography = {
  [key in keyof typeof TypographyVariant]: TypographyVariantMetric;
};
