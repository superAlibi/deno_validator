import Schema from "../src/index.ts";
import { assertEquals } from "assert";

Deno.test("date", (it) => {
  it.step("works for the required object with fields in case of empty string", () => {
    new Schema({
      v: {
        type: "object",
        required: true,
        fields: {},
      },
    }).validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is not an object");
      },
    );
  });
});
