import Schema from "../src/index.ts";
import { assertEquals } from "assert";

Deno.test("date", async (it) => {
  await it.step("works", () => {
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

  await it.step("works for no-required", () => {
    new Schema({
      v: {
        type: "number",
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

  await it.step("works for no-required in case of empty string", () => {
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
        assertEquals(!errors, true);
      },
    );
  });

  await it.step("works for required", () => {
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

  await it.step("transform does not change value", () => {
    const value = {
      v: "1",
    };
    new Schema({
      v: {
        type: "number",
        transform: Number,
      },
    }).validate(value, (errors, data) => {
      assertEquals(data, {
        v: 1,
      });
      assertEquals(value.v, "1");
      assertEquals(!errors, true);
    });
  });

  await it.step("return transformed value in promise.then", () => {
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
        assertEquals(!errors, true);
      })
      .then((source) => {
        assertEquals(source, {
          v: 1,
        });
      });
  });
});
