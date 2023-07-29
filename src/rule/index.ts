import required from "./required.ts";
import whitespace from "./whitespace.ts";
import typeRule from "./type.ts";
import range from "./range.ts";
import enumRule from "./enum.ts";
import pattern from "./pattern.ts";

export default {
  required,
  whitespace,
  type: typeRule,
  range,
  enum: enumRule,
  pattern,
};
