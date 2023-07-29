import { assertEquals } from "https://deno.land/std@0.195.0/assert/assert_equals.ts";
import Schema, {
  ValidateCallback,
  ValidateFieldsError,
  Values,
} from "../src/index.ts";

const callback: ValidateCallback = (errors, fields) => {
  if (!errors) {
    const f: Values = fields;
    console.log("transformed values:", f);
  } else {
    const f: ValidateFieldsError = fields;
    console.log("validate error:", f);
  }
};
Deno.test("self test", async (t) => {
  const result = await new Schema({
    v: {
      required: true,
      type: "array",
      defaultField: [{ type: "number", max: 2, transform: (i) => Number(i) }],
    },
  }).validate(
    {
      v: ["1", "2"],
    },
    callback,
  );

  assertEquals(result.v.length, 2);
});
/* .catch(({errors,fields})=>{
  console.error('err',errors);
  console.error('f',fields);

}) */
