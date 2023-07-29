import { ExecuteValidator } from "../interface.ts";
import rules from "../rule/index.ts";

const array: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const validate = rule.required ||
    (!rule.required &&
      Object.prototype.hasOwnProperty.call(source, rule?.field || ""));
  if (validate) {
    if ((value === undefined || value === null) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, "array");
    if (value !== undefined && value !== null) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  return callback(errors);
};

export default array;
