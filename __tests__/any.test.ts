import Schema from '../src/index.ts';
import { assertEquals } from "assert";

const testNoErrorsFor = (value: unknown) => () => {
  new Schema({
    v: {
      type: 'any',
    },
  }).validate(
    {
      v: value,
    },
    errors => {
      assertEquals(errors, null);
    },
  );
};

const testRequiredErrorFor = (value: unknown) => () => {
  new Schema({
    v: {
      required: true,
      type: 'string',
    },
  }).validate(
    {
      v: value,
    },
    errors => {
      assertEquals(errors?.length, 1);
      assertEquals(errors?.[0].message, 'v is required');
    },
  );
};

Deno.test('any', (ctx) => {
  ctx.step('allows null', testNoErrorsFor(null));
  ctx.step('allows undefined', testNoErrorsFor(undefined));
  ctx.step('allows strings', testNoErrorsFor('foo'));
  ctx.step('allows numbers', testNoErrorsFor(1));
  ctx.step('allows booleans', testNoErrorsFor(false));
  ctx.step('allows arrays', testNoErrorsFor([]));
  ctx.step('allows objects', testNoErrorsFor({}));
  ctx.step('rejects undefined when required', testRequiredErrorFor(undefined));
  ctx.step('rejects null when required', testRequiredErrorFor(null));
})
