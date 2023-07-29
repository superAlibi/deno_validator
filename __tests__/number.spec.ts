import Schema from "../src/index.ts";
import { assertEquals } from "assert";

Deno.test("date", (it) => {
  it.step("works", () => {
    new Schema({
      v: {
        type: "number",
      },
    }).validate(
      {
        v: "1",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is not a number");
      },
    );
  });

  it.step("works for no-required", () => {
    new Schema({
      v: {
        type: "number",
      },
    }).validate(
      {
        v: undefined,
      },
      (errors) => {
        expect(errors).toBeFalsy();
      },
    );
  });

  it.step("works for no-required in case of empty string", () => {
    new Schema({
      v: {
        type: "number",
        required: false,
      },
    }).validate(
      {
        v: "",
      },
      (errors) => {
        expect(errors).toBeFalsy();
      },
    );
  });

  it.step("works for required", () => {
    new Schema({
      v: {
        type: "number",
        required: true,
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

  it.step("transform does not change value", () => {
    const value = {
      v: "1",
    };
    new Schema({
      v: {
        type: "number",
        transform: Number,
      },
    }).validate(value, (errors, data) => {
      expect(data).toEqual({
        v: 1,
      });
      assertEquals(value.v, "1");
      expect(errors).toBeFalsy();
    });
  });

  it.step("return transformed value in promise.then", () => {
    const value = {
      v: "1",
    };
    new Schema({
      v: {
        type: "number",
        transform: Number,
      },
    })
      .validate(value, (errors) => {
        assertEquals(value.v, "1");
        expect(errors).toBeFalsy();
      })
      .then((source) => {
        expect(source).toEqual({
          v: 1,
        });
      });
  });
});
