import {
  complementError,
  convertFieldsError,
  format,
  mergeMessage,
  validateWrapper,
  warning,
} from "./util.ts";
import validators from "./validator/index.ts";
import { messages as defaultMessages, newMessages } from "./messages.ts";
import {
  ExecuteValidator,
  InternalRuleItem,
  InternalValidateMessages,
  Rule,
  RuleItem,
  RuleValuePackage,
  SyncErrorType,
  ValidateCallback,
  ValidateError,
  ValidateFieldsError,
  ValidateMessages,
  ValidateOption,
  ValidateResult,
  Values,
} from "./interface.ts";
import type from "./rule/type.ts";
export * from "./interface.ts";

/**
 *  Encapsulates a validation schema.
 *
 *  @param descriptor An object declaring validation rules
 *  for this schema.
 */
class Schema {
  // ========================= Static =========================
  static register(type: string, validator: ExecuteValidator) {
    if (typeof validator !== "function") {
      throw new Error(
        "Cannot register a validator by type, validator is not a function",
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
      throw new Error("Cannot configure a schema with no rules");
    }
    if (typeof rules !== "object" || Array.isArray(rules)) {
      throw new Error("Rules must be an object");
    }
    Object.entries(rules).forEach(([k, v]) => {
      this.rules[k] = Array.isArray(v) ? v : [v];
    });
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
  #romatRules(
    options: ValidateOption,
    source: Values,
  ): Record<string, RuleValuePackage[]> {
    const series: Record<string, RuleValuePackage[]> = {};
    // get need validator keys
    const keys = options.keys || Object.keys(this.rules);
    keys.forEach((z: string) => {
      const proRules: RuleItem[] = this.rules[z];
      let value = source[z];
      proRules.forEach((r) => {
        let rule: InternalRuleItem = r;
        if (typeof rule.transform === "function") {
          value = source[z] = rule.transform(value);
        }
        // 属性校验的对象本身还可以是函数,但是类型并未给出,后面应该补充
        if (typeof rule === "function") {
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
        rule.fieldPathStr = rule.fieldPathStr || z;
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
    return series;
  }
  validate(
    source: Values,
    option?: ValidateOption,
    callback?: ValidateCallback,
  ): Promise<Values>;
  validate(source: Values, callback: ValidateCallback): Promise<Values>;
  validate(source: Values): Promise<Values>;

  validate(
    source_: Values,
    o: ValidateOption | ValidateCallback = {},
    oc: ValidateCallback = () => { },
  ): Promise<Values> {
    const source: Values = source_,
      oisf = typeof o === "function",
      options: ValidateOption = oisf ? {} : o,
      callback: ValidateCallback = oisf ? o : oc;

    /**
     * 没有规则,则表示全部通过
     */
    if (!Object.keys(this.rules).length) {
      if (callback) {
        callback(null, source);
      } else {
        return Promise.resolve(source);
      }
    }

    // 合并传入的message模板
    options.messages = options.messages
      ? mergeMessage(this.messages(), options.messages)
      : this.messages();
    // 给出包装过的规则校验
    const series: Record<string, RuleValuePackage[]> = this.#romatRules(
      options,
      source,
    );

    function onValidatorFinished(errors: ValidateError[]) {
      if (!errors?.length) {
        return callback(null, source);
      } else {
        return callback(errors, convertFieldsError(errors));
      }
    }

    return validateWrapper(
      series,
      options,
      async (ruleValuePack): Promise<ValidateError[]> => {
        const data = ruleValuePack;
        const rule = data.rule;
        let deep = (rule.type === "object" || rule.type === "array") &&
          (typeof rule.fields === "object" ||
            typeof rule.defaultField === "object");
        // deep = deep && Boolean(rule.required || data.value);
        deep = deep && Boolean(rule.required || (!rule.required && data.value));
        rule.field = data.field;

        async function cb(
          e: SyncErrorType | SyncErrorType[] = [],
        ): Promise<ValidateError[]> {
          const errorList: SyncErrorType[] = Array.isArray(e) ? e : [e];
          if (!options.suppressWarning && errorList.length) {
            Schema.warning("async-validator:", errorList);
          }
          if (errorList.length && rule.message) {
            const { message } = rule,
              msgstr = typeof message === "string";
            errorList.push(msgstr ? message : message(""));
          }

          // Fill error info
          let filledErrors = errorList.map(complementError(rule, source));

          // 如果检测到错误,且因为发现错误立马停止的错误,就立即返回
          if (options.first && filledErrors.length) {
            return (filledErrors);
          }
          // 是否需要深度校验
          if (!deep) {
            return (filledErrors);
          }
          // if rule is required but the target object
          // does not exist fail at the rule level and don't
          // go deeper
          if (rule.required && !data.value) {
            if (rule.message !== undefined) {
              filledErrors = [complementError(rule, source)(rule.message)];
            } else if (options.error) {
              filledErrors = [
                options.error(
                  rule,
                  format(options.messages?.required || "", rule.field),
                ),
              ];
            }
            return (filledErrors);
          }

          // ================================>>为深度校验准备对象开始
          let fieldsSchema: Record<string, Rule> = {};
          // 如果有默认规则,先储存默认的校验
          if (rule.defaultField) {
            Object.entries(data.value).forEach(([key]) => {
              fieldsSchema[key] = rule.defaultField || [];
            });
          }
          // 在有强规则的情况下,复写默认规则
          fieldsSchema = {
            ...fieldsSchema,
            ...data.rule.fields,
          };
          const paredFieldsSchema: Record<string, RuleItem[]> = {};

          Object.entries(fieldsSchema).forEach(([field, fieldSchema]) => {
            const fieldSchemaList = Array.isArray(fieldSchema)
              ? fieldSchema
              : [fieldSchema];
            paredFieldsSchema[field] = fieldSchemaList.map(
              (schema: RuleItem) => {
                return {
                  ...schema,
                  fieldPathStr: [rule.fieldPathStr, field].join("."),
                  fieldPathArr: Array.isArray(rule.fieldPathArr)
                    ? rule.fieldPathArr.concat(field)
                    : [field],
                };
              },
            );
          });
          // 为深度校验准备对象结束<<================================
          const schema = new Schema(paredFieldsSchema);
          schema.messages(options.messages);

          // 可能出现的逻辑错误
          // 父级复写子级?
          if (rule.options) {
            rule.options.messages = options.messages;
            rule.options.error = options.error;
          }
          // 为啥这里又是子级优先?
          return schema.validate(data.value, rule.options || options).then(
            (e) => e,
            (e) => e,
          );
        }

        const validator = rule.asyncValidator || rule.validator!;
        // if (!validator) return Promise.resolve([]);
        try {
          const res = await validator(
            rule,
            data.value,
            cb,
            data.source,
            options,
          );

          if (res === true) {
            return cb([]);
          } else if (res === false) {
            return cb(
              typeof rule.message === "function"
                ? rule.message(rule.fieldPathStr || rule.field)
                : rule.message || `${rule.fieldPathStr || rule.field} fails`,
            );
          } else if (Array.isArray(res)) {
            return cb(res)
          } else if (res instanceof Error) {
            return cb(res.message);
          }
          return [];
        } catch (error) {
          console.error(error);
          // rethrow to report error
          if (!options.suppressValidatorError) {
            return Promise.reject(error);
          }
          return cb(error.message);
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
      rule.type = "pattern";
    }
    if (
      typeof rule.validator !== "function" &&
      rule.type &&
      !Object.prototype.hasOwnProperty.call(validators, rule.type)
    ) {
      throw new Error(format("Unknown rule type %s", rule.type));
    }
    return rule.type || "string";
  }

  getValidationMethod(rule: InternalRuleItem) {
    if (typeof rule.validator === "function") {
      return rule.validator;
    }
    const keys = Object.keys(rule);
    const messageIndex = keys.indexOf("message");
    if (messageIndex !== -1) {
      // why did delete message
      keys.splice(messageIndex, 1);
    }
    if (keys.length === 1 && keys[0] === "required") {
      return validators.required;
    }
    return validators[this.getType(rule)];
  }
}

export default Schema;
