import {
  format,
  complementError,
  asyncMap,
  warning,
  mergeMessage,
  convertFieldsError,
} from './util.ts';
import validators from './validator/index.ts';
import { messages as defaultMessages, newMessages } from './messages.ts';
import {
  InternalRuleItem,
  InternalValidateMessages,
  Rule,
  RuleItem,
  ValidateCallback,
  ValidateMessages,
  ValidateOption,
  Values,
  RuleValuePackage,
  ValidateError,
  ValidateFieldsError,
  SyncErrorType,
  ValidateResult,
  ExecuteValidator,
} from './interface.ts';
export * from './interface.ts';

/**
 *  Encapsulates a validation schema.
 *
 *  @param descriptor An object declaring validation rules
 *  for this schema.
 */
class Schema {
  // ========================= Static =========================
  static register(type: string, validator: ExecuteValidator) {
    if (typeof validator !== 'function') {
      throw new Error(
        'Cannot register a validator by type, validator is not a function',
      );
    }
    validators[type] = validator;
  }

  static warning = warning;

  static messages = defaultMessages;

  static validators = validators;

  // ======================== Instance ========================
  rules: Record<string, RuleItem[]> = {};
  _messages: InternalValidateMessages = defaultMessages;

  constructor(descriptor: Record<string, Rule>) {
    this.define(descriptor);
  }

  define(rules: Record<string, Rule>) {
    if (!rules) {
      throw new Error('Cannot configure a schema with no rules');
    }
    if (typeof rules !== 'object' || Array.isArray(rules)) {
      throw new Error('Rules must be an object');
    }
    Object.entries(rules).forEach(([k, v]) => {
      this.rules[k] = Array.isArray(v) ? v : [v]
    })
  }

  /**
   * 生成错误消息模板
   * 在验证出现错误时会取用模板消息
   * @param messages 可选的重写模板消息
   * @returns 
   */
  messages(messages?: ValidateMessages) {
    if (messages) {
      this._messages = mergeMessage(newMessages(), messages);
    }
    return this._messages;
  }
  getRuleValuePackageMap(options: ValidateOption, source: Values): Record<string, RuleValuePackage[]> {
    const series: Record<string, RuleValuePackage[]> = {}
    // get need validator keys
    const keys = options.keys || Object.keys(this.rules);
    keys.forEach((z: string) => {
      const proRules: RuleItem[] = this.rules[z];
      let value = source[z];
      proRules.forEach(r => {
        let rule: InternalRuleItem = r;
        // 属性校验的对象本身还可以是函数,但是类型并未给出,后面应该补充
        if (typeof rule.transform === 'function') {
          value = source[z] = rule.transform(value);
        }
        if (typeof rule === 'function') {
          rule = {
            validator: rule,
          };
        } else {
          // 克隆,因为后面会修改rule,避免产生用户端副作用
          rule = { ...rule };
        }

        // Fill validator. Skip if nothing need to validate
        rule.validator = this.getValidationMethod(rule);
        if (!rule.validator) {
          return;
        }

        rule.field = z;
        rule.fullField = rule.fullField || z;
        rule.type = this.getType(rule);
        series[z] = series[z] || [];
        series[z].push({
          rule,
          value,
          source,
          field: z,
        });
      });
    });
    return series
  }
  validate(
    source: Values,
    option?: ValidateOption,
    callback?: ValidateCallback,
  ): Promise<Values>;
  validate(source: Values, callback: ValidateCallback): Promise<Values>;
  validate(source: Values): Promise<Values>;

  validate(source_: Values, o: ValidateOption | ValidateCallback = {}, oc: ValidateCallback = () => { }): Promise<Values> {
    const source: Values = source_,
      oisf = typeof o === 'function',
      options: ValidateOption = oisf ? {} : o,
      callback: ValidateCallback = oisf ? o : oc

    /**
     * 没有规则,则表示全部通过 
     */
    if (!Object.keys(this.rules).length) {
      if (callback) {
        callback(null, source);
      }
      return Promise.resolve(source);
    }

    // 合并传入的message模板
    options.messages = options.messages ? mergeMessage(this.messages(), options.messages) : this.messages();
    // 给出包装过的规则校验
    const series: Record<string, RuleValuePackage[]> = this.getRuleValuePackageMap(options, source);

    const errorFields: Record<string, number> = {};
    function onValidatorFinished(results: (ValidateError | ValidateError[])[]) {
      const errors: ValidateError[] = results.reduce<ValidateError[]>((pre, curr) => {
        if (Array.isArray(curr)) {
          return pre.concat(curr);
        }
        pre.push(curr);
        return pre
      }, []);
      let fields: ValidateFieldsError = {};

      if (!errors.length) {
        callback(null, source);
      } else {
        fields = convertFieldsError(errors);
        (callback as (
          errors: ValidateError[],
          fields: ValidateFieldsError,
        ) => void)(errors, fields);
      }
    }
    return asyncMap(
      series,
      options,
      (ruleValuePack, failureHandler) => {
        const data = ruleValuePack
        const rule = data.rule;
        let deep =
          (rule.type === 'object' || rule.type === 'array') &&
          (typeof rule.fields === 'object' ||
            typeof rule.defaultField === 'object');
        deep = deep && (rule.required || (!rule.required && data.value));
        rule.field = data.field;

        function addFullField(key: string, schema: RuleItem) {
          return {
            ...schema,
            fullField: `${rule.fullField}.${key}`,
            fullFields: rule.fullFields ? [...rule.fullFields, key] : [key],
          };
        }

        function cb(e: SyncErrorType | SyncErrorType[] = []) {
          let errorList = Array.isArray(e) ? e : [e];
          if (!options.suppressWarning && errorList.length) {
            Schema.warning('async-validator:', errorList);
          }
          if (errorList.length && rule.message) {
            errorList = [].concat(rule.message);
          }

          // Fill error info
          let filledErrors = errorList.map(complementError(rule, source));

          if (options.first && filledErrors.length) {
            errorFields[rule.field!] = 1;
            return failureHandler(filledErrors);
          }
          if (!deep) {
            failureHandler(filledErrors);
          } else {
            // if rule is required but the target object
            // does not exist fail at the rule level and don't
            // go deeper
            if (rule.required && !data.value) {
              if (rule.message !== undefined) {
                filledErrors = []
                  .concat(rule.message)
                  .map(complementError(rule, source));
              } else if (options.error) {
                filledErrors = [
                  options.error(
                    rule,
                    format(options.messages?.required || '', rule.field),
                  ),
                ];
              }
              return failureHandler(filledErrors);
            }

            let fieldsSchema: Record<string, Rule> = {};
            if (rule.defaultField) {
              Object.keys(data.value).map(key => {
                fieldsSchema[key] = rule.defaultField;
              });
            }
            fieldsSchema = {
              ...fieldsSchema,
              ...data.rule.fields,
            };

            const paredFieldsSchema: Record<string, RuleItem[]> = {};

            Object.keys(fieldsSchema).forEach(field => {
              const fieldSchema = fieldsSchema[field];
              const fieldSchemaList = Array.isArray(fieldSchema)
                ? fieldSchema
                : [fieldSchema];
              paredFieldsSchema[field] = fieldSchemaList.map(
                addFullField.bind(null, field),
              );
            });
            const schema = new Schema(paredFieldsSchema);
            schema.messages(options.messages);
            if (data.rule.options) {
              data.rule.options.messages = options.messages;
              data.rule.options.error = options.error;
            }
            schema.validate(data.value, data.rule.options || options, errs => {
              const finalErrors = [];
              if (filledErrors && filledErrors.length) {
                finalErrors.push(...filledErrors);
              }
              if (errs && errs.length) {
                finalErrors.push(...errs);
              }
              failureHandler(finalErrors?.length ? finalErrors : null);
            });
          }
        }

        let res: ValidateResult;
        if (rule.asyncValidator) {
          res = rule.asyncValidator(rule, data.value, cb, data.source, options);
        } else if (rule.validator) {
          try {
            res = rule.validator(rule, data.value, cb, data.source, options);
          } catch (error) {
            console.error?.(error);
            // rethrow to report error
            if (!options.suppressValidatorError) {
              setTimeout(() => {
                throw error;
              }, 0);
            }
            cb(error.message);
          }
          if (res === true) {
            cb();
          } else if (res === false) {
            cb(
              typeof rule.message === 'function'
                ? rule.message(rule.fullField || rule.field)
                : rule.message || `${rule.fullField || rule.field} fails`,
            );
          } else if (Array.isArray(Array)) {
            cb(res);
          } else if (res instanceof Error) {
            cb(res.message);
          }
        }
        if (res && (res as Promise<void>).then) {
          (res as Promise<void>).then(
            () => cb(),
            e => cb(e),
          );
        }
      },
      onValidatorFinished,
      source,
    );
  }

  /**
   * 给出校验类型
   * @param rule 
   * @returns 
   */
  getType(rule: InternalRuleItem) {
    if (rule.type === undefined && rule.pattern instanceof RegExp) {
      rule.type = 'pattern';
    }
    if (
      typeof rule.validator !== 'function' &&
      rule.type &&
      !Object.prototype.hasOwnProperty.call(validators, rule.type)
    ) {
      throw new Error(format('Unknown rule type %s', rule.type));
    }
    return rule.type || 'string';
  }

  getValidationMethod(rule: InternalRuleItem) {
    if (typeof rule.validator === 'function') {
      return rule.validator;
    }
    const keys = Object.keys(rule);
    const messageIndex = keys.indexOf('message');
    if (messageIndex !== -1) {
      // why did delete message
      keys.splice(messageIndex, 1);
    }
    if (keys.length === 1 && keys[0] === 'required') {
      return validators.required;
    }
    return validators[this.getType(rule)];
  }
}

export default Schema;
