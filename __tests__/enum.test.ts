import Schema from "../src/index.ts";
import { assertEquals } from "assert";

Deno.test("date", async (it) => {
  await it.step("run validation on `false`", () => {
    new Schema({
      v: {
        type: "enum",
        enum: [true],
      },
    }).validate(
      {
        v: false,
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v must be one of true");
      },
    );
  });
});
