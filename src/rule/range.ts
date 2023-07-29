import { ExecuteRule } from "../interface.ts";
import { format } from "../util.ts";

const range: ExecuteRule = (rule, value, source, errors, options) => {
  const len = typeof rule.len === "number";
  const min = typeof rule.min === "number";
  const max = typeof rule.max === "number";
  // 正则匹配码点范围从U+010000一直到U+10FFFF的文字（补充平面Supplementary Plane）
  const spRegexp = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  let val = value;
  let key = null;
  const visNum = typeof value === "number",
    visStr = typeof value === "string",
    visArr = Array.isArray(value);

  if (visNum) {
    key = "number";
  } else if (visStr) {
    key = "string";
  } else if (visArr) {
    key = "array";
  }
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
  if (len) {
    if (val !== rule.len) {
      errors.push(
        format(options.messages?.[key]?.len || "", rule.fieldPathStr, rule.len),
      );
    }
  } else if (min && !max && val < rule?.min) {
    errors.push(format(options.messages[key].min, rule.fieldPathStr, rule.min));
  } else if (max && !min && val > rule.max) {
    errors.push(format(options.messages[key].max, rule.fieldPathStr, rule.max));
  } else if (min && max && (val < rule.min || val > rule.max)) {
    errors.push(
      format(
        options.messages[key].range,
        rule.fieldPathStr,
        rule.min,
        rule.max,
      ),
    );
  }
};

export default range;
