import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", async (it) => {
  await it.step("works for empty string", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for ip url", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "http://10.218.136.29/talent-tree/src/index.html",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for required empty string", () => {
    new Schema({
      v: {
        type: "url",
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

  await it.step("works for type url", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "http://www.taobao.com",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for type url has query", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "http://www.taobao.com/abc?a=a",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for type url has hash", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "http://www.taobao.com/abc#!abc",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for type url has query and has", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "http://www.taobao.com/abc?abc=%23&b=a~c#abc",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for type url has multi hyphen", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "https://www.tao---bao.com",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });

  await it.step("works for type not a valid url", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "http://www.taobao.com/abc?abc=%23&b=  a~c#abc    ",
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "v is not a valid url");
      },
    );
  });

  await it.step("support skip schema", () => {
    new Schema({
      v: {
        type: "url",
      },
    }).validate(
      {
        v: "//g.cn",
      },
      (errors) => {
        assertEquals(errors, null);
      },
    );
  });
});
