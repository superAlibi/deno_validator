import { ExecuteValidator } from '../interface.ts';
import rules from '../rule/index.ts';

const required: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const type = Array.isArray(value) ? 'array' : typeof value;
  rules.required(rule, value, source, errors, options, type);
  callback(errors);
};

export default required;
