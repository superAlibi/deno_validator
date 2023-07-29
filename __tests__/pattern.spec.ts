import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", (it) => {
  it.step("works for non-required empty string", () => {
    new Schema({
      v: {
        pattern: /^\d+$/,
        message: "haha",
      },
    }).validate(
      {
        // useful for web, input's value defaults to ''
        v: "",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  it.step("work for non-required empty string with string regexp", () => {
    new Schema({
      v: {
        pattern: "^\\d+$",
        message: "haha",
      },
    }).validate(
      {
        // useful for web, input's value defaults to ''
        v: "s",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "haha");
      },
    );
  });

  it.step("works for required empty string", () => {
    new Schema({
      v: {
        pattern: /^\d+$/,
        message: "haha",
        required: true,
      },
    }).validate(
      {
        // useful for web, input's value defaults to ''
        v: "",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "haha");
      },
    );
  });

  it.step("works for non-required null", () => {
    new Schema({
      v: {
        pattern: /^\d+$/,
        message: "haha",
      },
    }).validate(
      {
        v: null,
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  it.step("works for non-required undefined", () => {
    new Schema({
      v: {
        pattern: /^\d+$/,
        message: "haha",
      },
    }).validate(
      {
        v: undefined,
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  it.step("works", () => {
    new Schema({
      v: {
        pattern: /^\d+$/,
        message: "haha",
      },
    }).validate(
      {
        v: " ",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "haha");
      },
    );
  });

  it.step("works for RegExp with global flag", () => {
    const schema = new Schema({
      v: {
        pattern: /global/g,
        message: "haha",
      },
    });

    schema.validate(
      {
        v: "globalflag",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );

    schema.validate(
      {
        v: "globalflag",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });
});
