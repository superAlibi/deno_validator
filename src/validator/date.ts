import { ExecuteValidator } from '../interface.ts';
import rules from '../rule/index.ts';
import { isEmptyValue } from '../util.ts';

const date: ExecuteValidator = (rule, value, callback, source, options) => {
  // console.log('integer rule called %j', rule);
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && Object.prototype.hasOwnProperty.call(source, rule?.field || ''));
  // console.log('validate on %s value', value);
  if (validate) {
    if (isEmptyValue(value, 'date') && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value, 'date')) {
      let dateObject;

      if (value instanceof Date) {
        dateObject = value;
      } else {
        dateObject = new Date(value);
      }

      rules.type(rule, dateObject, source, errors, options);
      if (dateObject) {
        rules.range(rule, dateObject.getTime(), source, errors, options);
      }
    }
  }
  callback(errors);
};

export default date;
