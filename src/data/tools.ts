export interface Tool {
  id: string;
  icon: string;
  title: string;
  description: string;
  href?: string;
}

export const tools: Tool[] = [
  {
    id: "a3f8c1",
    icon: "calculate",
    title: "GPA Calculator",
    description: "Fast, flexible GPA calculation for any grading system.",
    href: "/gpa-calculator",
  },
  {
    id: "b7e2a4",
    icon: "key",
    title: "Password Generator",
    description: "Generate safe and reliable passwords instantly",
    href: "/password-generator",
  },
  {
    id: "c5d1b8",
    icon: "palette",
    title: "Color Converter",
    description: "Convert colors between HEX, RGB, HSL, and CMYK formats.",
    href: "/color-converter",
  },
  {
    id: "e2f5b1",
    icon: "notes",
    title: "Word Counter",
    description:
      "Count words, characters, sentences and estimate reading time instantly.",
    href: "/word-counter",
  },
  {
    id: "d9a3e7",
    icon: "straighten",
    title: "Unit Converter",
    description: "Seamless conversion between metric and imperial standards.",
    href: "/unit-converter",
  },
  // {
  //   icon: "currency_exchange",
  //   title: "Currency Converter",
  //   description: "Real-time global exchange rates with architectural precision.",
  // },
  // {
  //   icon: "format_align_left",
  //   title: "Text Formatter",
  //   description: "Sanitize and structure raw strings for system integration.",
  // },
  // {
  //   icon: "code",
  //   title: "Base64 Encoder",
  //   description: "Standardized binary-to-text encoding and decoding.",
  // },
];
