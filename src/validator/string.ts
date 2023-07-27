import { ExecuteValidator, InternalRuleItem, Values } from '../interface.ts';
import rules from '../rule/index.ts';
import { isEmptyValue } from '../util.ts';

const string: ExecuteValidator = (rule: InternalRuleItem, value, callback, source: Values, options) => {
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && Object.prototype.hasOwnProperty.call(source, rule?.field || ''));
  if (validate) {
    if (isEmptyValue(value, 'string') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, 'string');
    if (!isEmptyValue(value, 'string')) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
      rules.pattern(rule, value, source, errors, options);
      if (rule.whitespace === true) {
        rules.whitespace(rule, value, source, errors, options);
      }
    }
  }
  callback(errors);
};

export default string;
