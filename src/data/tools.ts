export type ToolCategory =
  | "text"
  | "converter"
  | "calculator"
  | "formatter"
  | "generator"
  | "encoder-decoder"
  | "tester";

export const categoryMeta: Record<
  ToolCategory,
  { label: string; icon: string }
> = {
  text: { label: "Text", icon: "format_size" },
  converter: { label: "Converter", icon: "sync_alt" },
  calculator: { label: "Calculator", icon: "calculate" },
  formatter: { label: "Formatter", icon: "data_object" },
  generator: { label: "Generator", icon: "generating_tokens" },
  "encoder-decoder": { label: "Encoder/Decoder", icon: "code" },
  tester: { label: "Tester", icon: "bug_report" },
};

export interface Tool {
  id: string;
  icon: string;
  title: string;
  description: string;
  href?: string;
  category: ToolCategory;
}

export const tools: Tool[] = [
  {
    id: "a3f8c1",
    icon: "calculate",
    title: "GPA Calculator",
    description: "Fast, flexible GPA calculation for any grading system.",
    href: "/gpa-calculator",
    category: "calculator",
  },
  {
    id: "b7e2a4",
    icon: "key",
    title: "Password Generator",
    description: "Generate safe and reliable passwords instantly.",
    href: "/password-generator",
    category: "generator",
  },
  {
    id: "c5d1b8",
    icon: "palette",
    title: "Color Converter",
    description: "Convert colors between HEX, RGB, HSL, and CMYK formats.",
    href: "/color-converter",
    category: "converter",
  },
  {
    id: "e2f5b1",
    icon: "notes",
    title: "Word Counter",
    description:
      "Count words, characters, sentences and estimate reading time instantly.",
    href: "/word-counter",
    category: "text",
  },
  {
    id: "d9a3e7",
    icon: "straighten",
    title: "Unit Converter",
    description: "Seamless conversion between metric and imperial standards.",
    href: "/unit-converter",
    category: "converter",
  },
  {
    id: "f1c4d2",
    icon: "data_object",
    title: "JSON Formatter",
    description:
      "Validate, beautify, minify, and generate TypeScript interfaces from JSON.",
    href: "/json-formatter",
    category: "formatter",
  },
  {
    id: "a8c3f2",
    icon: "code",
    title: "Base64 Encoder/Decoder",
    description: "Encode text to Base64 or decode to readable content.",
    href: "/base64-encoder-decoder",
    category: "encoder-decoder",
  },
  {
    id: "b2e9f4",
    icon: "payments",
    title: "Loan Calculator",
    description:
      "Calculate monthly payments, total interest, and full amortization schedule for any loan.",
    href: "/loan-calculator",
    category: "calculator",
  },
  {
    id: "c7d4a1",
    icon: "table_convert",
    title: "CSV to JSON Converter",
    description:
      "Convert CSV files or pasted data into structured JSON with configurable parsing rules.",
    href: "/csv-to-json-converter",
    category: "converter",
  },
  {
    id: "d3e8b2",
    icon: "link",
    title: "URL Encoder/Decoder",
    description:
      "Encode plain text or URLs into percent-encoded format, or decode them back instantly.",
    href: "/url-encoder-decoder",
    category: "encoder-decoder",
  },
  {
    id: "e1f7c3",
    icon: "match_case",
    title: "Case Converter",
    description:
      "Transform text between UPPER, lower, Proper, Sentence, Capitalized, and iNVERSE cases.",
    href: "/case-converter",
    category: "text",
  },
  {
    id: "f4a2d9",
    icon: "markdown",
    title: "HTML to Markdown Converter",
    description:
      "Convert HTML markup into Markdown for documentation and codebases.",
    href: "/html-to-markdown",
    category: "converter",
  },
  {
    id: "g5b3c8",
    icon: "security",
    title: "JWT Decoder",
    description:
      "Decode and inspect JSON Web Token headers, payloads, and validate structure instantly.",
    href: "/jwt-decoder",
    category: "encoder-decoder",
  },
  {
    id: "h2k9m4",
    icon: "tag",
    title: "UUID Generator",
    description:
      "Generate unique v4 UUIDs instantly — single or in bulk up to 1000.",
    href: "/uuid-generator",
    category: "generator",
  },
  {
    id: "i6n3p7",
    icon: "link",
    title: "URL Parser",
    description:
      "Deconstruct any URL into protocol, host, path, query parameters, and hash.",
    href: "/url-parser",
    category: "converter",
  },
  {
    id: "j4r7t2",
    icon: "filter_list",
    title: "Remove Duplicate Lines",
    description:
      "Remove duplicate lines instantly, with options for case sensitivity, trimming, and sorting.",
    href: "/remove-duplicate-lines",
    category: "text",
  },
  {
    id: "k8s2v5",
    icon: "tag",
    title: "Hash Generator",
    description:
      "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from any text instantly.",
    href: "/hash-generator",
    category: "generator",
  },
  {
    id: "l3m7n1",
    icon: "manage_search",
    title: "Regex Tester",
    description:
      "Test and debug regular expressions with match highlighting and flag toggles.",
    href: "/regex-tester",
    category: "tester",
  },
  {
    id: "m4p8q2",
    icon: "sort",
    title: "Text Sorter",
    description:
      "Sort lines alphabetically, by length, in reverse, or randomly with flexible options.",
    href: "/text-sorter",
    category: "text",
  },
  {
    id: "n5q9r3",
    icon: "article",
    title: "Lorem Ipsum Generator",
    description:
      "Generate placeholder text by paragraphs, sentences or words instantly.",
    href: "/lorem-generator",
    category: "generator",
  },
  {
    id: "o6r0s4",
    icon: "database",
    title: "SQL Formatter",
    description:
      "Beautify, minify, or strip comments from SQL queries with syntax highlighting.",
    href: "/sql-formatter",
    category: "formatter",
  },

  {
    id: "p7s1t5",
    icon: "gradient",
    title: "CSS Gradient Generator",
    description:
      "Build linear and radial gradients visually and copy CSS instantly.",
    href: "/css-gradient-generator",
    category: "generator",
  },
  {
    id: "q8t2u6",
    icon: "table_rows",
    title: "Random Data Generator",
    description:
      "Generate realistic fake data for testing — export as CSV, JSON, or SQL instantly.",
    href: "/random-data-generator",
    category: "generator",
  },
  {
    id: "r9u3v7",
    icon: "memory",
    title: "Bitwise Calculator",
    description:
      "Execute AND, OR, XOR, NOT and shift operations with full binary visualization.",
    href: "/bitwise-calculator",
    category: "calculator",
  },
];
