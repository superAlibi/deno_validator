/* eslint no-console:0 */

// import { format } from 'https://deno.land/std@0.195.0/assert/_format.ts';
import {
  ValidateError,
  ValidateOption,
  RuleValuePackage,
  InternalRuleItem,
  SyncErrorType,
  Value,
  Values,
} from './interface.ts';
import { sprintf } from 'fmt'
// const formatRegExp = /%[sdj%]/g;

const ASYNC_VALIDATOR_NO_WARNING = Deno.env.get('ASYNC_VALIDATOR_NO_WARNING'),
  productionMode = Deno.env.get('production') === 'true'
type WarningFunc = (type: string, errors: SyncErrorType[]) => void
function getWaring(): WarningFunc {
  if (productionMode) return () => { }
  // don't print warning message when in production env or node runtime
  return (type, errors) => {
    if (console?.warn && ASYNC_VALIDATOR_NO_WARNING) {
      if (errors.every(e => typeof e === 'string')) {
        console.warn(type, errors);
      }
    }
  }
}
export const warning = getWaring();


export function convertFieldsError(
  errors: ValidateError[],
) {
  const fields: Record<string, ValidateError[]> = {};
  if (!errors || !errors.length) return fields;
  errors.forEach(error => {
    const field = error.field!;
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
  template: ((...args: any[]) => string) | string = '',
  ...args: any[]
): string {
  let i = 0;
  const len = args.length;
  if (typeof template === 'function') {
    return template.apply(null, args);
  }
  if (!(typeof template === 'string')) { return template }
  const str = template.replace(formatRegExp, x => {
    if (x === '%%') {
      return '%';
    }
    if (i >= len) {
      return x;
    }
    switch (x) {
      case '%s':
        return String(args[i++]);
      case '%d':
        return (Number(args[i++])).toString();
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  return str;

}


function isNativeStringType(type?: string) {
  return (
    type === 'string' ||
    type === 'url' ||
    type === 'hex' ||
    type === 'email' ||
    type === 'date' ||
    type === 'pattern'
  );
}

export function isEmptyValue(value: Value, type?: string) {
  if (value === undefined || value === null) {
    return true;
  }
  if (type === 'array' && Array.isArray(value) && !value.length) {
    return true;
  }
  if (isNativeStringType(type) && typeof value === 'string' && !value) {
    return true;
  }
  return false;
}

export function isEmptyObject(obj: object) {
  return Object.keys(obj).length === 0;
}

function asyncParallelArray(
  arr: RuleValuePackage[],
  func: ValidateFunc,
  onFinished: (errors: ValidateError[]) => void,
) {
  const results: ValidateError[] = [];
  let total = 0;
  const arrLength = arr.length;

  function count(errors: ValidateError[]) {
    results.push(...(errors || []));
    total++;
    if (total === arrLength) {
      onFinished(results);
    }
  }

  arr.forEach(a => {
    func(a, count);
  });
}

function asyncSerialArray(
  arr: RuleValuePackage[],
  validator: ValidateFunc,
  failureHandler: (errors: ValidateError[]) => void,
) {
  let index = 0;
  const arrLength = arr.length;
  function next(errors: ValidateError[]) {
    if (errors && errors.length) {
      failureHandler(errors);
      return;
    }
    const original = index;
    index = index + 1;
    if (original < arrLength) {
      validator(arr[original], next);
    } else {
      failureHandler([]);
    }
  }

  next([]);
}

/**
 * 将传入的属性:校验列表映射,打平并依次返回校验列表
 * @param ruleValuePackMap 
 * @returns 
 */
function flattenObjArr(ruleValuePackMap: Record<string, RuleValuePackage[]>): RuleValuePackage[] {
  return Object.entries(ruleValuePackMap).reduce((pre, [, arr]) => pre.concat(arr), [] as RuleValuePackage[]);
}

export class AsyncValidationError extends Error {
  constructor(
    public errors: ValidateError[],
    public fields: Record<string, ValidateError[]> | null,
  ) {
    super('Async Validation Error');
  }
}

type ValidateFunc = (
  data: RuleValuePackage,
  doIt: (errors: ValidateError[]) => void,
) => void;

export async function asyncMap(
  ruleValuePackMap: Record<string, RuleValuePackage[]>,
  option: ValidateOption,
  func: ValidateFunc,
  onFinished: (errors: ValidateError[]) => void,
  source: Values,
): Promise<Values> {
  if (option.shortCircuit) {
    return new Promise<Values>((resolve, reject) => {
      const next = (errors: ValidateError[]) => {
        onFinished(errors);
        return errors.length
          ? reject(new AsyncValidationError(errors, convertFieldsError(errors)))
          : resolve(source);
      };
      const flattenArr = flattenObjArr(ruleValuePackMap);
      asyncSerialArray(flattenArr, func, next);
    });
  }
  const firstFields =
    option.firstFields === true
      ? Object.keys(ruleValuePackMap)
      : option.firstFields || [];

  const objArrKeys = Object.keys(ruleValuePackMap);
  const objArrLength = objArrKeys.length;
  let total = 0;
  const results: ValidateError[] = [];
  return new Promise<Values>((resolve, reject) => {
    const next = (errors: ValidateError[]) => {
      results.push.apply(results, errors);
      total++;
      if (total === objArrLength) {
        onFinished(results);
        return results.length
          ? reject(
            new AsyncValidationError(results, convertFieldsError(results)),
          )
          : resolve(source);
      }
    };
    if (!objArrKeys.length) {
      onFinished(results);
      resolve(source);
    }
    objArrKeys.forEach(key => {
      const arr = ruleValuePackMap[key];
      if (firstFields.indexOf(key) !== -1) {
        asyncSerialArray(arr, func, next);
      } else {
        asyncParallelArray(arr, func, next);
      }
    });
  });

}

function isErrorObj(
  obj: ValidateError | string | (() => string),
): obj is ValidateError {
  return !!(obj && (obj as ValidateError).message !== undefined);
}

function getValue(value: Values, path: string[]) {
  let v = value;
  for (let i = 0; i < path.length; i++) {
    if (v == undefined) {
      return v;
    }
    v = v[path[i]];
  }
  return v;
}

export function complementError(rule: InternalRuleItem, source: Values) {
  return (oe: ValidateError | (() => string) | string): ValidateError => {
    let fieldValue;
    if (rule.fullFields) {
      fieldValue = getValue(source, rule.fullFields);
    } else {
      fieldValue = source[(oe as any).field || rule.fullField];
    }
    if (isErrorObj(oe)) {
      oe.field = oe.field || rule.fullField;
      oe.fieldValue = fieldValue;
      return oe;
    }
    return {
      message: typeof oe === 'function' ? oe() : oe,
      fieldValue,
      field: ((oe as unknown) as ValidateError).field || rule.fullField,
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
export function mergeMessage<T extends object>(target: T, source?: Partial<T>): T {
  if (!source) {
    return target;
  }
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sv = source[key],
        tv = target[key],
        OV = typeof sv === 'object' && typeof tv === 'object'
      Object.assign(target, {
        [key]: OV ? { ...tv, ...sv, } : sv
      })
    }
  }
  return target
}
