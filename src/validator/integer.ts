import { ExecuteValidator } from '../interface.ts';
import rules from '../rule/index.ts';
import { isEmptyValue } from '../util.ts';

const integer: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && Object.prototype.hasOwnProperty.call(source, rule?.field || ''));
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export default integer;
