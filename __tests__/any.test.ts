import Schema from "../src/index.ts";
import { assertEquals } from "assert";

const testNoErrorsFor = (value: unknown) => () => {
  new Schema({
    v: {
      type: "any",
    },
  }).validate(
    {
      v: value,
    },
    (errors) => {
      assertEquals(errors, null);
    },
  );
};

const testRequiredErrorFor = (value: unknown) => () => {
  new Schema({
    v: {
      required: true,
      type: "string",
    },
  }).validate(
    {
      v: value,
    },
    (errors) => {
      assertEquals(errors?.length, 1);
      assertEquals(errors?.[0].message, "v is required");
    },
  );
};

Deno.test("any", async (ctx) => {
  await ctx.step("allows null", testNoErrorsFor(null));
  await ctx.step("allows undefined", testNoErrorsFor(undefined));
  await ctx.step("allows strings", testNoErrorsFor("foo"));
  await ctx.step("allows numbers", testNoErrorsFor(1));
  await ctx.step("allows booleans", testNoErrorsFor(false));
  await ctx.step("allows arrays", testNoErrorsFor([]));
  await ctx.step("allows objects", testNoErrorsFor({}));
  await ctx.step(
    "rejects undefined when required",
    testRequiredErrorFor(undefined),
  );
  await ctx.step("rejects null when required", testRequiredErrorFor(null));
});
