import { ExecuteValidator } from "../interface.ts";
import rules from "../rule/index.ts";
import { isEmptyValue } from "../util.ts";

const ENUM = "enum" as const;

const enumerable: ExecuteValidator = (
  rule,
  value,
  callback,
  source,
  options,
) => {
  const errors: string[] = [];
  const validate = rule.required ||
    (!rule.required &&
      Object.prototype.hasOwnProperty.call(source, rule?.field || ""));
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules[ENUM](rule, value, source, errors, options);
    }
  }
  return callback(errors);
};

export default enumerable;
