import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", (it) => {
  it.step("works for unicode U+0000 to U+FFFF ", () => {
    new Schema({
      v: {
        type: "string",
        len: 4,
      },
    }).validate(
      {
        v: "吉吉吉吉",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  it.step("works for unicode gt U+FFFF ", () => {
    new Schema({
      v: {
        type: "string",
        len: 4, // 原来length属性应该为8，更正之后应该为4
      },
    }).validate(
      {
        v: "𠮷𠮷𠮷𠮷",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  it.step("Rich Text Format", () => {
    new Schema({
      v: {
        type: "string",
        len: 2,
      },
    }).validate(
      {
        v: "💩💩",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });
});
