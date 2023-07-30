import Schema from "../src/index.ts";
import { assertEquals } from "assert";
const required = true;

Deno.test("date", async (it) => {
  await it.step("works for array required=true", () => {
    new Schema({
      v: [
        {
          required,
          message: "no",
        },
      ],
    }).validate(
      {
        v: [],
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "no");
      },
    );
  });

  await it.step("works for array required=true & custom message", () => {
    // allow custom message
    new Schema({
      v: [
        {
          required,
          message: "no",
        },
      ],
    }).validate(
      {
        v: [1],
      },
      (errors) => {
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("works for array required=false", () => {
    new Schema({
      v: {
        required: false,
      },
    }).validate(
      {
        v: [],
      },
      (errors) => {
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("works for string required=true", () => {
    new Schema({
      v: {
        required,
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

  await it.step("works for string required=false", () => {
    new Schema({
      v: {
        required: false,
      },
    }).validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("works for number required=true", () => {
    new Schema({
      v: {
        required,
      },
    }).validate(
      {
        v: 1,
      },
      (errors) => {
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("works for number required=false", () => {
    new Schema({
      v: {
        required: false,
      },
    }).validate(
      {
        v: 1,
      },
      (errors) => {
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("works for null required=true", () => {
    new Schema({
      v: {
        required,
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

  await it.step("works for null required=false", () => {
    new Schema({
      v: {
        required: false,
      },
    }).validate(
      {
        v: null,
      },
      (errors) => {
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("works for undefined required=true", () => {
    new Schema({
      v: {
        required,
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

  await it.step("works for undefined required=false", () => {
    new Schema({
      v: {
        required: false,
      },
    }).validate(
      {
        v: undefined,
      },
      (errors) => {
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("should support empty string message", () => {
    new Schema({
      v: {
        required,
        message: "",
      },
    }).validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "");
      },
    );
  });
});
