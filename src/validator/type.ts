import { ExecuteValidator } from "../interface.ts";
import rules from "../rule/index.ts";
import { isEmptyValue } from "../util.ts";

const typeValidator: ExecuteValidator = (
  rule,
  value,
  callback,
  source,
  options,
) => {
  const ruleType = rule.type;
  const errors: string[] = [];

  const validate = rule.required ||
    (!rule.required &&
      Object.prototype.hasOwnProperty.call(source, rule?.field || ""));
  if (validate) {
    if (isEmptyValue(value, ruleType) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, ruleType);
    if (!isEmptyValue(value, ruleType)) {
      rules.type(rule, value, source, errors, options);
    }
  }
  return callback(errors);
};

export default typeValidator;
