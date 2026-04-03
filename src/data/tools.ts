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
    description: "Generate safe and reliable passwords instantly.",
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
  {
    id: "f1c4d2",
    icon: "data_object",
    title: "JSON Formatter",
    description:
      "Validate, beautify, minify, and generate TypeScript interfaces from JSON.",
    href: "/json-formatter",
  },
  {
    id: "a8c3f2",
    icon: "code",
    title: "Base64 Encoder/Decoder",
    description: "Encode text to Base64 or decode to readable content.",
    href: "/base64-encoder-decoder",
  },
  {
    id: "b2e9f4",
    icon: "payments",
    title: "Loan Calculator",
    description: "Calculate monthly payments, total interest, and full amortization schedule for any loan.",
    href: "/loan-calculator",
  },
  {
    id: "c7d4a1",
    icon: "table_convert",
    title: "CSV to JSON Converter",
    description: "Convert CSV files or pasted data into structured JSON with configurable parsing rules.",
    href: "/csv-to-json-converter",
  },
  {
    id: "d3e8b2",
    icon: "link",
    title: "URL Encoder/Decoder",
    description: "Encode plain text or URLs into percent-encoded format, or decode them back instantly.",
    href: "/url-encoder-decoder",
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
];
