import string from './string.ts';
import method from './method.ts';
import number from './number.ts';
import boolean from './boolean.ts';
import regexp from './regexp.ts';
import integer from './integer.ts';
import float from './float.ts';
import array from './array.ts';
import object from './object.ts';
import enumValidator from './enum.ts';
import pattern from './pattern.ts';
import date from './date.ts';
import required from './required.ts';
import fromValidator from './type.ts';
import anyValidator from './any.ts';
import { ExecuteValidator } from '../interface.ts';

const exportInfo: Record<string, ExecuteValidator> = {
  string,
  method,
  number,
  boolean,
  regexp,
  integer,
  float,
  array,
  object,
  enum: enumValidator,
  pattern,
  date,
  url: fromValidator,
  hex: fromValidator,
  email: fromValidator,
  required,
  any: anyValidator,
}

export default exportInfo;
