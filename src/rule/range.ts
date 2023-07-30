import { ExecuteRule } from "../interface.ts";
import { format } from "../util.ts";

const range: ExecuteRule = (rule, value, source, errors, options) => {
  const lenISNum = typeof rule.len === "number",
    minISNum = typeof rule.min === "number",
    maxISNum = typeof rule.max === "number",
    visNum = typeof value === "number",
    visStr = typeof value === "string",
    visArr = Array.isArray(value);
  // 正则匹配码点范围从U+010000一直到U+10FFFF的文字（补充平面Supplementary Plane）
  const spRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  let val = value;
  const key: "number" | "string" | "array" = visNum
    ? "number"
    : visStr
    ? "string"
    : "array";

  // if the value is not of a supported type for range validation
  // the validation rule rule should use the
  // type property to also test for a particular type
  if (!key) {
    return false;
  }
  if (visArr) {
    val = value.length;
  }
  if (visStr) {
    // 处理码点大于U+010000的文字length属性不准确的bug，如"𠮷𠮷𠮷".length !== 3
    val = value.replace(spRegexp, "_").length;
  }
  const messages = options.messages!;
  if (lenISNum) {
    if (val !== rule.len) {
      errors.push(
        format(options.messages?.[key]?.len || "", rule.fieldPathStr, rule.len),
      );
    }
  } else if (minISNum && !maxISNum && val < rule.min!) {
    errors.push(format(messages[key]!.min, rule.fieldPathStr, rule.min));
  } else if (maxISNum && !minISNum && val > rule.max!) {
    errors.push(format(messages[key]!.max!, rule.fieldPathStr, rule.max));
  } else if (minISNum && maxISNum && (val < rule.min! || val > rule.max!)) {
    errors.push(
      format(
        options.messages?.[key]!.range,
        rule.fieldPathStr,
        rule.min,
        rule.max,
      ),
    );
  }
};

export default range;
