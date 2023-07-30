// import { format } from 'https://deno.land/std@0.195.0/assert/_format.ts';
import {
  InternalRuleItem,
  RuleValuePackage,
  SyncErrorType,
  ValidateError,
  ValidateOption,
  Value,
  Values,
} from "./interface.ts";
import { sprintf } from "fmt";
// const formatRegExp = /%[sdj%]/g;

const ASYNC_VALIDATOR_NO_WARNING = Deno.env.get("ASYNC_VALIDATOR_NO_WARNING"),
  productionMode = Deno.env.get("production") === "true";
type WarningFunc = (type: string, errors: SyncErrorType[]) => void;
function getWaring(): WarningFunc {
  if (productionMode) return () => {};
  // don't print warning message when in production env or node runtime
  return (type, errors) => {
    if (console?.warn && ASYNC_VALIDATOR_NO_WARNING) {
      if (errors.every((e) => typeof e === "string")) {
        console.warn(type, errors);
      }
    }
  };
}
export const warning = getWaring();

/**
 * 将扁平化的错误消息按照字段分组后返回
 * Group flattened error messages by fields and return
 * @param errors
 * @returns
 */
export function convertFieldsError(
  errors: ValidateError[],
) {
  const fields: Record<string, ValidateError[]> = {};
  if (!errors || !errors?.length) return fields;
  errors.forEach((error) => {
    const field = error?.field;
    if (!field) return;
    fields[field] = fields[field] || [];
    fields[field].push(error);
  });
  return fields;
}

/**
 * 用于格式化,类似于c 语言 fmt
 * @param template
 * @param args
 * @returns
 */
/* export function format(
  template: ((...args: any[]) => string) | string,
  ...args: any[]
) {
  const tpIsFunc = (typeof template === 'function'),
    tt = tpIsFunc ? template(args) : template
  return sprintf(tt, ...args)
} */
const formatRegExp = /%[sdj%]/g;
export function format(
  template: ((...args: any[]) => string) | string = "",
  ...args: any[]
): string {
  let i = 0;
  const len = args.length;
  if (typeof template === "function") {
    return template.apply(null, args);
  }
  if (!(typeof template === "string")) return template;
  const str = template.replace(formatRegExp, (x) => {
    if (x === "%%") {
      return "%";
    }
    if (i >= len) {
      return x;
    }
    switch (x) {
      case "%s":
        return String(args[i++]);
      case "%d":
        return (Number(args[i++])).toString();
      case "%j":
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return "[Circular]";
        }
      default:
        return x;
    }
  });
  return str;
}

function isNativeStringType(type?: string) {
  return (
    type === "string" ||
    type === "url" ||
    type === "hex" ||
    type === "email" ||
    type === "date" ||
    type === "pattern"
  );
}

export function isEmptyValue(value: Value, type?: string) {
  if (value === undefined || value === null) {
    return true;
  }
  if (type === "array" && Array.isArray(value) && !value.length) {
    return true;
  }
  if (isNativeStringType(type) && typeof value === "string" && !value) {
    return true;
  }
  return false;
}

export function isEmptyObject(obj: object) {
  return Object.keys(obj).length === 0;
}

/**
 * 校验所有的错误,不会因为中途检测错误而出现终止
 * Verifying all errors will not be terminated due to in-process detection errors
 * @param arr
 * @param recursiveVerification
 * @param onFinished
 */
async function asyncParallelArray(
  arr: RuleValuePackage[],
  recursiveVerification: ValidateFunc,
) {
  const results: ValidateError[] = [];
  for (const iterator of arr) {
    results.push(...(await recursiveVerification(iterator)));
  }
  return results;
}

/**
 * 短路验证:
 * 遇到校验不通过立即停止剩下的校验
 * Stop all verifications if they fail
 * @param arr
 * @param recursiveVerification
 */
async function shortCircuitValidateHandle(
  arr: RuleValuePackage[],
  recursiveVerification: ValidateFunc,
): Promise<ValidateError[]> {
  for (const iterator of arr) {
    const errors = await recursiveVerification(iterator);
    if (errors?.length) {
      return (errors);
    }
  }
  return [];
}

/**
 * 将传入的属性:校验列表映射,打平并依次返回校验列表
 * @param ruleValuePackMap
 * @returns
 */
function flattenObjArr(
  ruleValuePackMap: Record<string, RuleValuePackage[]>,
): RuleValuePackage[] {
  return Object.values(ruleValuePackMap).reduce(
    (pre, arr) => pre.concat(arr),
    [] as RuleValuePackage[],
  );
}

/**
 * 内部错误对象
 */
export class AsyncValidationError /* extends Error */ {
  constructor(
    public errors: ValidateError[],
    public fields: Record<string, ValidateError[]> | null,
  ) {
    // super("Async Validation Error");
  }
}

type ValidateFunc = (
  data: RuleValuePackage,
) => ValidateError[] | Promise<ValidateError[]>;

export async function validateWrapper(
  ruleValuePackMap: Record<string, RuleValuePackage[]>,
  option: ValidateOption,
  recursiveVerification: ValidateFunc,
  source: Values,
  onFinished?: (errors: ValidateError[]) => void,
): Promise<Values> {
  const errors: ValidateError[] = [];
  if (option.shortCircuit) {
    const flattenArr = flattenObjArr(ruleValuePackMap);
    errors.push(
      ...await shortCircuitValidateHandle(
        flattenArr,
        recursiveVerification,
      ),
    );

    return source;
  } else {
    // 收集:当属性第一个校验规则不通过时,就跳过,继而进行下一个字段得规则校验
    const shortCircuitRuleKeys = option.shortCircuitRule === true
      ? Object.keys(ruleValuePackMap)
      : option.shortCircuitRule || [];
    const errorResults: ValidateError[] = [];
    for (const [key, arr] of Object.entries(ruleValuePackMap)) {
      const errors = shortCircuitRuleKeys.includes(key)
        ? await shortCircuitValidateHandle(arr, recursiveVerification)
        : await asyncParallelArray(arr, recursiveVerification);
      errorResults.push(...errors);
    }
  }
  if (errors?.length && onFinished) {
    onFinished(errors);
  } else if (errors.length && !onFinished) {
    return Promise.reject(
      new AsyncValidationError(errors, convertFieldsError(errors)),
    );
  }
  /* onFinished(errorResults);
  if (errorResults.length) {
    return Promise.reject(new AsyncValidationError(errorResults, convertFieldsError(errorResults)))
  } */
  return source;
}

/**
 * 判断是否是错误对象
 * @param obj
 * @returns
 */
function isErrorObj(
  obj: ValidateError | string | (() => string),
): obj is ValidateError {
  if (typeof obj === "string" || typeof obj === "function") return false;

  return !!obj.message;
}

/**
 * 根据路径从source中取值
 * @param value
 * @param path
 * @returns
 */
function getValueFromPath(value: Values, path: string[]) {
  let v = value;
  for (let i = 0; i < path.length; i++) {
    if (v == undefined) {
      return v;
    }
    v = v[path[i]];
  }
  return v;
}

/**
 * 给出格式化以后的错误消息
 * @param rule
 * @param source
 * @returns
 */
export function complementError(rule: InternalRuleItem, source: Values) {
  return (oe: ValidateError | (() => string) | string): ValidateError => {
    let fieldValue;
    const veisObj = isErrorObj(oe);
    if (rule.fieldPathArr) {
      fieldValue = getValueFromPath(source, rule.fieldPathArr);
    } else {
      fieldValue = source[veisObj ? (oe.field)! : rule.fieldPathStr!];
    }
    if (veisObj) {
      oe.field = oe.field || rule.fieldPathStr;
      oe.fieldValue = fieldValue;
      return oe;
    }
    return {
      message: typeof oe === "function" ? oe() : oe,
      fieldValue,
      field: rule.fieldPathStr,
    };
  };
}

/**
 * 合并两级对象
 *  键深度两级以上无法深度clone
 * 参考类型:ValidateMessages,它只有两级属性
 * @param target
 * @param source
 * @returns
 */
export function mergeMessage<T extends object>(
  target: T,
  source?: Partial<T>,
): T {
  if (!source) {
    return target;
  }
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sv = source[key],
        tv = target[key],
        OV = typeof sv === "object" && typeof tv === "object";
      Object.assign(target, {
        [key]: OV ? { ...tv, ...sv } : sv,
      });
    }
  }
  return target;
}
