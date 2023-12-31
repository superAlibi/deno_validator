import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", async (it) => {
  await it.step("works for none require", () => {
    let data = {
      v: "",
    };
    new Schema({
      v: {
        type: "string",
      },
    }).validate(data, (errors, d) => {
      assertEquals(errors, null);
      assertEquals(d, data);
    });
  });

  await it.step("works for empty string", () => {
    new Schema({
      v: {
        required: true,
        type: "string",
      },
    }).validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is required");
      },
    );
  });

  await it.step("works for undefined string", () => {
    new Schema({
      v: {
        required: true,
        type: "string",
      },
    }).validate(
      {
        v: undefined,
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is required");
      },
    );
  });

  await it.step("works for null string", () => {
    new Schema({
      v: {
        required: true,
        type: "string",
      },
    }).validate(
      {
        v: null,
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is required");
      },
    );
  });

  await it.step("works for message", () => {
    new Schema({
      v: {
        required: true,
        type: "string",
        message: "haha",
      },
    }).validate(
      {
        v: null,
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "haha");
      },
    );
  });

  await it.step("works for none empty", () => {
    new Schema({
      v: {
        required: true,
        type: "string",
        message: "haha",
      },
    }).validate(
      {
        v: " ",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for whitespace empty", () => {
    new Schema({
      v: {
        required: true,
        type: "string",
        whitespace: true,
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
});
