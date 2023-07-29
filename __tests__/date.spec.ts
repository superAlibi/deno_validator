import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", async (it) => {
  await it.step("required works for undefined", async () => {
    await new Schema({
      v: {
        type: "date",
        required: true,
      },
    }).validate(
      {
        v: undefined,
      },
      (errors) => {
        assertEquals(errors?.length || '', 1);
        assertEquals(errors?.[0].message || '', "v is required");
      },
    );
  });

  await it.step('required works for ""', async () => {
    await new Schema({
      v: {
        type: "date",
        required: true,
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

  await it.step("required works for non-date type", async () => {
    await new Schema({
      v: {
        type: "date",
        required: true,
      },
    }).validate(
      {
        v: {},
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is not a date");
      },
    );
  });

  await it.step('required works for "timestamp"', async () => {
    await new Schema({
      v: {
        type: "date",
        required: true,
      },
    }).validate(
      {
        v: 1530374400000,
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });
});
