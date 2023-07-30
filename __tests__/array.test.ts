import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("array", async (it) => {
  await it.step("works for type", () => {
    new Schema({
      v: {
        type: "array",
      },
    }).validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is not an array");
      },
    );
  });

  await it.step("works for type and required", () => {
    new Schema({
      v: {
        required: true,
        type: "array",
      },
    }).validate(
      {
        v: "",
      },
      (errors, fields) => {
        assertEquals(errors?.length, 1);
        /* assertEquals(fields).toMatchInlineSnapshot(`
          Object {
            "v": Array [
              Object {
                "field": "v",
                "fieldValue": "",
                "message": "v is not an array",
              },
            ],
          }
        `); */
        assertEquals(errors?.[0]?.message, "v is not an array");
      },
    );
  });

  await it.step("works for none require", () => {
    new Schema({
      v: {
        type: "array",
      },
    }).validate(
      {
        v: [],
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for empty array", () => {
    new Schema({
      v: {
        required: true,
        type: "array",
      },
    }).validate(
      {
        v: [],
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is required");
      },
    );
  });

  await it.step("works for undefined array", () => {
    new Schema({
      v: {
        type: "array",
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

  await it.step("works for undefined array and required", () => {
    new Schema({
      v: {
        required: true,
        type: "array",
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

  await it.step("works for undefined array and defaultField", () => {
    new Schema({
      v: {
        type: "array",
        defaultField: { type: "string" },
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

  await it.step("works for null array", () => {
    new Schema({
      v: {
        required: true,
        type: "array",
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

  await it.step("works for none empty", () => {
    new Schema({
      v: {
        required: true,
        type: "array",
        message: "haha",
      },
    }).validate(
      {
        v: [1],
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for empty array with min", () => {
    new Schema({
      v: {
        min: 1,
        max: 3,
        type: "array",
      },
    }).validate(
      {
        v: [],
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(
          errors?.[0].message,
          "v must be between 1 and 3 in length",
        );
      },
    );
  });

  await it.step("works for empty array with max", () => {
    new Schema({
      v: {
        min: 1,
        max: 3,
        type: "array",
      },
    }).validate(
      {
        v: [1, 2, 3, 4],
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(
          errors?.[0].message,
          "v must be between 1 and 3 in length",
        );
      },
    );
  });
});
